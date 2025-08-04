import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace InfraMqApi {
  /** MQ消息定义信息 */
  export interface Mq {
    id?: number;
    topic: string;
    consumer: string;
    retryCount: number;
    description?: string;
    createTime?: string;
  }

  export interface MqStatus {
    id: number;
    status: number;
  }
}

/** 查询MQ消息定义列表 */
export function getMqPage(params: PageParam) {
  return requestClient.get<PageResult<InfraMqApi.Mq>>(
    '/infra/mq-definition/page',
    {
      params,
    },
  );
}

/** 查询MQ消息定义详情 */
export function getMq(id: number) {
  return requestClient.get<InfraMqApi.Mq>(`/infra/mq-definition/get?id=${id}`);
}

/** 新增MQ消息定义 */
export function createMq(data: InfraMqApi.Mq) {
  return requestClient.post('/infra/mq-definition/create', data);
}

/** 修改MQ消息定义 */
export function updateMq(data: InfraMqApi.Mq) {
  return requestClient.put('/infra/mq-definition/update', data);
}

/** 删除MQ消息定义 */
export function deleteMq(id: number) {
  return requestClient.delete(`/infra/mq-definition/delete?id=${id}`);
}

/** 导出MQ消息定义 */
export function exportMq(params: any) {
  return requestClient.download('/infra/mq-definition/export-excel', {
    params,
  });
}

/** 获取MQ消息定义可导出字段列表 */
export function getExportMqFields() {
  return requestClient.get<{ field: string; title: string }[]>(
    '/infra/mq-definition/export-fields',
  );
}
