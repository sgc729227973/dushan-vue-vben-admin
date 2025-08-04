import { watch } from 'vue';

import { useAccessStore } from '@vben/stores';

import { initWebSocketService, websocketService } from './index';

/**
 * 根据 accessToken 变化，自动建立 / 断开 WebSocket 连接。
 */
export function setupWebSocketAutoConnect() {
  const accessStore = useAccessStore();
  let handlersInited = false;

  watch(
    () => [
      accessStore.accessToken,
      accessStore.tenantId,
      accessStore.visitTenantId,
    ],
    ([token]) => {
      // 先断开旧连接，避免租户或 token 变更导致权限错乱
      websocketService.disconnect();

      if (token) {
        websocketService.connect();
        if (!handlersInited) {
          initWebSocketService();
          handlersInited = true;
        }
      }
    },
    { immediate: true },
  );
}
