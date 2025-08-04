import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace InfraConfigApi {
  /** 参数配置类型 */
  export interface ConfigType {
    id?: number;
    name: string; // 配置类型名称
    code: string; // 配置类型编码
    status: number; // 状态
    remark: string; // 备注
    createTime?: Date;
  }

  /** 参数配置数据 */
  export interface ConfigData {
    id?: number;
    typeId: number; // 配置类型ID
    typeName?: string; // 配置类型名称(显示用)
    typeCode?: string; // 配置类型编码(显示用)
    name: string; // 配置名称
    key: string; // 配置键名
    value: string; // 配置键值
    visible: boolean; // 是否可见
    remark: string; // 备注
    createTime?: Date;
  }
}

/** 查询配置类型列表 */
export function getConfigTypePage(params: PageParam) {
  return requestClient.get<PageResult<InfraConfigApi.ConfigType>>(
    '/infra/config-type/page',
    {
      params,
    },
  );
}

/** 获取所有配置类型（精简版）*/
export function getSimpleConfigTypeList() {
  return requestClient.get<InfraConfigApi.ConfigType[]>(
    '/infra/config-type/list-all-simple',
  );
}

/** 查询配置类型详情 */
export function getConfigType(id: number) {
  return requestClient.get<InfraConfigApi.ConfigType>(
    `/infra/config-type/get?id=${id}`,
  );
}

/** 新增配置类型 */
export function createConfigType(data: InfraConfigApi.ConfigType) {
  return requestClient.post('/infra/config-type/create', data);
}

/** 修改配置类型 */
export function updateConfigType(data: InfraConfigApi.ConfigType) {
  return requestClient.put('/infra/config-type/update', data);
}

/** 删除配置类型 */
export function deleteConfigType(id: number) {
  return requestClient.delete(`/infra/config-type/delete?id=${id}`);
}

/** 批量删除配置类型 */
export function deleteConfigTypeList(ids: number[]) {
  return requestClient.delete('/infra/config-type/delete-list', { data: ids });
}

/** 导出配置类型 */
export function exportConfigType(params: any) {
  return requestClient.download('/infra/config-type/export-excel', {
    params,
  });
}

/** 获取配置类型可导出字段列表 */
export function getExportConfigTypeFields() {
  return requestClient.get<{ field: string; title: string }[]>(
    '/infra/config-type/export-fields',
  );
}

/** 查询配置数据列表 */
export function getConfigDataPage(params: PageParam) {
  return requestClient.get<PageResult<InfraConfigApi.ConfigData>>(
    '/infra/config/page',
    {
      params,
    },
  );
}

/** 查询配置数据详情 */
export function getConfigData(id: number) {
  return requestClient.get<InfraConfigApi.ConfigData>(
    `/infra/config/get?id=${id}`,
  );
}

/** 根据参数键名查询参数值 */
export function getConfigKey(configKey: string) {
  return requestClient.get<string>(
    `/infra/config/get-value-by-key?key=${configKey}`,
  );
}

/** 新增配置数据 */
export function createConfigData(data: InfraConfigApi.ConfigData) {
  return requestClient.post('/infra/config/create', data);
}

/** 修改配置数据 */
export function updateConfigData(data: InfraConfigApi.ConfigData) {
  return requestClient.put('/infra/config/update', data);
}

/** 删除配置数据 */
export function deleteConfigData(id: number) {
  return requestClient.delete(`/infra/config/delete?id=${id}`);
}

/** 批量删除配置数据 */
export function deleteConfigDataList(ids: number[]) {
  return requestClient.delete(`/infra/config/delete-list?ids=${ids.join(',')}`);
}

/** 导出配置数据 */
export function exportConfigData(params: any) {
  return requestClient.download('/infra/config/export-excel', {
    params,
  });
}

/** 获取配置数据可导出字段列表 */
export function getExportConfigDataFields() {
  return requestClient.get<{ field: string; title: string }[]>(
    '/infra/config/export-fields',
  );
}
