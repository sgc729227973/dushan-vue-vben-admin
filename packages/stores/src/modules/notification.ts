import { acceptHMRUpdate, defineStore } from 'pinia';

interface NotificationState {
  /** 未读通知数量 */
  unreadCount: number;
}

/**
 * @zh_CN 通知消息相关
 */
export const useNotificationStore = defineStore('core-notification', {
  state: (): NotificationState => ({
    unreadCount: 0,
  }),
  actions: {
    /** 设置未读通知数量 */
    setUnreadCount(count: number) {
      this.unreadCount = count;
    },
    /** 清零未读通知数量 */
    clearUnread() {
      this.unreadCount = 0;
    },
  },
});

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useNotificationStore, hot));
}
