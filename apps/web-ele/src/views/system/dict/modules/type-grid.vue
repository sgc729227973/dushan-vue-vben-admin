<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeGridListeners,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemDictTypeApi } from '#/api/system/dict/type';
import type { Column } from '#/components/ExportTable/types.js';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { Download, Plus } from '@vben/icons';

import { ElButton, ElLoading, ElMessage, ElMessageBox } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDictType,
  deleteDictTypeList,
  exportDictType,
  getDictTypePage,
  getExportDictTypeFields,
} from '#/api/system/dict/type';
import ExportTable from '#/components/ExportTable/index.vue';
import { $t } from '#/locales';

import { useTypeGridColumns, useTypeGridFormSchema } from '../data';
import TypeForm from './type-form.vue';

const emit = defineEmits(['select']);
// 导出相关
const exportVisible = ref(false);
const exportSearchParams = ref({});
const exportColumns = ref<Column[]>([]);

const [TypeFormModal, typeFormModalApi] = useVbenModal({
  connectedComponent: TypeForm,
  destroyOnClose: true,
});

const selectedIds = ref<number[]>([]);

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
    const fields = await getExportDictTypeFields();
    exportColumns.value = fields;
    const formValues = await gridApi.formApi.getValues();
    exportSearchParams.value = formValues;
    exportVisible.value = true;
  } catch {}
}

/** 导出成功 */
function onExportSuccess() {
  exportVisible.value = false;
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
}

/** 创建字典类型 */
function onCreate() {
  typeFormModalApi.setData(null).open();
}

/** 批量删除字典类型 */
async function onBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await ElMessageBox.confirm(
      $t('ui.actionMessage.deleteConfirm', [`${rows.length}个字典类型`]),
      $t('ui.actionTitle.deleteBatch'),
      {
        confirmButtonText: $t('common.confirm'),
        cancelButtonText: $t('common.cancel'),
        type: 'warning',
      },
    );
    const ids = rows.map((row) => row.id as number);
    await deleteDictTypeList(ids);
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    onRefresh();
  } catch {
    // 处理异常
  }
}

/** 编辑字典类型 */
function onEdit(row: any) {
  typeFormModalApi.setData(row).open();
}

/** 删除字典类型 */
async function onDelete(row: SystemDictTypeApi.DictType) {
  const loadingInstance = ElLoading.service({
    text: $t('common.processing'),
    fullscreen: true,
  });
  try {
    await deleteDictType(row.id as number);
    ElMessage.success($t('common.operationSuccess'));
    onRefresh();
  } catch {
    // 异常处理
  } finally {
    loadingInstance.close();
  }
}

/** 表格操作按钮回调 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemDictTypeApi.DictType>) {
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

/** 表格事件 */
const gridEvents: VxeGridListeners<SystemDictTypeApi.DictType> = {
  cellClick: ({ row }) => {
    emit('select', row.type);
  },
  checkboxChange: onCheckboxChange,
  checkboxAll: onCheckboxChange,
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useTypeGridFormSchema(),
  },
  gridOptions: {
    columns: useTypeGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    checkboxConfig: {
      highlight: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getDictTypePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isCurrent: true,
    },
    toolbarConfig: {
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<SystemDictTypeApi.DictType>,
  gridEvents,
});
</script>

<template>
  <div class="h-full">
    <TypeFormModal @success="onRefresh" />
    <ExportTable
      v-model:visible="exportVisible"
      :columns="exportColumns"
      :export-api="exportDictType"
      :search-params="exportSearchParams"
      file-name="字典类型.xls"
      @success="onExportSuccess"
    />
    <Grid table-title="字典类型列表">
      <template #toolbar-tools>
        <ElButton
          type="primary"
          @click="onCreate"
          v-access:code="['system:dict:create']"
        >
          <Plus class="mr-2 size-5" />
          {{ $t('ui.actionTitle.create', ['字典类型']) }}
        </ElButton>
        <ElButton
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['system:dict:export']"
        >
          <Download class="mr-2 size-5" />
          {{ $t('ui.actionTitle.export') }}
        </ElButton>
        <ElButton
          type="danger"
          class="ml-2"
          :disabled="selectedIds.length === 0"
          @click="onBatchDelete"
          v-access:code="['system:dict:delete']"
        >
          {{ $t('ui.actionTitle.deleteBatch') }}
        </ElButton>
      </template>
    </Grid>
  </div>
</template>
