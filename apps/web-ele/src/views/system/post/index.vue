<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemPostApi } from '#/api/system/post';
import type { Column } from '#/components/ExportTable/types.js';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Download, Plus } from '@vben/icons';

import { ElButton, ElLoading, ElMessage, ElMessageBox } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deletePost,
  deletePostList,
  exportPost,
  getExportPostFields,
  getPostPage,
} from '#/api/system/post';
import ExportTable from '#/components/ExportTable/index.vue';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const selectedIds = ref<number[]>([]);

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
  selectedIds.value = [];
}

// 导出相关
const exportVisible = ref(false);
const exportSearchParams = ref({});
const exportColumns = ref<Column[]>([]);

/** 导出表格 */
async function onExport() {
  try {
    // 获取可导出的字段
    const fields = await getExportPostFields();
    exportColumns.value = fields;

    // 获取当前查询条件
    const formValues = await gridApi.formApi.getValues();

    // 设置导出参数并显示导出对话框
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

/** 创建岗位 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑岗位 */
function onEdit(row: SystemPostApi.Post) {
  formModalApi.setData(row).open();
}

/** 批量删除岗位 */
async function onBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await ElMessageBox.confirm(
      $t('ui.actionMessage.deleteConfirm', [`${rows.length}个岗位`]),
      $t('ui.actionTitle.deleteBatch'),
      {
        confirmButtonText: $t('common.confirm'),
        cancelButtonText: $t('common.cancel'),
        type: 'warning',
      },
    );
    const ids = rows.map((row) => row.id as number);
    await deletePostList(ids);
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    onRefresh();
  } catch {
    // 处理异常
  }
}

/** 更新选中 ID 列表 */
function onCheckboxChange() {
  selectedIds.value = gridApi.grid
    .getCheckboxRecords()
    .map((row) => row.id as number);
}

/** 删除岗位 */
async function onDelete(row: SystemPostApi.Post) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
    fullscreen: true,
  });
  try {
    await deletePost(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } catch {
    // 异常处理
  } finally {
    loadingInstance.close();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({ code, row }: OnActionClickParams<SystemPostApi.Post>) {
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
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    checkboxConfig: {
      highlight: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getPostPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
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
  } as VxeTableGridOptions<SystemPostApi.Post>,
  gridEvents,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <!-- 导出对话框 -->
    <ExportTable
      v-model:visible="exportVisible"
      :columns="exportColumns"
      :export-api="exportPost"
      :search-params="exportSearchParams"
      file-name="岗位.xls"
      @success="onExportSuccess"
    />
    <Grid table-title="岗位列表">
      <template #toolbar-tools>
        <ElButton
          type="primary"
          @click="onCreate"
          v-access:code="['system:post:create']"
        >
          <Plus class="mr-2 size-5" />
          {{ $t('ui.actionTitle.create', ['岗位']) }}
        </ElButton>
        <ElButton
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['system:post:export']"
        >
          <Download class="mr-2 size-5" />
          {{ $t('ui.actionTitle.export') }}
        </ElButton>
        <ElButton
          type="danger"
          class="ml-2"
          :disabled="selectedIds.length === 0"
          @click="onBatchDelete"
          v-access:code="['system:post:delete']"
        >
          {{ $t('ui.actionTitle.deleteBatch') }}
        </ElButton>
      </template>
    </Grid>
  </Page>
</template>
