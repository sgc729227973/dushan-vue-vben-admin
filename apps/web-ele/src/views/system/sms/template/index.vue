<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemSmsTemplateApi } from '#/api/system/sms/template';
import type { Column } from '#/components/ExportTable/types.js';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { ElLoading, ElMessage, ElMessageBox } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSmsTemplate,
  deleteSmsTemplateList,
  exportSmsTemplate,
  getExportSmsTemplateFields,
  getSmsTemplatePage,
} from '#/api/system/sms/template';
import ExportTable from '#/components/ExportTable/index.vue';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';
import SendForm from './modules/send-form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [SendModal, sendModalApi] = useVbenModal({
  connectedComponent: SendForm,
  destroyOnClose: true,
});

// 选中的短信模板ID列表
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

// 导出相关
const exportVisible = ref(false);
const exportSearchParams = ref<Record<string, any>>({});
const exportColumns = ref<Column[]>([]);

/** 导出表格 */
async function onExport() {
  try {
    const fields = await getExportSmsTemplateFields();
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

/** 创建短信模板 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑短信模板 */
function onEdit(row: SystemSmsTemplateApi.SmsTemplate) {
  formModalApi.setData(row).open();
}

/** 发送测试短信 */
function onSend(row: SystemSmsTemplateApi.SmsTemplate) {
  sendModalApi.setData(row).open();
}

/** 删除短信模板 */
async function onDelete(row: SystemSmsTemplateApi.SmsTemplate) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
    fullscreen: true,
  });
  try {
    await deleteSmsTemplate(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } catch {
    // 异常处理
  } finally {
    loadingInstance.close();
  }
}

/** 批量删除短信模板 */
async function onBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await ElMessageBox.confirm(
      $t('ui.actionMessage.deleteConfirm', [`${rows.length}个短信模板`]),
      $t('ui.actionTitle.deleteBatch'),
      {
        type: 'warning',
        confirmButtonText: $t('common.confirm'),
        cancelButtonText: $t('common.cancel'),
      },
    );
    const ids = rows.map((row) => row.id as number);
    await deleteSmsTemplateList(ids);
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
}: OnActionClickParams<SystemSmsTemplateApi.SmsTemplate>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'sms-send': {
      onSend(row);
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
      highlight: true, // 高亮选中行
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getSmsTemplatePage({
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
  } as VxeTableGridOptions<SystemSmsTemplateApi.SmsTemplate>,
  gridEvents, // 传入事件
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="短信配置" url="https://doc.iocoder.cn/sms/" />
    </template>

    <FormModal @success="onRefresh" />
    <SendModal />
    <ExportTable
      v-model:visible="exportVisible"
      :columns="exportColumns"
      :export-api="exportSmsTemplate"
      :search-params="exportSearchParams"
      file-name="短信模板.xls"
      @success="onExportSuccess"
    />
    <Grid table-title="短信模板列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['短信模板']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['system:sms-template:create'],
              onClick: onCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['system:sms-template:export'],
              onClick: onExport,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'danger',
              icon: ACTION_ICON.DELETE,
              auth: ['system:sms-template:delete'],
              disabled: selectedIds.length === 0,
              onClick: onBatchDelete,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
