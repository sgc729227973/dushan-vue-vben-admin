import { requestClient } from '#/api/request';

/**
 * 查询缓存名称列表
 */
export const listCacheName = () => {
  return requestClient.get<string[]>('/infra/monitor/get-names');
};

/**
 * 查询缓存键名列表
 */
export const listCacheKey = (cacheName: string) => {
  return requestClient.get<string[]>(`/infra/monitor/get-keys/${cacheName}`);
};

/**
 * 查询缓存内容
 */
export const getCacheValue = (cacheName: string, cacheKey: string) => {
  return requestClient.get<any>(
    `/infra/monitor/get-value/${cacheName}/${cacheKey}`,
  );
};

/**
 * 清理指定名称缓存
 */
export const clearCacheName = (cacheName: string) => {
  return requestClient.delete(`/infra/monitor/clear-cache-name/${cacheName}`);
};

/**
 * 清理指定键名缓存
 */
export const clearCacheKey = (cacheKey: string) => {
  return requestClient.delete(`/infra/monitor/clear-cache-key/${cacheKey}`);
};

/**
 * 清理全部缓存
 */
export const clearCacheAll = () => {
  return requestClient.delete('/infra/monitor/clear-cache-all');
};
