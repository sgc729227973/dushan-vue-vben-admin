<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { InfraJobApi } from '#/api/infra/job';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteJob,
  deleteJobList,
  exportJob,
  getJobPage,
  runJob,
  updateJobStatus,
} from '#/api/infra/job';
import { $t } from '#/locales';
import { InfraJobStatusEnum } from '#/utils';

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

// 选中的任务ID列表
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
  const data = await exportJob(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '定时任务.xls', source: data });
}

/** 创建任务 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑任务 */
function handleEdit(row: InfraJobApi.Job) {
  formModalApi.setData(row).open();
}

/** 查看任务详情 */
function handleDetail(row: InfraJobApi.Job) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 更新任务状态 */
async function handleUpdateStatus(row: InfraJobApi.Job) {
  const status =
    row.status === InfraJobStatusEnum.STOP
      ? InfraJobStatusEnum.NORMAL
      : InfraJobStatusEnum.STOP;
  const statusText = status === InfraJobStatusEnum.NORMAL ? '启用' : '停用';

  confirm({
    content: `确定${statusText} ${row.name} 吗？`,
  }).then(async () => {
    await updateJobStatus({ id: row.id as number, status });
    // 提示成功
    message.success($t('ui.actionMessage.operationSuccess'));
    onRefresh();
  });
}

/** 执行一次任务 */
async function handleTrigger(row: InfraJobApi.Job) {
  confirm({
    content: `确定执行一次 ${row.name} 吗？`,
  }).then(async () => {
    await runJob(row.id as number);
    message.success($t('ui.actionMessage.operationSuccess'));
  });
}

/** 跳转到任务日志 */
function handleLog(row?: InfraJobApi.Job) {
  push({
    name: 'InfraJobLog',
    query: row?.id ? { id: row.id } : {},
  });
}

/** 删除任务 */
async function handleDelete(row: InfraJobApi.Job) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteJob(row.id as number);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 批量删除任务 */
async function handleBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await confirm({
      content: $t('ui.actionMessage.deleteConfirm', [`${rows.length}个任务`]),
      title: $t('ui.actionTitle.deleteBatch'),
      cancelText: $t('common.cancel'),
      confirmText: $t('common.confirm'),
    });
    const ids = rows.map((row) => row.id as number);
    await deleteJobList(ids);
    message.success($t('ui.actionMessage.deleteSuccess'));
    onRefresh();
  } catch {
    // 处理异常
  }
}

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
          return await getJobPage({
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
  } as VxeTableGridOptions<InfraJobApi.Job>,
  gridEvents,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="定时任务" url="https://doc.iocoder.cn/job/" />
      <DocAlert title="异步任务" url="https://doc.iocoder.cn/async-task/" />
      <DocAlert title="消息队列" url="https://doc.iocoder.cn/message-queue/" />
    </template>

    <FormModal @success="onRefresh" />
    <DetailModal />
    <Grid table-title="定时任务列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['任务']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['infra:job:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['infra:job:export'],
              onClick: handleExport,
            },
            {
              label: $t('ui.actionTitle.executionLog'),
              type: 'primary',
              icon: 'lucide:history',
              auth: ['infra:job:query'],
              onClick: () => handleLog(),
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['infra:job:delete'],
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
              auth: ['infra:job:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '开启',
              type: 'link',
              icon: 'lucide:circle-play',
              auth: ['infra:job:update'],
              ifShow: () => row.status === InfraJobStatusEnum.STOP,
              onClick: handleUpdateStatus.bind(null, row),
            },
            {
              label: '暂停',
              type: 'link',
              icon: 'lucide:circle-pause',
              auth: ['infra:job:update'],
              ifShow: () => row.status === InfraJobStatusEnum.NORMAL,
              onClick: handleUpdateStatus.bind(null, row),
            },
            {
              label: '执行',
              type: 'link',
              icon: 'lucide:clock-plus',
              auth: ['infra:job:trigger'],
              onClick: handleTrigger.bind(null, row),
            },
          ]"
          :drop-down-actions="[
            {
              label: $t('common.detail'),
              type: 'link',
              auth: ['infra:job:query'],
              onClick: handleDetail.bind(null, row),
            },
            {
              label: '日志',
              type: 'link',
              auth: ['infra:job:query'],
              onClick: handleLog.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              auth: ['infra:job:delete'],
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
