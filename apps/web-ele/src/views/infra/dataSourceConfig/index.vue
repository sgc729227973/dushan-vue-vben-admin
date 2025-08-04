<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InfraDataSourceConfigApi } from '#/api/infra/data-source-config';
import type { Column } from '#/components/ExportTable/types.js';

import { onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDataSourceConfig,
  exportDataSourceConfig,
  getDataSourceConfigPage,
  getExportDataSourceConfigFields,
  testDataSourceConfig,
} from '#/api/infra/data-source-config';
import ExportTable from '#/components/ExportTable/index.vue';
import { useTableExport } from '#/hooks/useTableExport';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

// 导出相关
const exportColumns = ref<Column[]>([]);
const {
  exportDialogVisible,
  exportParams,
  defaultFileName,
  openExportDialog,
  closeExportDialog,
} = useTableExport({
  defaultFileName: '数据源配置.xls',
});

/** 创建数据源 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑数据源 */
function onEdit(row: InfraDataSourceConfigApi.DataSourceConfig) {
  formModalApi.setData(row).open();
}

/** 删除数据源 */
async function onDelete(row: InfraDataSourceConfigApi.DataSourceConfig) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
    fullscreen: true,
  });
  try {
    await deleteDataSourceConfig(row.id as number);
    loadingInstance.close();
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    await handleLoadData();
  } catch {
    loadingInstance.close();
  }
}

/** 测试数据源连接 */
async function onTestConnection(
  row: InfraDataSourceConfigApi.DataSourceConfig,
) {
  await testDataSourceConfig(row.id as number);
  ElMessage.success(`数据源 ${row.name} 连接测试成功`);
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<InfraDataSourceConfigApi.DataSourceConfig>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'test': {
      onTestConnection(row);
      break;
    }
  }
}

/** 导出表格 */
async function onExport() {
  try {
    // 获取可导出的字段
    const fields = await getExportDataSourceConfigFields();
    exportColumns.value = fields;

    // 获取当前查询条件
    let formValues = {};
    try {
      // 尝试获取当前查询表单的值
      if (gridApi.formApi) {
        formValues = await gridApi.formApi.getValues();
      }
    } catch (error) {
      console.warn('获取查询条件失败', error);
    }

    // 打开导出对话框
    openExportDialog(formValues);
  } catch (error) {
    console.error('获取导出字段失败', error);
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useGridFormSchema() },
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    rowConfig: { keyField: 'id' },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getDataSourceConfigPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
  } as VxeTableGridOptions<InfraDataSourceConfigApi.DataSourceConfig>,
});

/** 加载数据 */
async function handleLoadData() {
  await gridApi.query();
}

/** 刷新表格 */
async function onRefresh() {
  await handleLoadData();
}

/** 初始化 */
onMounted(() => {
  handleLoadData();
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <!-- 导出对话框 -->
    <ExportTable
      v-model:visible="exportDialogVisible"
      :columns="exportColumns"
      :export-api="exportDataSourceConfig"
      :search-params="exportParams"
      :file-name="defaultFileName"
      @success="closeExportDialog"
    />
    <Grid table-title="数据源列表">
      <template #toolbar-tools>
        <ElButton
          type="primary"
          @click="onCreate"
          v-access:code="['infra:data-source-config:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['数据源']) }}
        </ElButton>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['infra:data-source-config:export'],
              onClick: onExport,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
