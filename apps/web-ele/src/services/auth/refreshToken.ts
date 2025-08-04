import { LOGIN_PATH } from '@vben/constants';
import { getClientId } from '@vben/hooks';
import { useAccessStore } from '@vben/stores';

import { refreshTokenApi } from '#/api/core/auth';
import { router } from '#/router';

/**
 * 静默刷新令牌，成功返回新令牌，失败抛出异常
 */
export async function refreshTokenSilently(): Promise<string> {
  const accessStore = useAccessStore();
  const refreshToken = accessStore.refreshToken;

  // 检查是否有刷新令牌
  if (!refreshToken) {
    throw new Error('刷新令牌不存在');
  }

  const clientId = getClientId();

  // 使用 refreshToken 调用刷新接口
  const { data } = await refreshTokenApi({
    refreshToken,
    clientId,
  });

  // 更新存储
  accessStore.setToken(data.accessToken);
  if (data.refreshToken) {
    accessStore.setRefreshToken(data.refreshToken);
  }

  return data.accessToken;
}

/**
 * 处理令牌刷新失败，执行登出
 */
export async function handleTokenRefreshFailure() {
  try {
    const accessStore = useAccessStore();

    // 清除所有令牌
    accessStore.setToken(null);
    accessStore.setRefreshToken(null);
    accessStore.setExpiresAt(null);

    // 跳转到登录页
    await router.replace({
      path: LOGIN_PATH,
      query: {
        redirect: encodeURIComponent(router.currentRoute.value.fullPath),
      },
    });
  } catch {
    // 静默失败
  }
}
