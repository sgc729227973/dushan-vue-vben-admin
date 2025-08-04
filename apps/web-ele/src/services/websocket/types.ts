import type { Ref } from 'vue';

/**
 * WebSocket消息处理器类型
 */
export type WebSocketHandler = (event: MessageEvent) => void;

/**
 * WebSocket连接状态
 */
export type WebSocketStatus = 'CLOSED' | 'CONNECTING' | 'ERROR' | 'OPEN';

/**
 * WebSocket消息类型
 */
export const WebSocketMessageType = {
  // 系统消息类型
  PING: 'ping',
  PONG: 'pong',
  ERROR: 'error',
  AUTH: 'auth',

  // 业务消息类型
  NOTICE: 'notification', // 通知公告
  CHAT: 'chat', // 聊天消息
  DATA_UPDATE: 'data', // 数据更新
  CUSTOMER_SERVICE: 'cs', // 客服消息
} as const;

/**
 * 通知消息结构
 */
export interface NoticePayload {
  event: string;
  notice: {
    [key: string]: any;
    content: string;
    create_time: string;
    id: number;
    status: number;
    title: string;
    type: number;
  };
  sender_id: string;
  target_client_ids: null | string[];
}

/**
 * 聊天消息结构
 */
export interface ChatPayload {
  message: string;
  from_user_id: number;
  to_user_id: number;
  message_id: string;
  timestamp: string;
  [key: string]: any;
}

/**
 * 数据更新消息结构
 */
export interface DataUpdatePayload {
  entity: string;
  action: 'create' | 'delete' | 'update';
  data: Record<string, any>;
  [key: string]: any;
}

/**
 * 客服消息结构
 */
export interface CustomerServicePayload {
  message: string;
  session_id: string;
  from_type: 'customer' | 'service';
  timestamp: string;
  [key: string]: any;
}

/**
 * WebSocket消息通用结构
 */
export interface WebSocketMessage {
  code: number;
  exclude_client_ids: null | string[];
  msg: null | string;
  payload:
    | ChatPayload
    | CustomerServicePayload
    | DataUpdatePayload
    | NoticePayload
    | Record<string, any>;
  type: string;
}

/**
 * WebSocket服务配置
 */
export interface WebSocketConfig {
  baseUrl: string;
  heartbeatInterval: number;
  maxReconnectAttempts: number;
  reconnectInterval: number;
  debug: boolean;
}

/**
 * WebSocket服务接口
 */
export interface IWebSocketService {
  connect(): void;
  disconnect(): void;
  getStatus(): Ref<WebSocketStatus>;
  isConnected(): boolean;
  addMessageHandler(handler: WebSocketHandler): void;
  removeMessageHandler(handler: WebSocketHandler): void;
  sendMessage(message: any): boolean;
  sendPing(): boolean;
}
