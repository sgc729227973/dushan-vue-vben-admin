<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InfraApiErrorLogApi } from '#/api/infra/api-error-log';
import type { Column } from '#/components/ExportTable/types.js';

import { ref } from 'vue';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { Download } from '@vben/icons';

import { ElButton, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  exportApiErrorLog,
  getApiErrorLogPage,
  getExportApiErrorLogFields,
  updateApiErrorLogStatus,
} from '#/api/infra/api-error-log';
import ExportTable from '#/components/ExportTable/index.vue';
import { $t } from '#/locales';
import { InfraApiErrorLogProcessStatusEnum } from '#/utils';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

// 导出相关
const exportVisible = ref(false);
const exportSearchParams = ref<Record<string, any>>({});
const exportColumns = ref<Column[]>([]);

async function onExport() {
  try {
    const fields = await getExportApiErrorLogFields();
    exportColumns.value = fields;

    const formValues = await gridApi.formApi.getValues();
    exportSearchParams.value = formValues;
    exportVisible.value = true;
  } catch (error) {
    console.error('获取导出字段失败', error);
  }
}

function onExportSuccess() {
  exportVisible.value = false;
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
}

/** 查看 API 错误日志详情 */
function onDetail(row: InfraApiErrorLogApi.ApiErrorLog) {
  detailModalApi.setData(row).open();
}

/** 处理已处理 / 已忽略的操作 */
async function onProcess(id: number, processStatus: number) {
  confirm({
    content: `确认标记为${InfraApiErrorLogProcessStatusEnum.DONE ? '已处理' : '已忽略'}?`,
  }).then(async () => {
    await updateApiErrorLogStatus(id, processStatus);
    // 关闭并提示
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
    onRefresh();
  });
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<InfraApiErrorLogApi.ApiErrorLog>) {
  switch (code) {
    case 'detail': {
      onDetail(row);
      break;
    }
    case 'done': {
      onProcess(row.id, InfraApiErrorLogProcessStatusEnum.DONE);
      break;
    }
    case 'ignore': {
      onProcess(row.id, InfraApiErrorLogProcessStatusEnum.IGNORE);
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
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getApiErrorLogPage({
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
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<InfraApiErrorLogApi.ApiErrorLog>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="系统日志" url="https://doc.iocoder.cn/system-log/" />
    </template>

    <DetailModal @success="onRefresh" />
    <ExportTable
      v-model:visible="exportVisible"
      :columns="exportColumns"
      :export-api="exportApiErrorLog"
      :search-params="exportSearchParams"
      file-name="API 错误日志.xls"
      @success="onExportSuccess"
    />
    <Grid table-title="API 错误日志列表">
      <template #toolbar-tools>
        <ElButton
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['infra:api-error-log:export']"
        >
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </ElButton>
      </template>
    </Grid>
  </Page>
</template>
