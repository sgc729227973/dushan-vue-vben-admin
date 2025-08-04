import type {
  DataUpdatePayload,
  IWebSocketService,
  WebSocketMessage,
} from '../types';

import { WebSocketMessageType } from '../types';

// 用于存储服务器监控数据更新的回调函数
const serverMonitorCallbacks = new Set<(data: any) => void>();

/**
 * 服务器监控消息处理器
 * 处理WebSocket服务器监控数据更新类型的消息
 */
export function serverMonitorHandler(event: MessageEvent) {
  try {
    // 尝试解析JSON数据
    const data = JSON.parse(event.data) as WebSocketMessage;

    // 处理数据更新类型消息
    if (data.type === WebSocketMessageType.DATA_UPDATE && data.payload) {
      const payload = data.payload as DataUpdatePayload;

      // 检查是否为服务器监控数据更新
      if (payload.entity === 'server_monitor') {
        // 通知所有注册的回调函数
        serverMonitorCallbacks.forEach((callback) => {
          try {
            callback(payload.data);
          } catch (error) {
            console.error('Error in server monitor callback:', error);
          }
        });
      }
    }

    // 处理服务器监控数据响应消息
    if (data.type === 'get_server_monitor_data_response' && data.payload) {
      // 通知所有注册的回调函数
      serverMonitorCallbacks.forEach((callback) => {
        callback(data.payload);
      });
    }
  } catch (error) {
    // 静默失败，避免影响其他处理器
    if (import.meta.env.DEV) {
      console.warn('Failed to parse server monitor message:', error);
    }
  }
}

/**
 * 注册服务器监控消息处理器
 * @param websocketService WebSocket服务实例
 */
export function registerServerMonitorHandler(
  websocketService: IWebSocketService,
) {
  websocketService.addMessageHandler(serverMonitorHandler);
}

/**
 * 添加服务器监控数据更新回调
 * @param callback 回调函数
 */
export function addServerMonitorCallback(callback: (data: any) => void) {
  serverMonitorCallbacks.add(callback);
}

/**
 * 移除服务器监控数据更新回调
 * @param callback 回调函数
 */
export function removeServerMonitorCallback(callback: (data: any) => void) {
  serverMonitorCallbacks.delete(callback);
}
