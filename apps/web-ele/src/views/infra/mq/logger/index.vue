<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InfraMqLogApi } from '#/api/infra/mq-log';
import type { Column } from '#/components/ExportTable/types.js';

import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { Download } from '@vben/icons';

import { ElButton, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  exportMqLog,
  getExportMqLogFields,
  getMqLogPage,
} from '#/api/infra/mq-log';
import ExportTable from '#/components/ExportTable/index.vue';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';

const { query } = useRoute();

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

// 导出相关
const exportVisible = ref(false);
const exportSearchParams = ref({});
const exportColumns = ref<Column[]>([]);

/** 导出表格 */
async function onExport() {
  try {
    // 获取可导出的字段
    const fields = await getExportMqLogFields();
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

/** 查看日志详情 */
function onDetail(row: InfraMqLogApi.MqLog) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<InfraMqLogApi.MqLog>) {
  switch (code) {
    case 'detail': {
      onDetail(row);
      break;
    }
  }
}

// 获取表单schema
const formSchema = useGridFormSchema();

// 初始化表格
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: formSchema,
  },
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const params = { ...formValues };
          // 如果URL中有consumer参数，则使用该参数
          if (query.consumer) {
            params.consumer = query.consumer;
          }

          return await getMqLogPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...params,
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
  } as VxeTableGridOptions<InfraMqLogApi.MqLog>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="消息队列" url="https://doc.iocoder.cn/message-queue/" />
    </template>

    <DetailModal />

    <!-- 导出对话框 -->
    <ExportTable
      v-model:visible="exportVisible"
      :columns="exportColumns"
      :export-api="exportMqLog"
      :search-params="exportSearchParams"
      file-name="MQ消费日志.xls"
      @success="onExportSuccess"
    />

    <Grid table-title="MQ消费日志列表">
      <template #toolbar-tools>
        <ElButton
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['infra:mq-log:export']"
        >
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </ElButton>
      </template>
    </Grid>
  </Page>
</template>
