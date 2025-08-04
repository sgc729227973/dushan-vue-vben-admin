import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace InfraDataSourceConfigApi {
  /** 数据源配置信息 */
  export interface DataSourceConfig {
    id?: number;
    name: string;
    url: string;
    createTime?: Date;
    status: number;
    db_type: string;
    source_type: number;
    is_default: boolean;
    pool_size: number;
    max_overflow: number;
    pool_recycle: number;
    pool_timeout: number;
    echo: boolean;
    remark?: string;
  }

  /** 数据源配置测试结果 */
  export interface DataSourceConfigTestResult {
    success: boolean;
    message: string;
  }

  /** 数据源配置简单信息 */
  export interface DataSourceConfigSimple {
    id: number;
    name: string;
  }
}

/** 查询数据源配置列表 */
export function getDataSourceConfigList() {
  return requestClient.get<InfraDataSourceConfigApi.DataSourceConfig[]>(
    '/infra/data-source-config/list',
  );
}

/** 查询数据源配置详情 */
export function getDataSourceConfig(id: number) {
  return requestClient.get<InfraDataSourceConfigApi.DataSourceConfig>(
    `/infra/data-source-config/get?id=${id}`,
  );
}

/** 新增数据源配置 */
export function createDataSourceConfig(
  data: InfraDataSourceConfigApi.DataSourceConfig,
) {
  return requestClient.post('/infra/data-source-config/create', data);
}

/** 修改数据源配置 */
export function updateDataSourceConfig(
  data: InfraDataSourceConfigApi.DataSourceConfig,
) {
  return requestClient.put('/infra/data-source-config/update', data);
}

/** 删除数据源配置 */
export function deleteDataSourceConfig(id: number) {
  return requestClient.delete(`/infra/data-source-config/delete?id=${id}`);
}

/** 导出数据源配置 */
export function exportDataSourceConfig(params: any) {
  return requestClient.download('/infra/data-source-config/export-excel', {
    params,
  });
}

/** 获取数据源配置可导出字段列表 */
export function getExportDataSourceConfigFields() {
  return requestClient.get<{ field: string; title: string }[]>(
    '/infra/data-source-config/export-fields',
  );
}

/** 查询数据源配置分页 */
export function getDataSourceConfigPage(params: PageParam) {
  return requestClient.get<
    PageResult<InfraDataSourceConfigApi.DataSourceConfig>
  >('/infra/data-source-config/page', { params });
}

/** 测试数据源配置连接 */
export function testDataSourceConfig(id: number) {
  return requestClient.post<InfraDataSourceConfigApi.DataSourceConfigTestResult>(
    `/infra/data-source-config/test?id=${id}`,
  );
}

/** 根据状态获取数据源配置列表 */
export function getDataSourceConfigListByStatus(status: number) {
  return requestClient.get<InfraDataSourceConfigApi.DataSourceConfigSimple[]>(
    `/infra/data-source-config/list-by-status?status=${status}`,
  );
}
