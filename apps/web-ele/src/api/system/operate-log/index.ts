import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SystemOperateLogApi {
  /** 操作日志信息 */
  export interface OperateLog {
    id: number;
    traceId: string;
    userType: number;
    userId: number;
    type: string;
    subType: string;
    bizId: number;
    action: string;
    extra: string;
    requestMethod: string;
    requestUrl: string;
    userIp: string;
    userAgent: string;
    creator: string;
    creatorName: string;
    createTime: string;
    userInfo?: {
      avatar?: string;
      browser?: string;
      deptId?: number;
      id?: number;
      ipaddr?: string;
      loginLocation?: string;
      loginTime?: string;
      nickname?: string;
      os?: string;
      username?: string;
    };
  }
}

/** 查询操作日志列表 */
export function getOperateLogPage(params: PageParam) {
  return requestClient.get<PageResult<SystemOperateLogApi.OperateLog>>(
    '/system/operate-log/page',
    { params },
  );
}

/** 获取操作日志可导出字段列表 */
export function getExportOperateLogFields() {
  return requestClient.get<{ field: string; title: string }[]>(
    '/system/operate-log/export-fields',
  );
}

/** 导出操作日志 */
export function exportOperateLog(params: any) {
  return requestClient.download('/system/operate-log/export-excel', { params });
}
