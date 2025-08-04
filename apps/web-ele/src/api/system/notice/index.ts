import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SystemNoticeApi {
  /** 通知信息 */
  export interface Notice {
    id?: number;
    title: string;
    type: number;
    content: string;
    status: number;
    channels: string[];
    userType: number;
    remark: string;
    publisher: string;
    createTime?: Date;
  }

  export interface PushTargetsReq {
    id: number;
    userIds: number[];
    deptIds: number[];
  }
}

/** 查询通知列表 */
export function getNoticePage(params: PageParam) {
  return requestClient.get<PageResult<SystemNoticeApi.Notice>>(
    '/system/notice/page',
    { params },
  );
}

/** 查询通知详情 */
export function getNotice(id: number) {
  return requestClient.get<SystemNoticeApi.Notice>(
    `/system/notice/get?id=${id}`,
  );
}

/** 新增通知 */
export function createNotice(data: SystemNoticeApi.Notice) {
  return requestClient.post('/system/notice/create', data);
}

/** 修改通知 */
export function updateNotice(data: SystemNoticeApi.Notice) {
  return requestClient.put('/system/notice/update', data);
}

/** 删除通知 */
export function deleteNotice(id: number) {
  return requestClient.delete(`/system/notice/delete?id=${id}`);
}

/** 定向推送通知 */
export function pushNoticeToTargets(data: SystemNoticeApi.PushTargetsReq) {
  return requestClient.post('/system/notice/push-targets', data);
}

/** 批量删除通知 */
export function deleteNoticeList(ids: number[]) {
  return requestClient.delete(
    `/system/notice/delete-list?ids=${ids.join(',')}`,
  );
}
