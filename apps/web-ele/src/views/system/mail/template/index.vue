<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemMailAccountApi } from '#/api/system/mail/account';
import type { SystemMailTemplateApi } from '#/api/system/mail/template';
import type { Column } from '#/components/ExportTable/types.js';

import { onMounted, ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { Download, Plus } from '@vben/icons';

import { ElButton, ElLoading, ElMessage, ElMessageBox } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSimpleMailAccountList } from '#/api/system/mail/account';
import {
  deleteMailTemplate,
  deleteMailTemplateList,
  exportMailTemplate,
  getExportMailTemplateFields,
  getMailTemplatePage,
} from '#/api/system/mail/template';
import ExportTable from '#/components/ExportTable/index.vue';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';
import SendForm from './modules/send-form.vue';

const accountList = ref<SystemMailAccountApi.MailAccount[]>([]);

// 导出相关
const exportVisible = ref(false);
const exportSearchParams = ref<Record<string, any>>({});
const exportColumns = ref<Column[]>([]);

// 选中的邮件模板 ID 列表
const selectedIds = ref<number[]>([]);

/** 获取邮箱账号 */
const getAccountMail = (accountId: number) => {
  return accountList.value.find((account) => account.id === accountId)?.mail;
};

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
  selectedIds.value = [];
}

/** 创建邮件模板 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑邮件模板 */
function onEdit(row: SystemMailTemplateApi.MailTemplate) {
  formModalApi.setData(row).open();
}

/** 发送测试邮件 */
function onSend(row: SystemMailTemplateApi.MailTemplate) {
  sendModalApi.setData(row).open();
}

/** 批量删除邮件模板 */
async function onBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await ElMessageBox.confirm(
      $t('ui.actionMessage.deleteConfirm', [`${rows.length}个邮件模板`]),
      $t('ui.actionTitle.deleteBatch'),
      {
        confirmButtonText: $t('common.confirm'),
        cancelButtonText: $t('common.cancel'),
        type: 'warning',
      },
    );
    const ids = rows.map((row) => row.id as number);
    await deleteMailTemplateList(ids);
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

/** 删除邮件模板 */
async function onDelete(row: SystemMailTemplateApi.MailTemplate) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
    fullscreen: true,
  });
  try {
    await deleteMailTemplate(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemMailTemplateApi.MailTemplate>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'send': {
      onSend(row);
      break;
    }
  }
}

/** 导出表格 */
async function onExport() {
  try {
    const fields = await getExportMailTemplateFields();
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

const gridEvents = {
  checkboxChange: onCheckboxChange,
  checkboxAll: onCheckboxChange,
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(onActionClick, getAccountMail),
    height: 'auto',
    keepSource: true,
    checkboxConfig: {
      highlight: true,
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
    <ExportTable
      v-model:visible="exportVisible"
      :columns="exportColumns"
      :export-api="exportMailTemplate"
      :search-params="exportSearchParams"
      file-name="邮件模板.xls"
      @success="onExportSuccess"
    />
    <Grid table-title="邮件模板列表">
      <template #toolbar-tools>
        <ElButton
          type="primary"
          @click="onCreate"
          v-access:code="['system:mail-template:create']"
        >
          <Plus class="mr-2 size-5" />
          {{ $t('ui.actionTitle.create', ['邮件模板']) }}
        </ElButton>
        <ElButton
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['system:mail-template:export']"
        >
          <Download class="mr-2 size-5" />
          {{ $t('ui.actionTitle.export') }}
        </ElButton>
        <ElButton
          type="danger"
          class="ml-2"
          :disabled="selectedIds.length === 0"
          @click="onBatchDelete"
          v-access:code="['system:mail-template:delete']"
        >
          {{ $t('ui.actionTitle.deleteBatch') }}
        </ElButton>
      </template>
    </Grid>
  </Page>
</template>
