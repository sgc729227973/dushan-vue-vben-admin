<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemDeptApi } from '#/api/system/dept';
import type { SystemUserApi } from '#/api/system/user';
import type { Column } from '#/components/ExportTable/types.js';

import { ref } from 'vue';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteUser,
  deleteUserList,
  exportUser,
  getExportUserFields,
  getUserPage,
  updateUserStatus,
} from '#/api/system/user';
import ExportTable from '#/components/ExportTable/index.vue';
import { $t } from '#/locales';
import { DICT_TYPE, getDictLabel } from '#/utils';

import { useGridColumns, useGridFormSchema } from './data';
import AssignRoleForm from './modules/assign-role-form.vue';
import DeptTree from './modules/dept-tree.vue';
import Form from './modules/form.vue';
import ImportForm from './modules/import-form.vue';
import ResetPasswordForm from './modules/reset-password-form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [ResetPasswordModal, resetPasswordModalApi] = useVbenModal({
  connectedComponent: ResetPasswordForm,
  destroyOnClose: true,
});

const [AssignRoleModal, assignRoleModalApi] = useVbenModal({
  connectedComponent: AssignRoleForm,
  destroyOnClose: true,
});

const [ImportModal, importModalApi] = useVbenModal({
  connectedComponent: ImportForm,
  destroyOnClose: true,
});

const selectedIds = ref<number[]>([]);

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
  selectedIds.value = [];
}

/** 选择部门 */
const searchDeptId = ref<number | undefined>(undefined);
async function onDeptSelect(dept: SystemDeptApi.Dept) {
  searchDeptId.value = dept.id;
  onRefresh();
}

/** 创建用户 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 导入用户 */
function onImport() {
  importModalApi.open();
}

/** 编辑用户 */
function onEdit(row: SystemUserApi.User) {
  formModalApi.setData(row).open();
}

/** 删除用户 */
async function onDelete(row: SystemUserApi.User) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.username]),
    fullscreen: true,
  });
  try {
    await deleteUser(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.username]));
    onRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 批量删除用户 */
async function onBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await confirm({
      content: $t('ui.actionMessage.deleteConfirm', [`${rows.length}个用户`]),
      title: $t('ui.actionTitle.deleteBatch'),
      cancelText: $t('common.cancel'),
      confirmText: $t('common.confirm'),
    });
    const ids = rows.map((row) => row.id as number);
    await deleteUserList(ids);
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    onRefresh();
  } catch {
    // 处理异常
  }
}

/** 重置密码 */
function onResetPassword(row: SystemUserApi.User) {
  resetPasswordModalApi.setData(row).open();
}

/** 分配角色 */
function onAssignRole(row: SystemUserApi.User) {
  assignRoleModalApi.setData(row).open();
}

/** 更新用户状态 */
async function onStatusChange(
  newStatus: number,
  row: SystemUserApi.User,
): Promise<boolean | undefined> {
  return new Promise((resolve, reject) => {
    confirm({
      content: `你要将${row.username}的状态切换为【${getDictLabel(DICT_TYPE.COMMON_STATUS, newStatus)}】吗？`,
    })
      .then(async () => {
        // 更新用户状态
        const res = await updateUserStatus(row.id as number, newStatus);
        if (res) {
          // 提示并返回成功
          ElMessage.success($t('ui.actionMessage.operationSuccess'));
          resolve(true);
        } else {
          reject(new Error('更新失败'));
        }
      })
      .catch(() => {
        reject(new Error('取消操作'));
      });
  });
}

/** 表格操作按钮的回调函数 */
function onActionClick({ code, row }: OnActionClickParams<SystemUserApi.User>) {
  switch (code) {
    case 'assignRole': {
      onAssignRole(row);
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
    case 'resetPassword': {
      onResetPassword(row);
      break;
    }
  }
}

function onCheckboxChange() {
  selectedIds.value = gridApi.grid
    .getCheckboxRecords()
    .map((row) => row.id as number);
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
    columns: useGridColumns(onActionClick, onStatusChange),
    height: 'auto',
    keepSource: true,
    checkboxConfig: {
      highlight: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getUserPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            deptId: searchDeptId.value,
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
  } as VxeTableGridOptions<SystemUserApi.User>,
  gridEvents,
});

// 导出相关
const exportVisible = ref(false);
const exportSearchParams = ref({});
const exportColumns = ref<Column[]>([]);

/** 导出表格 */
async function onExport() {
  try {
    // 获取可导出的字段
    const fields = await getExportUserFields();
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
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="用户体系" url="https://doc.iocoder.cn/user-center/" />
      <DocAlert title="三方登陆" url="https://doc.iocoder.cn/social-user/" />
      <DocAlert
        title="Excel 导入导出"
        url="https://doc.iocoder.cn/excel-import-and-export/"
      />
    </template>

    <FormModal @success="onRefresh" />
    <ResetPasswordModal @success="onRefresh" />
    <AssignRoleModal @success="onRefresh" />
    <ImportModal @success="onRefresh" />

    <!-- 导出对话框 -->
    <ExportTable
      v-model:visible="exportVisible"
      :columns="exportColumns"
      :export-api="exportUser"
      :search-params="exportSearchParams"
      file-name="用户.xls"
      @success="onExportSuccess"
    />

    <div class="flex h-full w-full">
      <!-- 左侧部门树 -->
      <div class="h-full w-1/6 pr-4">
        <DeptTree @select="onDeptSelect" />
      </div>
      <!-- 右侧用户列表 -->
      <div class="w-5/6">
        <Grid table-title="用户列表">
          <template #toolbar-tools>
            <TableAction
              :actions="[
                {
                  label: $t('ui.actionTitle.create', ['用户']),
                  type: 'primary',
                  icon: ACTION_ICON.ADD,
                  auth: ['system:user:create'],
                  onClick: onCreate,
                },
                {
                  label: $t('ui.actionTitle.export'),
                  type: 'primary',
                  icon: ACTION_ICON.DOWNLOAD,
                  auth: ['system:user:export'],
                  onClick: onExport,
                },
                {
                  label: $t('ui.actionTitle.import', ['用户']),
                  type: 'primary',
                  icon: ACTION_ICON.UPLOAD,
                  auth: ['system:user:import'],
                  onClick: onImport,
                },
                {
                  label: $t('ui.actionTitle.deleteBatch'),
                  type: 'danger',
                  icon: ACTION_ICON.DELETE,
                  auth: ['system:user:delete'],
                  disabled: selectedIds.length === 0,
                  onClick: onBatchDelete,
                },
              ]"
            />
          </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>
