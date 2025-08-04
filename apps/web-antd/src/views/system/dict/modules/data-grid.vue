<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemDictDataApi } from '#/api/system/dict/data';

import { ref, watch } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDictData,
  deleteDictDataList,
  exportDictData,
  getDictDataPage,
} from '#/api/system/dict/data';
import { $t } from '#/locales';

import { useDataGridColumns, useDataGridFormSchema } from '../data';
import DataForm from './data-form.vue';

const props = defineProps({
  dictType: {
    type: String,
    default: undefined,
  },
});

const [DataFormModal, dataFormModalApi] = useVbenModal({
  connectedComponent: DataForm,
  destroyOnClose: true,
});

// 选中的ID列表
const selectedIds = ref<number[]>([]);

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
  // 清空选中状态
  gridApi.grid.clearCheckboxRow();
  selectedIds.value = [];
}

/** 导出表格 */
async function handleExport() {
  const data = await exportDictData(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '字典数据.xls', source: data });
}

/** 创建字典数据 */
function handleCreate() {
  dataFormModalApi.setData({ dictType: props.dictType }).open();
}

/** 编辑字典数据 */
function handleEdit(row: SystemDictDataApi.DictData) {
  dataFormModalApi.setData(row).open();
}

/** 删除字典数据 */
async function handleDelete(row: SystemDictDataApi.DictData) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.label]),
    key: 'action_key_msg',
  });
  try {
    await deleteDictData(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.label]),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 批量删除字典数据 */
async function handleBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await confirm({
      content: $t('ui.actionMessage.deleteConfirm', [
        `${rows.length}个字典数据`,
      ]),
      title: $t('ui.actionTitle.deleteBatch'),
      cancelText: $t('common.cancel'),
      confirmText: $t('common.confirm'),
    });
    const ids = rows.map((row) => row.id as number);
    await deleteDictDataList(ids);
    message.success($t('ui.actionMessage.deleteSuccess'));
    onRefresh();
  } catch {
    // 处理异常
  }
}

/** 更新选中ID列表 */
function onCheckboxChange() {
  selectedIds.value = gridApi.grid
    .getCheckboxRecords()
    .map((row) => row.id as number);
}

// 表格事件
const gridEvents = {
  checkboxChange: onCheckboxChange,
  checkboxAll: onCheckboxChange,
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useDataGridFormSchema(),
  },
  gridOptions: {
    columns: useDataGridColumns(),
    height: 'auto',
    keepSource: true,
    checkboxConfig: {
      highlight: true, // 高亮选中行
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getDictDataPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            dictType: props.dictType,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<SystemDictDataApi.DictData>,
  gridEvents,
});

/** 监听 dictType 变化，重新查询 */
watch(
  () => props.dictType,
  () => {
    if (props.dictType) {
      onRefresh();
    }
  },
);
</script>

<template>
  <div class="flex h-full flex-col">
    <DataFormModal @success="onRefresh" />

    <Grid table-title="字典数据列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['字典数据']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['system:dict:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['system:dict:export'],
              onClick: handleExport,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['system:dict:delete'],
              disabled: selectedIds.length === 0,
              onClick: handleBatchDelete,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['system:dict:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['system:dict:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.label]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
