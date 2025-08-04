import { requestClient } from '#/api/request';

export namespace InfraMonitorApi {
  /** Redis命令统计信息 */
  export interface CommandStat {
    command: string;
    calls: number;
    usec: number;
  }

  /** Redis监控响应对象 */
  export interface RedisMonitorRespVO {
    info: Record<string, any>;
    dbSize: number;
    commandStats: CommandStat[];
    tenantId?: number;
  }

  /** 缓存名称对象 */
  export interface CacheName {
    cacheName: string;
    remark: string;
  }
}

/**
 * 查询缓存名称列表
 */
export function listCacheName(params: any) {
  return requestClient.get('/infra/monitor/get-names', { params });
}

/**
 * 查询缓存键名列表
 */
export function listCacheKey(cacheName: string, params: any) {
  return requestClient.get(`/infra/monitor/get-keys/${cacheName}`, { params });
}

/**
 * 查询缓存内容
 */
export function getCacheValue(cacheName: string, cacheKey: string) {
  return requestClient.get(`/infra/monitor/get-value/${cacheName}/${cacheKey}`);
}

/**
 * 清理指定名称缓存
 */
export function clearCacheName(cacheName: string) {
  return requestClient.delete(`/infra/monitor/clear-cache-name/${cacheName}`);
}

/**
 * 清理指定键名缓存
 */
export function clearCacheKey(cacheKey: string) {
  return requestClient.delete(`/infra/monitor/clear-cache-key/${cacheKey}`);
}

/**
 * 清理全部缓存
 */
export function clearCacheAll() {
  return requestClient.delete('/infra/monitor/clear-cache-all');
}
