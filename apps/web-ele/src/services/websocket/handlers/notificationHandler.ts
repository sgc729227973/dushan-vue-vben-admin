import type {
  IWebSocketService,
  NoticePayload,
  WebSocketMessage,
} from '../types';

import { useNotificationStore } from '@vben/stores';

import { ElNotification } from 'element-plus';

import { getUnreadNotifyMessageCount } from '#/api/system/notify/message';

import { WebSocketMessageType } from '../types';

/**
 * 通知消息处理器
 * 处理WebSocket通知类型的消息，显示通知并更新通知计数
 */
export function notificationHandler(event: MessageEvent) {
  try {
    const data = JSON.parse(event.data) as WebSocketMessage;

    // 处理notice类型消息
    if (
      data.type === WebSocketMessageType.NOTICE &&
      data.payload &&
      typeof data.payload === 'object'
    ) {
      const payload = data.payload as NoticePayload;

      if (payload.event === 'new_notice' && payload.notice) {
        const notice = payload.notice;

        // 显示通知
        ElNotification({
          title: notice.title || '系统通知',
          message: notice.content,
          dangerouslyUseHTMLString: true,
          type: 'info',
          duration: 0, // 不自动关闭
          showClose: true,
          position: 'top-right',
          offset: 50,
          onClick: () => {
            // 可以添加点击通知的处理逻辑
            // 这里可以添加跳转到通知详情页的逻辑
            // router.push({
            //   name: 'NoticeDetail',
            //   params: { id: notice.id }
            // });
          },
        });

        // 刷新未读数量
        const notificationStore = useNotificationStore();
        getUnreadNotifyMessageCount()
          .then((count) => notificationStore.setUnreadCount(count))
          .catch(() => {
            /* 静默失败 */
          });
      }
    }
  } catch {
    // 静默失败
  }
}

/**
 * 注册通知消息处理器
 * @param websocketService WebSocket服务实例
 */
export function registerNotificationHandler(
  websocketService: IWebSocketService,
) {
  // 注册消息处理器
  websocketService.addMessageHandler(notificationHandler);
}
