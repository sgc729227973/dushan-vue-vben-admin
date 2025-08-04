import type { IWebSocketService } from '../types';

/**
 * 系统消息处理器
 * 处理WebSocket系统类型的消息，如错误、认证等
 */
export function systemHandler(event: MessageEvent) {
  try {
    // 处理心跳响应
    if (event.data === 'pong') {
      // 心跳响应处理
    }
  } catch {}
}

/**
 * 注册系统消息处理器
 * @param websocketService WebSocket服务实例
 */
export function registerSystemHandler(websocketService: IWebSocketService) {
  websocketService.addMessageHandler(systemHandler);
}
