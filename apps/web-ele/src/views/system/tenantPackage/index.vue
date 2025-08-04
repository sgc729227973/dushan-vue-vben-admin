<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemTenantPackageApi } from '#/api/system/tenant-package';
import type { Column } from '#/components/ExportTable/types.js';

import { ref } from 'vue';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteTenantPackage,
  deleteTenantPackageList,
  exportTenantPackage,
  getExportTenantPackageFields,
  getTenantPackagePage,
} from '#/api/system/tenant-package';
import ExportTable from '#/components/ExportTable/index.vue';
import { useTableExport } from '#/hooks/useTableExport';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

// 选中的套餐ID列表
const selectedIds = ref<number[]>([]);

// 导出相关
const exportColumns = ref<Column[]>([]);
const {
  exportDialogVisible,
  exportParams,
  defaultFileName,
  openExportDialog,
  closeExportDialog,
} = useTableExport({
  defaultFileName: '租户套餐.xls',
});

/** 更新选中 ID 列表 */
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

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
  selectedIds.value = []; // 清空选中项
}

/** 导出表格 */
async function onExport() {
  try {
    // 获取可导出的字段
    const fields = await getExportTenantPackageFields();
    exportColumns.value = fields;

    // 获取当前查询条件
    const formValues = await gridApi.formApi.getValues();

    // 打开导出对话框
    openExportDialog(formValues);
  } catch (error) {
    console.error('获取导出字段失败', error);
    ElMessage.error('获取导出字段失败');
  }
}

/** 导出成功 */
function onExportSuccess() {
  closeExportDialog();
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
}

/** 创建租户套餐 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑租户套餐 */
function onEdit(row: SystemTenantPackageApi.TenantPackage) {
  formModalApi.setData(row).open();
}

/** 删除租户套餐 */
async function onDelete(row: SystemTenantPackageApi.TenantPackage) {
  const loading = ElLoading.service({
    lock: true,
    text: $t('ui.actionMessage.deleting', [row.name]),
    background: 'rgba(0, 0, 0, 0.7)',
  });
  try {
    await deleteTenantPackage(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } catch {
    // 错误处理
  } finally {
    loading.close();
  }
}

/** 批量删除套餐 */
async function onBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await confirm({
      content: $t('ui.actionMessage.deleteConfirm', [`${rows.length}个套餐`]),
      title: $t('ui.actionTitle.deleteBatch'),
      cancelText: $t('common.cancel'),
      confirmText: $t('common.confirm'),
    });
    const ids = rows.map((row) => row.id as number);
    await deleteTenantPackageList(ids);
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    onRefresh();
  } catch {
    // 处理异常
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemTenantPackageApi.TenantPackage>) {
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
      trigger: 'row', // 允许整行任何地方都可以选择，不仅仅是复选框
      checkStrictly: true, // 严格的遵循父子不关联
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getTenantPackagePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    pagerConfig: {
      // 分页配置
      perfect: true,
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<SystemTenantPackageApi.TenantPackage>,
  gridEvents,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="SaaS 多租户" url="https://doc.iocoder.cn/saas-tenant/" />
    </template>

    <FormModal @success="onRefresh" />
    <ExportTable
      v-model:visible="exportDialogVisible"
      :columns="exportColumns"
      :export-api="exportTenantPackage"
      :search-params="exportParams"
      :file-name="defaultFileName"
      @success="onExportSuccess"
    />
    <Grid table-title="租户套餐列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['套餐']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['system:tenant-package:create'],
              onClick: onCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['system:tenant-package:export'],
              onClick: onExport,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'danger',
              icon: ACTION_ICON.DELETE,
              auth: ['system:tenant-package:delete'],
              disabled: selectedIds.length === 0,
              onClick: onBatchDelete,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
