<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeGridListeners,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';

import { watch } from 'vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import * as RedisListApi from '#/api/infra/redis-cache';

import { useCacheKeyColumns } from '../data';

defineOptions({ name: 'InfraCacheKeyGrid' });

const props = defineProps<{
  cacheName?: string;
}>();

const emit = defineEmits<{
  (e: 'select', key: string): void;
  (e: 'clearCacheKey', row: any): void;
}>();

// 格式化键名显示
function keyFormatter(cacheKey: string): string {
  if (props.cacheName && cacheKey.startsWith(props.cacheName)) {
    const prefixWithPossibleColon = props.cacheName.endsWith(':')
      ? props.cacheName
      : `${props.cacheName}:`;
    if (cacheKey.startsWith(prefixWithPossibleColon)) {
      return cacheKey.slice(prefixWithPossibleColon.length);
    }
  }
  return cacheKey;
}

// 缓存键名表格实例
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useCacheKeyColumns(onKeyActionClick, keyFormatter),
    height: 'auto',
    autoResize: true,
    proxyConfig: {
      ajax: {
        query: async ({
          page,
        }: {
          page: { currentPage: number; pageSize: number };
        }) => {
          if (!props.cacheName) {
            return { list: [], total: 0 };
          }

          const data = await RedisListApi.listCacheKey(props.cacheName, {
            pageNo: page.currentPage,
            pageSize: page.pageSize,
          });

          if (data && data.list && Array.isArray(data.list)) {
            return {
              list: data.list.map((key: string) => ({ key })),
              total: data.total,
            };
          }
          return { list: [], total: 0 };
        },
      },
    },
    rowConfig: {
      keyField: 'key',
      isCurrent: true,
      height: 48,
    },
    emptyRender: {
      name: 'EmptyRender',
      attrs: {
        style: {
          height: '200px',
        },
      },
    },
    toolbarConfig: {
      refresh: { code: 'query' },
      custom: true,
    },
    pagerConfig: {
      enabled: true,
      pageSize: 10,
      perfect: true,
    },
  } as unknown as VxeTableGridOptions,
  gridEvents: {
    cellClick: ({ row }: { row: any }) => {
      if (row && row.key) {
        emit('select', row.key);
      }
    },
  } as VxeGridListeners,
});

/** 表格操作按钮的回调函数 - 缓存键名 */
function onKeyActionClick({ code, row }: OnActionClickParams) {
  switch (code) {
    case 'clearCacheKey': {
      emit('clearCacheKey', row);
      break;
    }
  }
}

// 监听cacheName变化，重新查询
watch(
  () => props.cacheName,
  (newVal) => {
    if (newVal) {
      gridApi.query();
    } else {
      gridApi.grid.loadData([]);
    }
  },
);

// 暴露API给父组件
defineExpose({
  query: () => gridApi.query(),
  loadData: (data: any[]) => gridApi.grid.loadData(data),
});
</script>

<template>
  <div class="h-full">
    <Grid table-title="键名列表" />
  </div>
</template>

<style lang="scss" scoped>
:deep(.vxe-table) {
  flex: 1;
  min-height: 300px;
}

:deep(.vxe-table--empty-block) {
  min-height: 200px;
}

/* 优化分页组件在小屏幕上的显示 */
:deep(.vxe-pager) {
  height: auto;
  padding: 5px;
}

:deep(.vxe-pager--wrapper) {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: center;
}

:deep(.vxe-pager--total) {
  margin-right: 0;
}
</style>
