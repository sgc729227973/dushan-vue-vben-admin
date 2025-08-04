import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace InfraMqLogApi {
  /** MQ消息日志信息 */
  export interface MqLog {
    id?: number;
    messageId: string;
    consumer: string;
    executeIndex: number;
    beginTime: Date;
    endTime?: Date;
    duration?: number;
    status: number;
    result?: string;
    createTime: Date;
  }
}

/** 查询MQ消费日志列表 */
export function getMqLogPage(params: PageParam) {
  return requestClient.get<PageResult<InfraMqLogApi.MqLog>>(
    '/infra/mq-log/page',
    { params },
  );
}

/** 查询MQ消费日志详情 */
export function getMqLog(id: number) {
  return requestClient.get<InfraMqLogApi.MqLog>(`/infra/mq-log/get?id=${id}`);
}

/** 导出MQ消费日志 */
export function exportMqLog(params: any) {
  return requestClient.download('/infra/mq-log/export-excel', { params });
}

/** 获取MQ消费日志可导出字段列表 */
export function getExportMqLogFields() {
  return requestClient.get<{ field: string; title: string }[]>(
    '/infra/mq-log/export-fields',
  );
}
