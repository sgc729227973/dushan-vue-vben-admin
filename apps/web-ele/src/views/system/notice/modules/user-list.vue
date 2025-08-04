<script lang="ts" setup>
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { SystemUserApi } from '#/api/system/user';

import { ref, watch } from 'vue';

import { useVbenVxeGrid } from '@vben/plugins/vxe-table';

import { getUserPage } from '#/api/system/user';

const props = defineProps({
  deptId: {
    type: Number,
    default: undefined,
  },
});

const emit = defineEmits(['selectionChange']);
const selectedUserIds = ref<number[]>([]);

// 处理选择变化
function onSelectionChange() {
  selectedUserIds.value = gridApi.grid
    .getCheckboxRecords()
    .map((row) => row.id as number);
  emit('selectionChange', selectedUserIds.value);
}

// 表格事件
const gridEvents = {
  checkboxChange: onSelectionChange,
  checkboxAll: onSelectionChange,
};

// 使用vxe-table的Grid组件
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      {
        type: 'checkbox',
        width: 30,
        fixed: 'left',
      },
      {
        field: 'id',
        title: 'ID',
        width: 180,
      },
      {
        field: 'nickname',
        title: '昵称',
        minWidth: 120,
      },
      {
        field: 'avatar',
        title: '头像',
        width: 80,
        cellRender: {
          name: 'CellImage',
        },
      },
      {
        field: 'deptName',
        title: '部门',
        minWidth: 120,
      },
    ],
    height: '100%',
    keepSource: true,
    checkboxConfig: {
      highlight: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          return await getUserPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            deptId: props.deptId,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      height: 60,
    },
    pagerConfig: {
      perfect: true,
    },
  } as VxeTableGridOptions<SystemUserApi.User>,
  gridEvents,
});

// 监听部门ID变化
watch(
  () => props.deptId,
  () => {
    gridApi.query();
  },
  { immediate: true },
);
</script>

<template>
  <div class="h-full">
    <Grid />
  </div>
</template>
