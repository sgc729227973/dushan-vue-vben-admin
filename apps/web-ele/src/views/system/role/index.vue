<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemRoleApi } from '#/api/system/role';
import type { Column } from '#/components/ExportTable/types.js';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { ElLoading, ElMessage, ElMessageBox } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteRole,
  deleteRoleList,
  exportRole,
  getExportRoleFields,
  getRolePage,
} from '#/api/system/role';
import ExportTable from '#/components/ExportTable/index.vue';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import AssignDataPermissionForm from './modules/assign-data-permission-form.vue';
import AssignMenuForm from './modules/assign-menu-form.vue';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [AssignDataPermissionFormModel, assignDataPermissionFormApi] =
  useVbenModal({
    connectedComponent: AssignDataPermissionForm,
    destroyOnClose: true,
  });

const [AssignMenuFormModel, assignMenuFormApi] = useVbenModal({
  connectedComponent: AssignMenuForm,
  destroyOnClose: true,
});

// 选中的角色ID列表
const selectedIds = ref<number[]>([]);

/** 更新选中 ID 列表 */
function onCheckboxChange() {
  selectedIds.value = gridApi.grid
    .getCheckboxRecords()
    .map((row) => row.id as number);
}

// 导出相关
const exportVisible = ref(false);
const exportSearchParams = ref({});
const exportColumns = ref<Column[]>([]);

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
    const fields = await getExportRoleFields();
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

/** 编辑角色 */
function onEdit(row: SystemRoleApi.Role) {
  formModalApi.setData(row).open();
}

/** 创建角色 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 删除角色 */
async function onDelete(row: SystemRoleApi.Role) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
    fullscreen: true,
  });
  try {
    await deleteRole(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } catch {
    // 异常处理
  } finally {
    loadingInstance.close();
  }
}

/** 分配角色的数据权限 */
function onAssignDataPermission(row: SystemRoleApi.Role) {
  assignDataPermissionFormApi.setData(row).open();
}

/** 分配角色的菜单权限 */
function onAssignMenu(row: SystemRoleApi.Role) {
  assignMenuFormApi.setData(row).open();
}

/** 表格操作按钮的回调函数 */
function onActionClick({ code, row }: OnActionClickParams<SystemRoleApi.Role>) {
  switch (code) {
    case 'assign-data-permission': {
      onAssignDataPermission(row);
      break;
    }
    case 'assign-menu': {
      onAssignMenu(row);
      break;
    }
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

const [Grid, gridApi] = useVbenVxeGrid<SystemRoleApi.Role>({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns<SystemRoleApi.Role>(onActionClick),
    height: 'auto',
    keepSource: true,
    checkboxConfig: {
      highlight: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getRolePage({
            page: page.currentPage,
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
  } as VxeTableGridOptions<SystemRoleApi.Role>,
  gridEvents, // 传入事件
});

/** 批量删除角色 */
async function onBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await ElMessageBox.confirm(
      $t('ui.actionMessage.deleteConfirm', [`${rows.length}个角色`]),
      $t('ui.actionTitle.deleteBatch'),
      {
        type: 'warning',
        confirmButtonText: $t('common.confirm'),
        cancelButtonText: $t('common.cancel'),
      },
    );
    const ids = rows.map((row) => row.id as number);
    await deleteRoleList(ids);
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    onRefresh();
  } catch {
    // 处理异常
  }
}
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="功能权限"
        url="https://doc.iocoder.cn/resource-permission"
      />
      <DocAlert title="数据权限" url="https://doc.iocoder.cn/data-permission" />
    </template>
    <!-- 导出对话框 -->
    <ExportTable
      v-model:visible="exportVisible"
      :columns="exportColumns"
      :export-api="exportRole"
      :search-params="exportSearchParams"
      file-name="角色.xls"
      @success="onExportSuccess"
    />
    <FormModal @success="onRefresh" />
    <AssignDataPermissionFormModel @success="onRefresh" />
    <AssignMenuFormModel @success="onRefresh" />
    <Grid table-title="角色列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['角色']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['system:role:create'],
              onClick: onCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['system:role:export'],
              onClick: onExport,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'danger',
              icon: ACTION_ICON.DELETE,
              auth: ['system:role:delete'],
              disabled: selectedIds.length === 0,
              onClick: onBatchDelete,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
