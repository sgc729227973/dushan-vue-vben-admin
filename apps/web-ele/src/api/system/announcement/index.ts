import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SystemAnnouncementApi {
  /** 公告信息 */
  export interface Announcement {
    id?: number;
    title: string;
    content: string;
    status: number;
    priority: number;
    category: number;
    publishTime?: Date;
    expireTime?: Date;
    sort: number;
    isTop: boolean;
    publisher?: string;
    remark?: string;
    creator?: string;
    createTime?: Date;
    updater?: string;
    updateTime?: Date;
  }
}

/** 查询公告列表 */
export function getAnnouncementPage(params: PageParam) {
  return requestClient.get<PageResult<SystemAnnouncementApi.Announcement>>(
    '/system/announcement/page',
    { params },
  );
}

/** 查询公告详情 */
export function getAnnouncement(id: number) {
  return requestClient.get<SystemAnnouncementApi.Announcement>(
    `/system/announcement/get?id=${id}`,
  );
}

/** 新增公告 */
export function createAnnouncement(data: SystemAnnouncementApi.Announcement) {
  return requestClient.post('/system/announcement/create', data);
}

/** 修改公告 */
export function updateAnnouncement(data: SystemAnnouncementApi.Announcement) {
  return requestClient.put('/system/announcement/update', data);
}

/** 删除公告 */
export function deleteAnnouncement(id: number) {
  return requestClient.delete(`/system/announcement/delete?id=${id}`);
}

/** 批量删除公告 */
export function deleteAnnouncementList(ids: number[]) {
  return requestClient.delete(
    `/system/announcement/delete-list?ids=${ids.join(',')}`,
  );
}

/** 立即发布公告 */
export function publishAnnouncement(id: number) {
  return requestClient.post(`/system/announcement/publish?id=${id}`);
}

/** 定时发布公告 */
export function scheduleAnnouncement(id: number) {
  return requestClient.post(`/system/announcement/schedule-publish?id=${id}`);
}
