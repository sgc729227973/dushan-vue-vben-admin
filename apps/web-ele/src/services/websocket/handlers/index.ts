import type { IWebSocketService } from '../types';

import { registerChatHandler } from './chatHandler';
import { registerCustomerServiceHandler } from './customerServiceHandler';
import { registerDataUpdateHandler } from './dataUpdateHandler';
import { registerNotificationHandler } from './notificationHandler';
import { registerServerMonitorHandler } from './serverMonitorHandler';
import { registerSystemHandler } from './systemHandler';
import { registerTestHandler } from './testHandler';

/**
 * 初始化所有WebSocket消息处理器
 * @param websocketService WebSocket服务实例
 */
export function initWebSocketHandlers(websocketService: IWebSocketService) {
  // 注册系统消息处理器
  registerSystemHandler(websocketService);

  // 注册通知公告处理器
  registerNotificationHandler(websocketService);

  // 注册聊天消息处理器
  registerChatHandler(websocketService);

  // 注册数据更新处理器
  registerDataUpdateHandler(websocketService);

  // 注册客服消息处理器
  registerCustomerServiceHandler(websocketService);

  // 注册服务器监控处理器
  registerServerMonitorHandler(websocketService);

  // 注册测试处理器
  registerTestHandler(websocketService);
}

export * from './chatHandler';
export * from './customerServiceHandler';
export * from './dataUpdateHandler';
export * from './notificationHandler';
export * from './serverMonitorHandler';
export * from './systemHandler';
export * from './testHandler';
