import {
  registerConnectCallback,
  registerDisconnectCallback,
} from '@vben/request';

import { initWebSocketHandlers } from './handlers';
import { WebSocketService } from './websocketService';

// 创建WebSocket服务实例
export const websocketService = new WebSocketService();

// 初始化WebSocket服务
export function initWebSocketService() {
  // 注册所有消息处理器
  initWebSocketHandlers(websocketService);
}
const disconnectWebSocket = () => {
  websocketService.disconnect();
};
registerDisconnectCallback(disconnectWebSocket);

// 当刷新 token 成功后，重新建立 WebSocket 连接
const connectWebSocket = () => {
  websocketService.connect();
};
registerConnectCallback(connectWebSocket);

export * from './handlers';
export * from './types';
export * from './websocketService';

export default {
  websocketService,
  initWebSocketService,
};
