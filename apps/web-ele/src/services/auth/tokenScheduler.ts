import type { Ref } from 'vue';

import { ref } from 'vue';

import { getClientId } from '@vben/hooks';
import { triggerConnectCallbacks } from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { refreshTokenApi } from '#/api/core/auth';

import { handleTokenRefreshFailure } from './refreshToken';

/**
 * 令牌刷新器
 */
export class TokenRefresher {
  /** 当前是否正在刷新 */
  get running(): Readonly<Ref<boolean>> {
    return this._running;
  }
  private readonly _running = ref(false);
  private readonly store = useAccessStore();

  /**
   * 手动刷新令牌
   */
  async refresh(): Promise<boolean> {
    if (this._running.value) return false;
    this._running.value = true;

    try {
      const refreshToken = this.store.refreshToken;
      if (!refreshToken) {
        await handleTokenRefreshFailure();
        return false;
      }

      // 调用刷新令牌接口
      const { data } = await refreshTokenApi({
        refreshToken,
        clientId: getClientId(),
      });

      // 更新 store
      this.store.setToken(data.accessToken);
      if (data.refreshToken) {
        this.store.setRefreshToken(data.refreshToken);
      }

      // 触发 WebSocket 重新连接
      triggerConnectCallbacks();
      return true;
    } catch {
      // 处理刷新失败，执行登出
      await handleTokenRefreshFailure();
      return false;
    } finally {
      this._running.value = false;
    }
  }
}

// 创建全局单例
let tokenRefresher: null | TokenRefresher = null;

/**
 * 获取令牌刷新器实例
 */
export function getTokenRefresher(): TokenRefresher {
  if (!tokenRefresher) {
    tokenRefresher = new TokenRefresher();
  }
  return tokenRefresher;
}
