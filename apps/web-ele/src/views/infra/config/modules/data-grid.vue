<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InfraConfigApi } from '#/api/infra/config';
import type { Column } from '#/components/ExportTable/types.js';

import { ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { Download, Plus } from '@vben/icons';

import { ElButton, ElMessage, ElMessageBox } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteConfigData,
  deleteConfigDataList,
  exportConfigData,
  getConfigDataPage,
  getExportConfigDataFields,
} from '#/api/infra/config';
import ExportTable from '#/components/ExportTable/index.vue';
import { $t } from '#/locales';

import { useDataGridColumns, useDataGridFormSchema } from '../data';
import DataForm from './data-form.vue';

const props = defineProps({
  typeId: {
    type: Number,
    default: undefined,
  },
});

const selectedIds = ref<number[]>([]);

// 导出相关
const exportVisible = ref(false);
const exportSearchParams = ref<Record<string, any>>({});
const exportColumns = ref<Column[]>([]);

const [DataFormModal, dataFormModalApi] = useVbenModal({
  connectedComponent: DataForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
  selectedIds.value = [];
}

/** 更新选中 ID 列表 */
function onCheckboxChange() {
  selectedIds.value = gridApi.grid
    .getCheckboxRecords()
    .map((row) => row.id as number);
}

/** 导出表格 */
async function onExport() {
  try {
    const fields = await getExportConfigDataFields();
    exportColumns.value = fields;

    const formValues = await gridApi.formApi.getValues();
    exportSearchParams.value = formValues;
    exportVisible.value = true;
  } catch (error) {
    console.error('获取导出字段失败', error);
  }
}

/** 导出成功 */
function onExportSuccess() {
  exportVisible.value = false;
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
}

/** 创建配置数据 */
function onCreate() {
  dataFormModalApi.setData({ typeId: props.typeId }).open();
}

/** 批量删除配置数据 */
async function onBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await ElMessageBox.confirm(
      $t('ui.actionMessage.deleteConfirm', [`${rows.length}个配置数据`]),
      $t('ui.actionTitle.deleteBatch'),
      {
        confirmButtonText: $t('common.confirm'),
        cancelButtonText: $t('common.cancel'),
        type: 'warning',
      },
    );
    const ids = rows.map((row) => row.id as number);
    await deleteConfigDataList(ids);
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    onRefresh();
  } catch {
    // 处理异常
  }
}

/** 编辑配置数据 */
function onEdit(row: any) {
  dataFormModalApi.setData(row).open();
}

/** 删除配置数据 */
async function onDelete(row: InfraConfigApi.ConfigData) {
  const loadingInstance = ElMessage({
    message: $t('ui.actionMessage.deleting', [row.name]),
    type: 'info',
    duration: 0,
  });
  try {
    await deleteConfigData(row.id as number);
    loadingInstance.close();
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } catch {
    loadingInstance.close();
  }
}

/** 表格操作按钮的回调  函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<InfraConfigApi.ConfigData>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
  }
}

const gridEvents = {
  checkboxChange: onCheckboxChange,
  checkboxAll: onCheckboxChange,
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useDataGridFormSchema(),
  },
  gridOptions: {
    columns: useDataGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    checkboxConfig: {
      highlight: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getConfigDataPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            typeId: props.typeId,
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
  } as VxeTableGridOptions<InfraConfigApi.ConfigData>,
  gridEvents,
});

/** 监听 typeId 变化，重新查询 */
watch(
  () => props.typeId,
  () => {
    if (props.typeId) {
      onRefresh();
    }
  },
);
</script>

<template>
  <div class="flex h-full flex-col">
    <DataFormModal @success="onRefresh" />
    <ExportTable
      v-model:visible="exportVisible"
      :columns="exportColumns"
      :export-api="exportConfigData"
      :search-params="exportSearchParams"
      file-name="配置数据.xls"
      @success="onExportSuccess"
    />

    <Grid table-title="配置数据列表">
      <template #toolbar-tools>
        <ElButton
          type="primary"
          @click="onCreate"
          v-access:code="['infra:config-data:create']"
          :disabled="!props.typeId"
        >
          <Plus class="mr-2 size-5" />
          {{ $t('ui.actionTitle.create', ['配置数据']) }}
        </ElButton>
        <ElButton
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['infra:config-data:export']"
        >
          <Download class="mr-2 size-5" />
          {{ $t('ui.actionTitle.export') }}
        </ElButton>
        <ElButton
          type="danger"
          class="ml-2"
          :disabled="selectedIds.length === 0"
          @click="onBatchDelete"
          v-access:code="['infra:config-data:delete']"
        >
          {{ $t('ui.actionTitle.deleteBatch') }}
        </ElButton>
      </template>
    </Grid>
  </div>
</template>
