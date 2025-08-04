/**
 * WebSocket管理模块
 * 提供注册WebSocket连接和断开回调的机制
 */

// 连接回调类型
export type WebSocketConnectCallback = () => void;

// 断开连接回调类型
export type WebSocketDisconnectCallback = () => void;

// 存储注册的回调函数
const connectCallbacks: WebSocketConnectCallback[] = [];
const disconnectCallbacks: WebSocketDisconnectCallback[] = [];

/**
 * 注册WebSocket连接回调
 * @param callback 连接回调函数
 */
export function registerConnectCallback(callback: WebSocketConnectCallback) {
  if (typeof callback === 'function' && !connectCallbacks.includes(callback)) {
    connectCallbacks.push(callback);
    return true;
  }
  return false;
}

/**
 * 注册WebSocket断开连接回调
 * @param callback 断开连接回调函数
 */
export function registerDisconnectCallback(
  callback: WebSocketDisconnectCallback,
) {
  if (
    typeof callback === 'function' &&
    !disconnectCallbacks.includes(callback)
  ) {
    disconnectCallbacks.push(callback);
    return true;
  }
  return false;
}

/**
 * 移除WebSocket连接回调
 * @param callback 要移除的连接回调函数
 */
export function removeConnectCallback(callback: WebSocketConnectCallback) {
  const index = connectCallbacks.indexOf(callback);
  if (index !== -1) {
    connectCallbacks.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * 移除WebSocket断开连接回调
 * @param callback 要移除的断开连接回调函数
 */
export function removeDisconnectCallback(
  callback: WebSocketDisconnectCallback,
) {
  const index = disconnectCallbacks.indexOf(callback);
  if (index !== -1) {
    disconnectCallbacks.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * 触发所有WebSocket连接回调
 */
export function triggerConnectCallbacks() {
  connectCallbacks.forEach((callback) => {
    try {
      callback();
    } catch (error) {
      console.error('执行WebSocket连接回调出错:', error);
    }
  });
}

/**
 * 触发所有WebSocket断开连接回调
 */
export function triggerDisconnectCallbacks() {
  disconnectCallbacks.forEach((callback) => {
    try {
      callback();
    } catch (error) {
      console.error('执行WebSocket断开连接回调出错:', error);
    }
  });
}

export default {
  registerConnectCallback,
  registerDisconnectCallback,
  removeConnectCallback,
  removeDisconnectCallback,
  triggerConnectCallbacks,
  triggerDisconnectCallbacks,
};
