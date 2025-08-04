import type {
  DataUpdatePayload,
  IWebSocketService,
  WebSocketMessage,
} from '../types';

import { WebSocketMessageType } from '../types';

/**
 * 数据更新消息处理器
 * 处理WebSocket数据更新类型的消息
 * 此处为占位实现，可根据实际需求扩展
 */
export function dataUpdateHandler(event: MessageEvent) {
  try {
    const data = JSON.parse(event.data) as WebSocketMessage;

    // 处理数据更新类型消息
    if (data.type === WebSocketMessageType.DATA_UPDATE && data.payload) {
      const payload = data.payload as DataUpdatePayload;
      console.warn(payload);
      // 这里可以添加数据更新的处理逻辑
      // 例如：刷新列表、更新缓存等
    }
  } catch {
    // 静默失败
  }
}

/**
 * 注册数据更新消息处理器
 * @param websocketService WebSocket服务实例
 */
export function registerDataUpdateHandler(websocketService: IWebSocketService) {
  websocketService.addMessageHandler(dataUpdateHandler);
}
