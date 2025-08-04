<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemDeptApi } from '#/api/system/dept';
import type { SystemUserApi } from '#/api/system/user';

import { ref } from 'vue';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteUser,
  deleteUserList,
  exportUser,
  getUserPage,
  updateUserStatus,
} from '#/api/system/user';
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

// 选中的用户ID列表
const selectedIds = ref<number[]>([]);

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
async function handleExport() {
  const data = await exportUser(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '用户.xls', source: data });
}

/** 选择部门 */
const searchDeptId = ref<number | undefined>(undefined);

async function handleDeptSelect(dept: SystemDeptApi.Dept) {
  searchDeptId.value = dept.id;
  onRefresh();
}

/** 创建用户 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 导入用户 */
function handleImport() {
  importModalApi.open();
}

/** 编辑用户 */
function handleEdit(row: SystemUserApi.User) {
  formModalApi.setData(row).open();
}

/** 删除用户 */
async function handleDelete(row: SystemUserApi.User) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.username]),
    key: 'action_key_msg',
  });
  try {
    await deleteUser(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.username]),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 批量删除用户 */
async function handleBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await confirm({
      content: $t('ui.actionMessage.deleteConfirm', [`${rows.length}个用户`]),
      title: $t('ui.actionTitle.deleteBatch'),
      cancelText: $t('common.cancel'),
      confirmText: $t('common.confirm'),
    });
    await deleteUserList(rows.map((row) => row.id as number));
    message.success($t('ui.actionMessage.deleteSuccess'));
    onRefresh();
  } catch {
    // 处理异常
  }
}

/** 重置密码 */
function handleResetPassword(row: SystemUserApi.User) {
  resetPasswordModalApi.setData(row).open();
}

/** 分配角色 */
function handleAssignRole(row: SystemUserApi.User) {
  assignRoleModalApi.setData(row).open();
}

/** 更新用户状态 */
async function handleStatusChange(
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
          message.success($t('ui.actionMessage.operationSuccess'));
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

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(handleStatusChange),
    height: 'auto',
    keepSource: true,
    checkboxConfig: {
      highlight: true, // 高亮选中行
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

    <div class="flex h-full w-full">
      <!-- 左侧部门树 -->
      <div class="h-full w-1/6 pr-4">
        <DeptTree @select="handleDeptSelect" />
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
                  onClick: handleCreate,
                },
                {
                  label: $t('ui.actionTitle.export'),
                  type: 'primary',
                  icon: ACTION_ICON.DOWNLOAD,
                  auth: ['system:user:export'],
                  onClick: handleExport,
                },
                {
                  label: $t('ui.actionTitle.import', ['用户']),
                  type: 'primary',
                  icon: ACTION_ICON.UPLOAD,
                  auth: ['system:user:import'],
                  onClick: handleImport,
                },
                {
                  label: $t('ui.actionTitle.deleteBatch'),
                  type: 'primary',
                  danger: true,
                  icon: ACTION_ICON.DELETE,
                  auth: ['system:user:delete'],
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
                  auth: ['system:user:update'],
                  onClick: handleEdit.bind(null, row),
                },
                {
                  label: $t('common.delete'),
                  type: 'link',
                  danger: true,
                  icon: ACTION_ICON.DELETE,
                  auth: ['system:user:delete'],
                  popConfirm: {
                    title: $t('ui.actionMessage.deleteConfirm', [row.username]),
                    confirm: handleDelete.bind(null, row),
                  },
                },
              ]"
              :drop-down-actions="[
                {
                  label: '分配角色',
                  type: 'link',
                  auth: ['system:permission:assign-user-role'],
                  onClick: handleAssignRole.bind(null, row),
                },
                {
                  label: '重置密码',
                  type: 'link',
                  auth: ['system:user:update-password'],
                  onClick: handleResetPassword.bind(null, row),
                },
              ]"
            />
          </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>
