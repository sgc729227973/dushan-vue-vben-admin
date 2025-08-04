import type {
  CustomerServicePayload,
  IWebSocketService,
  WebSocketMessage,
} from '../types';

import { WebSocketMessageType } from '../types';

/**
 * 客服消息处理器
 * 处理WebSocket客服类型的消息
 * 此处为占位实现，可根据实际需求扩展
 */
export function customerServiceHandler(event: MessageEvent) {
  try {
    const data = JSON.parse(event.data) as WebSocketMessage;

    // 处理客服类型消息
    if (data.type === WebSocketMessageType.CUSTOMER_SERVICE && data.payload) {
      const payload = data.payload as CustomerServicePayload;
      console.warn(payload);
      // 这里可以添加客服消息的处理逻辑
      // 例如：更新客服会话、显示消息提醒等
    }
  } catch {
    // 静默失败
  }
}

/**
 * 注册客服消息处理器
 * @param websocketService WebSocket服务实例
 */
export function registerCustomerServiceHandler(
  websocketService: IWebSocketService,
) {
  websocketService.addMessageHandler(customerServiceHandler);
}
