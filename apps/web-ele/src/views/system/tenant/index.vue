<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemTenantApi } from '#/api/system/tenant';
import type { SystemTenantPackageApi } from '#/api/system/tenant-package';
import type { Column } from '#/components/ExportTable/types.js';

import { onMounted, ref } from 'vue';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteTenant,
  deleteTenantList,
  exportTenant,
  getExportTenantFields,
  getTenantPage,
} from '#/api/system/tenant';
import { getTenantPackageList } from '#/api/system/tenant-package';
import ExportTable from '#/components/ExportTable/index.vue';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const tenantPackageList = ref<SystemTenantPackageApi.TenantPackage[]>([]);

/** 获取套餐名称 */
const getPackageName = (packageId: number) => {
  if (packageId === 0) {
    return '系统租户';
  }
  return tenantPackageList.value.find((pkg) => pkg.id === packageId)?.name;
};

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

// 选中的租户ID列表
const selectedIds = ref<number[]>([]);

// 导出相关
const exportVisible = ref(false);
const exportSearchParams = ref({});
const exportColumns = ref<Column[]>([]);

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
    const fields = await getExportTenantFields();
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

/** 创建租户 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑租户 */
function onEdit(row: SystemTenantApi.Tenant) {
  formModalApi.setData(row).open();
}

/** 删除租户 */
async function onDelete(row: SystemTenantApi.Tenant) {
  const loading = ElLoading.service({
    lock: true,
    text: $t('ui.actionMessage.deleting', [row.name]),
    background: 'rgba(0, 0, 0, 0.7)',
  });
  try {
    await deleteTenant(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } catch {
    // 错误处理
  } finally {
    loading.close();
  }
}

/** 批量删除租户 */
async function onBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await confirm({
      content: $t('ui.actionMessage.deleteConfirm', [`${rows.length}个租户`]),
      title: $t('ui.actionTitle.deleteBatch'),
      cancelText: $t('common.cancel'),
      confirmText: $t('common.confirm'),
    });
    const ids = rows.map((row) => row.id as number);
    await deleteTenantList(ids);
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
}: OnActionClickParams<SystemTenantApi.Tenant>) {
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
    columns: useGridColumns(onActionClick, getPackageName),
    height: 'auto',
    keepSource: true,
    checkboxConfig: {
      highlight: true, // 高亮选中行
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getTenantPage({
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
  } as VxeTableGridOptions<SystemTenantApi.Tenant>,
  gridEvents, // 传入事件
});

/** 初始化 */
onMounted(async () => {
  tenantPackageList.value = await getTenantPackageList();
});
</script>
<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="SaaS 多租户" url="https://doc.iocoder.cn/saas-tenant/" />
    </template>

    <FormModal @success="onRefresh" />
    <ExportTable
      v-model:visible="exportVisible"
      :columns="exportColumns"
      :export-api="exportTenant"
      :search-params="exportSearchParams"
      file-name="租户.xls"
      @success="onExportSuccess"
    />
    <Grid table-title="租户列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['租户']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['system:tenant:create'],
              onClick: onCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['system:tenant:export'],
              onClick: onExport,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'danger',
              icon: ACTION_ICON.DELETE,
              auth: ['system:tenant:delete'],
              disabled: selectedIds.length === 0,
              onClick: onBatchDelete,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
