<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemMailAccountApi } from '#/api/system/mail/account';

import { ref } from 'vue';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteMailAccount,
  deleteMailAccountList,
  getMailAccountPage,
} from '#/api/system/mail/account';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
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

/** 创建邮箱账号 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑邮箱账号 */
function handleEdit(row: SystemMailAccountApi.MailAccount) {
  formModalApi.setData(row).open();
}

/** 删除邮箱账号 */
async function handleDelete(row: SystemMailAccountApi.MailAccount) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.mail]),
    key: 'action_key_msg',
  });
  try {
    await deleteMailAccount(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.mail]),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 批量删除邮箱账号 */
async function handleBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await confirm({
      content: $t('ui.actionMessage.deleteConfirm', [
        `${rows.length}个邮箱账号`,
      ]),
      title: $t('ui.actionTitle.deleteBatch'),
      cancelText: $t('common.cancel'),
      confirmText: $t('common.confirm'),
    });
    const ids = rows.map((row) => row.id as number);
    await deleteMailAccountList(ids);
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
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    checkboxConfig: {
      highlight: true, // 高亮选中行
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getMailAccountPage({
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
  } as VxeTableGridOptions<SystemMailAccountApi.MailAccount>,
  gridEvents,
});
</script>
<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="邮件配置" url="https://doc.iocoder.cn/mail" />
    </template>

    <FormModal @success="onRefresh" />
    <Grid table-title="邮箱账号列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['邮箱账号']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['system:mail-account:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['system:mail-account:delete'],
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
              auth: ['system:mail-account:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['system:mail-account:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.mail]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
