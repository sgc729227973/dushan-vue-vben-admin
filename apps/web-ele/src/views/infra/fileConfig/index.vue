<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InfraFileConfigApi } from '#/api/infra/file-config';

import { ref } from 'vue';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { openWindow } from '@vben/utils';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteFileConfig,
  deleteFileConfigList,
  getFileConfigPage,
  testFileConfig,
  updateFileConfigMaster,
} from '#/api/infra/file-config';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

// 选中的文件配置ID列表
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
  selectedIds.value = [];
}

/** 创建文件配置 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑文件配置 */
function onEdit(row: InfraFileConfigApi.FileConfig) {
  formModalApi.setData(row).open();
}

/** 设为主配置 */
async function onMaster(row: InfraFileConfigApi.FileConfig) {
  const loading = ElLoading.service({
    lock: true,
    text: $t('ui.actionMessage.updating', [row.name]),
    background: 'rgba(0, 0, 0, 0.7)',
  });
  try {
    await updateFileConfigMaster(row.id as number);
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
    onRefresh();
  } catch {
    // 错误处理
  } finally {
    loading.close();
  }
}

/** 测试文件配置 */
async function onTest(row: InfraFileConfigApi.FileConfig) {
  const loading = ElLoading.service({
    lock: true,
    text: '测试上传中...',
    background: 'rgba(0, 0, 0, 0.7)',
  });
  try {
    const response = await testFileConfig(row.id as number);
    // 确认是否访问该文件
    confirm({
      title: '测试上传成功',
      content: '是否要访问该文件？',
      confirmText: '访问',
      cancelText: '取消',
    }).then(() => {
      openWindow(response);
    });
  } catch {
    // 错误处理
  } finally {
    loading.close();
  }
}

/** 删除文件配置 */
async function onDelete(row: InfraFileConfigApi.FileConfig) {
  const loading = ElLoading.service({
    lock: true,
    text: $t('ui.actionMessage.deleting', [row.name]),
    background: 'rgba(0, 0, 0, 0.7)',
  });
  try {
    await deleteFileConfig(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } catch {
    // 错误处理
  } finally {
    loading.close();
  }
}

/** 批量删除文件配置 */
async function onBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await confirm({
      content: $t('ui.actionMessage.deleteConfirm', [
        `${rows.length}个文件配置`,
      ]),
      title: $t('ui.actionTitle.deleteBatch'),
      cancelText: $t('common.cancel'),
      confirmText: $t('common.confirm'),
    });
    const ids = rows.map((row) => row.id as number);
    await deleteFileConfigList(ids);
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
}: OnActionClickParams<InfraFileConfigApi.FileConfig>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'master': {
      onMaster(row);
      break;
    }
    case 'test': {
      onTest(row);
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
          return await getFileConfigPage({
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
  } as VxeTableGridOptions<InfraFileConfigApi.FileConfig>,
  gridEvents,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid table-title="文件配置列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['文件配置']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['infra:file-config:create'],
              onClick: onCreate,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'danger',
              icon: ACTION_ICON.DELETE,
              auth: ['infra:file-config:delete'],
              disabled: selectedIds.length === 0,
              onClick: onBatchDelete,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
