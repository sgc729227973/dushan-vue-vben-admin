import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export interface OnlineUserVO {
  tokenId: string;
  username: string;
  userType: number;
  userIp: string;
  userAgent: string;
  loginTime: string;
  sessionTimeout: number;
}

/**
 * 查询在线用户列表
 */
export const list = (params: PageParam) => {
  return requestClient.get<PageResult<OnlineUserVO>>('/infra/online/list', {
    params,
  });
};

/**
 * 强退用户
 */
export const forceLogout = (tokenId: string) => {
  return requestClient.delete(`/infra/online/force-logout/${tokenId}`);
};
