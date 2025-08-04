// 重新引入类型，用于注册处理器
import type { IWebSocketService } from '../types';

import { ref } from 'vue';

import { formatDate } from '@vben/utils';

import { ElMessage } from 'element-plus';

import { MessageType } from '#/api/infra/websocket';

// 消息类型常量
export const TEXT = MessageType.TEXT;
export const IMAGE = MessageType.IMAGE;
export const AUDIO = MessageType.AUDIO;
export const VIDEO = MessageType.VIDEO;
export const FILE = MessageType.FILE;

// 日志类型
export type LogType =
  | 'audio_received'
  | 'auth'
  | 'error'
  | 'event'
  | 'file_received'
  | 'image_received'
  | 'info'
  | 'received'
  | 'sent'
  | 'video_received';

// 日志条目
export interface LogEntry {
  type: LogType;
  message: string;
  time: number;
  mediaType?: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
}

// 发送日志和接收日志 - 使用响应式数组
export const sentLogs = ref<LogEntry[]>([]);
export const receivedLogs = ref<LogEntry[]>([]);

// 消息发送相关数据
export const messageType = ref('custom');
export const messageTypes = [
  { value: 'custom', label: '自定义消息' },
  { value: 'ping', label: '心跳检测' },
  { value: 'get_user_info', label: '获取用户信息' },
  { value: 'get_app_config', label: '获取应用配置' },
];

export const messageContent = ref(
  JSON.stringify(
    {
      type: 'ping',
      payload: { timestamp: '...' },
    },
    null,
    2,
  ),
);

// 用户列表
export const userList = ref<any[]>([]);
export const selectedUserId = ref<number>();

// 广播消息
export const broadcastMsgContent = ref(
  JSON.stringify(
    {
      type: 'broadcast',
      payload: {
        event: 'new_announcement',
        title: '系统通知',
        content: '系统将于 2 小时后进行维护',
      },
    },
    null,
    2,
  ),
);
export const broadcastFileUrl = ref<string>('');
export const broadcastMsgType = ref(TEXT);

// 向指定用户发送消息
export const targetUserMessage = ref(
  JSON.stringify(
    {
      type: 'notify',
      payload: {
        title: '私人提醒',
        content: '您的会议即将开始',
      },
    },
    null,
    2,
  ),
);
export const targetUserType = ref(2); // 默认管理员
export const targetUserFileUrl = ref<string>('');
export const targetUserMsgType = ref(TEXT);

// 处理广播文件上传成功
export function handleBroadcastUploadSuccess(url: string) {
  broadcastFileUrl.value = url;
  ElMessage.success(`文件上传成功，可以发送消息了`);
}

// 处理用户消息文件上传成功
export function handleUserUploadSuccess(url: string) {
  targetUserFileUrl.value = url;
  ElMessage.success(`文件上传成功，可以发送消息了`);
}

// 获取消息类型文本
export function getMessageTypeText(type: MessageType): string {
  switch (type) {
    case AUDIO: {
      return '音频';
    }
    case FILE: {
      return '文件';
    }
    case IMAGE: {
      return '图片';
    }
    case TEXT: {
      return '文本';
    }
    case VIDEO: {
      return '视频';
    }
    default: {
      return '未知';
    }
  }
}

// 复制到剪贴板的函数
export function copyToClipboard(text: string) {
  try {
    // 创建一个临时文本区域
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.append(textArea);
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
    ElMessage.success('已复制到剪贴板');
  } catch (error) {
    ElMessage.error('复制失败');
    console.error('复制失败:', error);
  }
}

/**
 * 添加日志
 */
export function addLog(
  type: LogType,
  message: string,
  mediaInfo?: {
    fileName?: string;
    fileSize?: number;
    mediaType?: string;
    mediaUrl?: string;
  },
) {
  const logEntry: LogEntry = {
    type,
    message,
    time: Date.now(),
    ...mediaInfo,
  };

  if (type === 'sent') {
    sentLogs.value.push(logEntry);
  } else if (type === 'received' || type.includes('received')) {
    receivedLogs.value.push(logEntry);
  } else {
    // 其他类型的日志添加到两边
    sentLogs.value.push(logEntry);
    receivedLogs.value.push(logEntry);
  }
}

// 清空日志
export function clearSentLogs() {
  sentLogs.value.length = 0;
  ElMessage.success('发送日志已清空');
}

export function clearReceivedLogs() {
  receivedLogs.value.length = 0;
  ElMessage.success('接收日志已清空');
}

// 格式化日志时间
export function formatLogTime(time: number) {
  return formatDate(time, 'YYYY-MM-DD HH:mm:ss.SSS');
}

// 格式化文件大小
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = Math.max(decimals, 0);
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

// 消息类型选项
export const messageTypeOptions = [
  { value: TEXT, label: '文本消息' },
  { value: IMAGE, label: '图片消息' },
  { value: AUDIO, label: '音频消息' },
  { value: VIDEO, label: '视频消息' },
  { value: FILE, label: '文件消息' },
];

// 打开URL
export function openUrl(url: string | undefined) {
  if (url) {
    window.open(url, '_blank');
  }
}

// 获取日志类型对应的标签类型
export function getLogTagType(type: LogType) {
  switch (type) {
    case 'audio_received': {
      return 'success';
    }
    case 'auth': {
      return 'info';
    }
    case 'error': {
      return 'danger';
    }
    case 'event': {
      return 'primary';
    }
    case 'file_received': {
      return 'success';
    }
    case 'image_received': {
      return 'success';
    }
    case 'info': {
      return 'info';
    }
    case 'received': {
      return 'success';
    }
    case 'sent': {
      return 'warning';
    }
    case 'video_received': {
      return 'success';
    }
    default: {
      return 'info';
    }
  }
}

// 获取日志类型文本
export function getLogTypeText(type: LogType) {
  switch (type) {
    case 'audio_received': {
      return '音频';
    }
    case 'auth': {
      return '认证';
    }
    case 'error': {
      return '错误';
    }
    case 'event': {
      return '事件';
    }
    case 'file_received': {
      return '文件';
    }
    case 'image_received': {
      return '图片';
    }
    case 'info': {
      return '信息';
    }
    case 'received': {
      return '接收';
    }
    case 'sent': {
      return '发送';
    }
    case 'video_received': {
      return '视频';
    }
    default: {
      return '未知';
    }
  }
}

/**
 * 测试处理器
 * 处理WebSocket测试页面的消息
 */
export function testHandler(event: MessageEvent) {
  try {
    // 处理非JSON消息
    if (typeof event.data !== 'string') {
      addLog('received', `收到非文本消息: ${typeof event.data}`);
      return;
    }

    // 尝试解析 JSON 消息
    const data = JSON.parse(event.data);

    // 调试输出（仅在开发环境）
    if (import.meta.env.DEV) {
      console.warn('WebSocket 收到消息:', data);
    }

    // 处理心跳响应
    if (data.type === 'pong') {
      const payload = data.payload || {};
      const clientTime = payload.client_timestamp || '...';
      const serverTime = payload.server_timestamp || '';
      addLog(
        'received',
        `收到心跳响应: pong (客户端时间: ${clientTime}, 服务器时间: ${serverTime})`,
      );
      return;
    }

    // 处理用户信息响应
    if (data.type === 'get_user_info_resp') {
      addLog('received', `收到用户信息响应: ${JSON.stringify(data, null, 2)}`);
      return;
    }

    // 处理应用配置响应
    if (data.type === 'get_app_config_resp') {
      addLog('received', `收到应用配置响应: ${JSON.stringify(data, null, 2)}`);
      return;
    }

    // 处理不同格式的消息
    if (data.type) {
      // 尝试解析payload字段
      const payload = data.payload || {};

      switch (data.type) {
        case 'audio': {
          // 音频消息
          const fileUrl = payload.file_url;
          if (fileUrl) {
            addLog('audio_received', `收到音频消息`, {
              mediaType: 'audio',
              mediaUrl: fileUrl,
              fileName: `音频_${Date.now()}`,
              fileSize: 0,
            });
          } else {
            addLog(
              'received',
              `收到音频消息但缺少URL: ${JSON.stringify(data, null, 2)}`,
            );
          }
          break;
        }
        case 'broadcast': {
          // 广播消息，根据 payload.file_type 决定展示形式
          const fileType = payload.file_type;
          const fileUrl = payload.file_url;

          // 没有 file_type 时，按普通文本处理
          if (!fileType) {
            addLog(
              'received',
              `收到广播消息: ${JSON.stringify(data, null, 2)}`,
            );
            break;
          }

          switch (fileType) {
            case AUDIO: {
              if (fileUrl) {
                addLog('audio_received', `收到广播音频`, {
                  mediaType: 'audio',
                  mediaUrl: fileUrl,
                  fileName: `广播音频_${Date.now()}`,
                  fileSize: 0,
                });
              }
              break;
            }
            case FILE: {
              if (fileUrl) {
                addLog('file_received', `收到广播文件`, {
                  mediaType: 'file',
                  mediaUrl: fileUrl,
                  fileName: payload.file_name || `广播文件_${Date.now()}`,
                  fileSize: payload.file_size || 0,
                });
              }
              break;
            }
            case IMAGE: {
              if (fileUrl) {
                addLog('image_received', `收到广播图片`, {
                  mediaType: 'image',
                  mediaUrl: fileUrl,
                  fileName: `广播图片_${Date.now()}`,
                  fileSize: 0,
                });
              }
              break;
            }
            case TEXT: {
              // 文本广播
              addLog(
                'received',
                `收到广播文本: ${JSON.stringify(data, null, 2)}`,
              );
              break;
            }
            case VIDEO: {
              if (fileUrl) {
                addLog('video_received', `收到广播视频`, {
                  mediaType: 'video',
                  mediaUrl: fileUrl,
                  fileName: `广播视频_${Date.now()}`,
                  fileSize: 0,
                });
              }
              break;
            }
            default: {
              // 未知类型
              addLog(
                'received',
                `收到广播消息: ${JSON.stringify(data, null, 2)}`,
              );
              break;
            }
          }
          break;
        }
        case 'file': {
          // 文件消息
          const fileUrl = payload.file_url;
          if (fileUrl) {
            addLog('file_received', `收到文件消息`, {
              mediaType: 'file',
              mediaUrl: fileUrl,
              fileName: payload.file_name || `文件_${Date.now()}`,
              fileSize: payload.file_size || 0,
            });
          } else {
            addLog(
              'received',
              `收到文件消息但缺少URL: ${JSON.stringify(data, null, 2)}`,
            );
          }
          break;
        }
        case 'image': {
          // 图片消息
          const fileUrl = payload.file_url;
          if (fileUrl) {
            addLog('image_received', `收到图片消息`, {
              mediaType: 'image',
              mediaUrl: fileUrl,
              fileName: `图片_${Date.now()}`,
              fileSize: 0,
            });
          } else {
            addLog(
              'received',
              `收到图片消息但缺少URL: ${JSON.stringify(data, null, 2)}`,
            );
          }
          break;
        }
        case 'video': {
          // 视频消息
          const fileUrl = payload.file_url;
          if (fileUrl) {
            addLog('video_received', `收到视频消息`, {
              mediaType: 'video',
              mediaUrl: fileUrl,
              fileName: `视频_${Date.now()}`,
              fileSize: 0,
            });
          } else {
            addLog(
              'received',
              `收到视频消息但缺少URL: ${JSON.stringify(data, null, 2)}`,
            );
          }
          break;
        }
        default: {
          // 默认文本消息
          addLog('received', `收到消息: ${JSON.stringify(data, null, 2)}`);
          break;
        }
      }
    }
  } catch (error) {
    addLog('error', `WebSocket 消息处理失败: ${String(error)}`);
    console.error('WebSocket 消息处理失败:', error);
  }
}

/**
 * 注册测试处理器，供外部调用
 */
export function registerTestHandler(websocketService: IWebSocketService) {
  websocketService.addMessageHandler(testHandler);
}
