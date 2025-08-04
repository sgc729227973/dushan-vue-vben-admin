<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InfraMqApi } from '#/api/infra/mq';
import type { Column } from '#/components/ExportTable/types.js';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteMq,
  exportMq,
  getExportMqFields,
  getMqPage,
} from '#/api/infra/mq';
import ExportTable from '#/components/ExportTable/index.vue';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';
import Form from './modules/form.vue';

const { push } = useRouter();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

// 选中的消息ID列表
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
  selectedIds.value = [];
}

/** 导出表格 */
async function onExport() {
  try {
    // 获取可导出的字段
    const fields = await getExportMqFields();
    exportColumns.value = fields;

    // 获取当前查询条件
    const formValues = await gridApi.formApi.getValues();

    // 设置导出参数并显示导出对话框
    exportSearchParams.value = formValues;
    exportVisible.value = true;
  } catch (error) {
    console.error('获取导出字段失败', error);
    ElMessage.error('获取导出字段失败');
  }
}

/** 导出成功 */
function onExportSuccess() {
  exportVisible.value = false;
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
}

/** 创建消息定义 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑消息定义 */
function onEdit(row: InfraMqApi.Mq) {
  formModalApi.setData(row).open();
}

/** 查看消息详情 */
function onDetail(row: InfraMqApi.Mq) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 跳转到消息日志 */
function onLog(row?: InfraMqApi.Mq) {
  push({
    name: 'InfraMqLog',
    query: row?.consumer ? { consumer: row.consumer } : {},
  });
}

/** 删除消息 */
async function onDelete(row: InfraMqApi.Mq) {
  const loading = ElLoading.service({
    lock: true,
    text: $t('ui.actionMessage.deleting', [row.topic]),
    background: 'rgba(0, 0, 0, 0.7)',
  });
  try {
    await deleteMq(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.topic]));
    onRefresh();
  } finally {
    loading.close();
  }
}

/** 批量删除消息 */
async function onBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await confirm({
      content: $t('ui.actionMessage.deleteConfirm', [
        `${rows.length}个消息定义`,
      ]),
      title: $t('ui.actionTitle.deleteBatch'),
      cancelText: $t('common.cancel'),
      confirmText: $t('common.confirm'),
    });
    // 暂时不实现批量删除，因为后端接口不支持
    const ids = rows.map((row) => row.id as number);
    for (const id of ids) {
      await deleteMq(id);
    }
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    onRefresh();
  } catch {
    // 处理异常
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({ code, row }: OnActionClickParams<InfraMqApi.Mq>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'detail': {
      onDetail(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'log': {
      onLog(row);
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
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getMqPage({
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
  } as VxeTableGridOptions<InfraMqApi.Mq>,
  gridEvents,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="消息队列" url="https://doc.iocoder.cn/message-queue/" />
    </template>

    <FormModal @success="onRefresh" />
    <DetailModal />

    <!-- 导出对话框 -->
    <ExportTable
      v-model:visible="exportVisible"
      :columns="exportColumns"
      :export-api="exportMq"
      :search-params="exportSearchParams"
      file-name="MQ消息定义.xls"
      @success="onExportSuccess"
    />

    <Grid table-title="MQ消息定义列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['消息']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['infra:mq-definition:create'],
              onClick: onCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['infra:mq-definition:export'],
              onClick: onExport,
            },
            {
              label: $t('ui.actionTitle.executionLog'),
              type: 'primary',
              icon: ACTION_ICON.LOG,
              auth: ['infra:mq-log:query'],
              onClick: () => onLog(undefined),
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'danger',
              icon: ACTION_ICON.DELETE,
              auth: ['infra:mq-definition:delete'],
              disabled: selectedIds.length === 0,
              onClick: onBatchDelete,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
