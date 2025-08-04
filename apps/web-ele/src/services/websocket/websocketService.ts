import type {
  IWebSocketService,
  WebSocketConfig,
  WebSocketHandler,
  WebSocketMessage,
  WebSocketStatus,
} from './types';

import { ref } from 'vue';

import { useAccessStore } from '@vben/stores';

import { ElMessage } from 'element-plus';

import { handleTokenRefreshFailure } from '../auth/refreshToken';
import { getTokenRefresher } from '../auth/tokenScheduler';
import { handleWebSocketError } from './errorHandler';

/**
 * WebSocket服务实现
 * 负责WebSocket连接的建立、维护、消息发送和接收
 */
export class WebSocketService implements IWebSocketService {
  private authRetryCount = 0; // 当前认证重试次数
  private readonly boundHandleClose = this.handleClose.bind(this);
  private readonly boundHandleError = this.handleError.bind(this);
  private readonly boundHandleMessage = this.handleMessage.bind(this);
  // 预绑定事件处理器，避免重复 bind 及方便移除监听
  private readonly boundHandleOpen = this.handleOpen.bind(this);
  private config: WebSocketConfig;
  private connecting = false; // 防止重复连接
  private heartbeatTimer: null | number = null;
  // 添加认证重试相关属性
  private readonly MAX_AUTH_RETRY = 3; // 认证失败最多重试3次
  private messageHandlers: Set<WebSocketHandler> = new Set();
  // 心跳超时定时器
  private pingTimeoutTimer: null | number = null;
  private reconnectAttempts = 0;
  private status = ref<WebSocketStatus>('CLOSED');
  private ws: null | WebSocket = null;

  /**
   * 构造函数
   * @param config WebSocket配置
   */
  constructor(config?: Partial<WebSocketConfig>) {
    // 默认配置
    const defaultConfig: WebSocketConfig = {
      // 统一将 http → ws, https → wss
      baseUrl: `${import.meta.env.VITE_BASE_URL}/infra/ws`.replace(
        /^http/i,
        'ws',
      ),
      heartbeatInterval: 30_000, // 30秒
      maxReconnectAttempts: 5,
      reconnectInterval: 3000,
      debug: import.meta.env.DEV,
    };

    // 合并配置
    this.config = { ...defaultConfig, ...config };

    // 初始化网络状态监听
    this.initializeNetworkListeners();
  }

  /**
   * 添加消息处理器
   * @param handler 消息处理函数
   */
  addMessageHandler(handler: WebSocketHandler) {
    this.messageHandlers.add(handler);
  }

  /**
   * 连接WebSocket
   */
  connect() {
    // 防止重复连接
    if (this.connecting) return;

    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const accessStore = useAccessStore();
    const accessToken = accessStore.accessToken;
    if (!accessToken) {
      return;
    }

    // 获取租户ID
    const tenantId = accessStore.tenantId;

    // 构建WebSocket URL，包含token、租户、访客租户ID
    let wsUrl = `${this.config.baseUrl}?token=${accessToken}`;

    if (tenantId) wsUrl += `&tenant_id=${tenantId}`;
    // 访客租户ID
    const visitTenantId = accessStore.visitTenantId;
    if (visitTenantId) wsUrl += `&visit_tenant_id=${visitTenantId}`;

    this.status.value = 'CONNECTING';
    this.connecting = true;

    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.binaryType = 'blob';

      this.ws.addEventListener('open', this.boundHandleOpen);
      this.ws.addEventListener('message', this.boundHandleMessage);
      this.ws.addEventListener('error', this.boundHandleError);
      this.ws.addEventListener('close', this.boundHandleClose);
    } catch {
      this.status.value = 'ERROR';
      this.ws = null;
      this.connecting = false;
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (!this.ws) return;

    try {
      // 移除事件监听，防止内存泄漏
      this.ws.removeEventListener('open', this.boundHandleOpen);
      this.ws.removeEventListener('message', this.boundHandleMessage);
      this.ws.removeEventListener('error', this.boundHandleError);
      this.ws.removeEventListener('close', this.boundHandleClose);

      this.ws.close(1000, JSON.stringify({ message: '用户主动断开连接' }));
    } catch {
      // 静默失败
    } finally {
      this.ws = null;
      this.status.value = 'CLOSED';
      this.stopHeartbeat();
      this.connecting = false;
    }
  }

  /**
   * 获取连接状态
   * @returns 连接状态的响应式引用
   */
  getStatus() {
    return this.status;
  }

  /**
   * 是否已连接
   * @returns 是否已连接
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * 移除消息处理器
   * @param handler 要移除的消息处理函数
   */
  removeMessageHandler(handler: WebSocketHandler) {
    this.messageHandlers.delete(handler);
  }

  /**
   * 发送消息
   * @param message 要发送的消息
   * @returns 是否发送成功
   */
  sendMessage(message: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      ElMessage.warning('WebSocket未连接');
      return false;
    }

    try {
      const messageStr =
        typeof message === 'string' ? message : JSON.stringify(message);
      this.ws.send(messageStr);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * 发送心跳
   * @returns 是否发送成功
   */
  sendPing() {
    // 清理旧的超时检测
    if (this.pingTimeoutTimer !== null) {
      window.clearTimeout(this.pingTimeoutTimer);
      this.pingTimeoutTimer = null;
    }

    // 设置超时检测：若 1.5 * interval 未收到 pong，则主动关闭连接以触发重连
    this.pingTimeoutTimer = window.setTimeout(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.close();
        } catch {}
      }
    }, this.config.heartbeatInterval * 1.5);

    return this.sendMessage({
      type: 'ping',
      payload: { client_timestamp: new Date().toISOString() },
    });
  }

  /**
   * 处理连接关闭事件
   * @param event 关闭事件
   */
  private async handleClose(event: CloseEvent) {
    try {
      // 在关闭前移除事件监听，避免潜在内存泄漏
      if (this.ws) {
        try {
          this.ws.removeEventListener('open', this.boundHandleOpen);
          this.ws.removeEventListener('message', this.boundHandleMessage);
          this.ws.removeEventListener('error', this.boundHandleError);
          this.ws.removeEventListener('close', this.boundHandleClose);
        } catch {}
      }

      this.status.value = 'CLOSED';
      this.ws = null;
      this.stopHeartbeat();
      this.connecting = false;

      // 解析关闭原因
      const closeCode = event.code;

      // 处理认证失败 (4001)
      if (closeCode === 4001) {
        // 检查认证重试次数
        if (this.authRetryCount < this.MAX_AUTH_RETRY) {
          this.authRetryCount++;

          try {
            // 使用令牌刷新器刷新令牌
            const tokenRefresher = getTokenRefresher();
            const success = await tokenRefresher.refresh();

            if (success) {
              // 刷新成功，立即重连
              setTimeout(() => this.connect(), 500); // 短暂延迟确保令牌更新完成
              return; // 不执行后续的重连逻辑
            } else {
              // 刷新失败，但未达到最大重试次数，继续常规重连
              if (this.authRetryCount < this.MAX_AUTH_RETRY) {
                // 继续执行后面的常规重连逻辑
              } else {
                // 达到最大重试次数，执行登出
                await handleTokenRefreshFailure();
                return;
              }
            }
          } catch {
            // 刷新失败，执行登出
            if (this.authRetryCount >= this.MAX_AUTH_RETRY) {
              await handleTokenRefreshFailure();
            }
            return;
          }
        } else {
          // 重置认证重试计数
          this.authRetryCount = 0;
          // 执行登出
          await handleTokenRefreshFailure();
          return;
        }
      } else {
        // 非认证错误，重置认证重试计数
        this.authRetryCount = 0;
      }

      // 常规重连逻辑（保持原有的指数回退）
      if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.reconnectAttempts++;

        const base = this.config.reconnectInterval;
        const exp = 2 ** (this.reconnectAttempts - 1);
        const jitter = 0.75 + Math.random() * 0.5; // 0.75~1.25
        const delay = Math.min(base * exp * jitter, 60_000);

        setTimeout(() => {
          this.connect();
        }, delay);
      }
    } catch {
      // 捕获整个处理流程中的异常，确保不会中断
      this.connecting = false;
    }
  }

  /**
   * 处理错误事件
   */
  private handleError() {
    this.status.value = 'ERROR';
    this.connecting = false;
  }

  /**
   * 处理收到消息事件
   * @param event 消息事件
   */
  private handleMessage(event: MessageEvent) {
    // 尝试解析 JSON
    let parsed: any = null;
    try {
      parsed = JSON.parse(event.data as string);
    } catch {}

    // 处理心跳响应 (兼容字符串和 JSON 格式)
    if (
      (event.data === 'pong' || parsed?.type === 'pong') && // 清除心跳超时定时器
      this.pingTimeoutTimer !== null
    ) {
      window.clearTimeout(this.pingTimeoutTimer);
      this.pingTimeoutTimer = null;
    }

    // 全局错误处理：检查是否为错误消息（code !== 0）
    if (parsed && typeof parsed === 'object') {
      const message = parsed as WebSocketMessage;
      // 处理错误消息，但不阻止分发
      handleWebSocketError(message);
    }

    // 分发消息给所有处理器
    this.messageHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch {
        // 静默失败
      }
    });
  }

  /**
   * 处理连接打开事件
   */
  private handleOpen() {
    this.status.value = 'OPEN';
    this.reconnectAttempts = 0;
    this.authRetryCount = 0; // 连接成功时重置认证重试计数
    this.connecting = false;

    // 启动心跳
    this.startHeartbeat();
  }

  /**
   * 初始化网络状态监听
   */
  private initializeNetworkListeners() {
    window.addEventListener('offline', () => {
      this.stopHeartbeat();
    });

    window.addEventListener('online', () => {
      if (!this.isConnected()) this.connect();
    });

    // 页面从隐藏恢复时，若连接已断开则尝试重连
    document.addEventListener('visibilitychange', () => {
      if (
        document.visibilityState === 'visible' &&
        !this.isConnected() &&
        navigator.onLine
      ) {
        this.connect();
      }
    });
  }

  /**
   * 启动心跳机制
   */
  private startHeartbeat() {
    this.stopHeartbeat(); // 先清除可能存在的定时器

    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendPing();
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.pingTimeoutTimer !== null) {
      window.clearTimeout(this.pingTimeoutTimer);
      this.pingTimeoutTimer = null;
    }
  }
}
