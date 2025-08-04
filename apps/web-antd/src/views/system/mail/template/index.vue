<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemMailAccountApi } from '#/api/system/mail/account';
import type { SystemMailTemplateApi } from '#/api/system/mail/template';

import { onMounted, ref } from 'vue';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSimpleMailAccountList } from '#/api/system/mail/account';
import {
  deleteMailTemplate,
  deleteMailTemplateList,
  getMailTemplatePage,
} from '#/api/system/mail/template';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';
import SendForm from './modules/send-form.vue';

const accountList = ref<SystemMailAccountApi.MailAccount[]>([]);

// 选中的ID列表
const selectedIds = ref<number[]>([]);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [SendModal, sendModalApi] = useVbenModal({
  connectedComponent: SendForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
  // 清空选中状态
  gridApi.grid.clearCheckboxRow();
  selectedIds.value = [];
}

/** 创建邮件模板 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑邮件模板 */
function handleEdit(row: SystemMailTemplateApi.MailTemplate) {
  formModalApi.setData(row).open();
}

/** 发送测试邮件 */
function handleSend(row: SystemMailTemplateApi.MailTemplate) {
  sendModalApi.setData(row).open();
}

/** 删除邮件模板 */
async function handleDelete(row: SystemMailTemplateApi.MailTemplate) {
  message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  await deleteMailTemplate(row.id as number);
  message.success({
    content: $t('ui.actionMessage.deleteSuccess', [row.name]),
    key: 'action_key_msg',
  });
  onRefresh();
}

/** 批量删除邮件模板 */
async function handleBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await confirm({
      content: $t('ui.actionMessage.deleteConfirm', [
        `${rows.length}个邮件模板`,
      ]),
      title: $t('ui.actionTitle.deleteBatch'),
      cancelText: $t('common.cancel'),
      confirmText: $t('common.confirm'),
    });
    const ids = rows.map((row) => row.id as number);
    await deleteMailTemplateList(ids);
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

/** 获取邮箱账号 */
function getAccountMail(accountId: number) {
  return accountList.value.find((account) => account.id === accountId)?.mail;
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
    columns: useGridColumns(getAccountMail),
    height: 'auto',
    keepSource: true,
    checkboxConfig: {
      highlight: true, // 高亮选中行
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getMailTemplatePage({
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
  } as VxeTableGridOptions<SystemMailTemplateApi.MailTemplate>,
  gridEvents,
});

/** 初始化 */
onMounted(async () => {
  accountList.value = await getSimpleMailAccountList();
});
</script>
<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="邮件配置" url="https://doc.iocoder.cn/mail" />
    </template>

    <FormModal @success="onRefresh" />
    <SendModal />
    <Grid table-title="邮件模板列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['邮件模板']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['system:mail-template:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['system:mail-template:delete'],
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
              auth: ['system:mail-template:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '测试',
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['system:mail-template:send-mail'],
              onClick: handleSend.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['system:mail-template:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
