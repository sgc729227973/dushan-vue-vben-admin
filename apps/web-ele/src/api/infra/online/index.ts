import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace InfraOnlineApi {
  /** 在线用户信息 */
  export interface OnlineRespVO {
    tokenId?: string;
    userName?: string;
    deptName?: string;
    ipaddr?: string;
    loginLocation?: string;
    browser?: string;
    os?: string;
    loginTime?: string;
  }
}

/** 查询在线用户列表 */
export function getOnlineUserPage(params: PageParam) {
  return requestClient.get<PageResult<InfraOnlineApi.OnlineRespVO>>(
    '/infra/online/list',
    { params },
  );
}

/** 强退用户 */
export function forceLogout(tokenId: string) {
  return requestClient.delete(`/infra/online/force-logout/${tokenId}`);
}
