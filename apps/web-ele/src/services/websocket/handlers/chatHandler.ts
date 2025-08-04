import type {
  ChatPayload,
  IWebSocketService,
  WebSocketMessage,
} from '../types';

import { WebSocketMessageType } from '../types';

/**
 * 聊天消息处理器
 * 处理WebSocket聊天类型的消息
 * 此处为占位实现，可根据实际需求扩展
 */
export function chatHandler(event: MessageEvent) {
  try {
    const data = JSON.parse(event.data) as WebSocketMessage;

    // 处理聊天类型消息
    if (data.type === WebSocketMessageType.CHAT && data.payload) {
      const payload = data.payload as ChatPayload;
      console.warn(payload);
      // 这里可以添加聊天消息的处理逻辑
      // 例如：更新聊天列表、显示消息提醒等
    }
  } catch {
    // 静默失败
  }
}

/**
 * 注册聊天消息处理器
 * @param websocketService WebSocket服务实例
 */
export function registerChatHandler(websocketService: IWebSocketService) {
  websocketService.addMessageHandler(chatHandler);
}
