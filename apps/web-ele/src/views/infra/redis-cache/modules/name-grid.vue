<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeGridListeners,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import * as RedisListApi from '#/api/infra/redis-cache';

import { useCacheNameColumns } from '../data';

defineOptions({ name: 'InfraCacheNameGrid' });

// 定义组件属性和事件
const emit = defineEmits<{
  // 选中缓存名称时触发
  (e: 'select', cacheName: string): void;
  // 清理缓存名称时触发
  (e: 'clearCacheName', row: any): void;
}>();

// 缓存名称表格实例
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useCacheNameColumns(onNameActionClick),
    height: 'auto',
    autoResize: true,
    proxyConfig: {
      ajax: {
        query: async ({
          page,
        }: {
          page: { currentPage: number; pageSize: number };
        }) => {
          // 使用分页参数查询缓存名称列表
          return await RedisListApi.listCacheName({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'cacheName',
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
      if (row && row.cacheName) {
        emit('select', row.cacheName);
      }
    },
  } as VxeGridListeners,
});

/** 表格操作按钮的回调函数 - 缓存名称 */
function onNameActionClick({ code, row }: OnActionClickParams) {
  switch (code) {
    case 'clearCacheName': {
      emit('clearCacheName', row);
      break;
    }
  }
}

// 暴露API给父组件
defineExpose({
  query: () => gridApi.query(),
});
</script>

<template>
  <div class="h-full">
    <Grid table-title="缓存列表" />
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
