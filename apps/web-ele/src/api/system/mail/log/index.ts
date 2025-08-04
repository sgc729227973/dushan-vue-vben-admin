import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SystemMailLogApi {
  /** 邮件日志 */
  export interface MailLog {
    id: number;
    userId: number;
    userType: number;
    toMail: string;
    accountId: number;
    fromMail: string;
    templateId: number;
    templateCode: string;
    templateNickname: string;
    templateTitle: string;
    templateContent: string;
    templateParams: string;
    sendStatus: number;
    sendTime: string;
    sendMessageId: string;
    sendException: string;
    createTime: string;
  }
}

/** 查询邮件日志列表 */
export function getMailLogPage(params: PageParam) {
  return requestClient.get<PageResult<SystemMailLogApi.MailLog>>(
    '/system/mail-log/page',
    { params },
  );
}

/** 查询邮件日志详情 */
export function getMailLog(id: number) {
  return requestClient.get<SystemMailLogApi.MailLog>(
    `/system/mail-log/get?id=${id}`,
  );
}

/** 导出邮件日志 */
export function exportMailLog(params: any) {
  return requestClient.download('/system/mail-log/export-excel', {
    params,
  });
}

/** 获取邮件日志可导出字段列表 */
export function getExportMailLogFields() {
  return requestClient.get<{ field: string; title: string }[]>(
    '/system/mail-log/export-fields',
  );
}

/** 重新发送邮件 */
export function resendMail(id: number) {
  return requestClient.put(`/system/mail-log/resend?id=${id}`);
}
