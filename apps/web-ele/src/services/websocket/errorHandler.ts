import type { WebSocketMessage } from './types';

import { ElMessage } from 'element-plus';

/**
 * WebSocket错误处理器
 * 处理所有code不为0的消息，显示错误信息
 * @param message WebSocket消息
 * @returns 如果消息已被处理为错误，返回true；否则返回false
 */
export function handleWebSocketError(message: WebSocketMessage): boolean {
  // 只处理非零code的消息
  if (message.code !== 0) {
    // 显示错误消息
    if (message.msg) {
      ElMessage.error(message.msg);
    } else {
      ElMessage.error(`WebSocket错误: 代码 ${message.code}`);
    }
    return true;
  }
  return false;
}
