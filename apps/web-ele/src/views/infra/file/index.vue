<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InfraFileApi } from '#/api/infra/file';

import { ref } from 'vue';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { openWindow } from '@vben/utils';

import { useClipboard } from '@vueuse/core';
import { ElImage, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteFile, deleteFileList, getFilePage } from '#/api/infra/file';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

// 选中的文件ID列表
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

/** 上传文件 */
function onUpload() {
  formModalApi.setData(null).open();
}

/** 复制链接到剪贴板 */
const { copy } = useClipboard({ legacy: true });
async function onCopyUrl(row: InfraFileApi.File) {
  if (!row.url) {
    ElMessage.error('文件 URL 为空');
    return;
  }

  try {
    await copy(row.url);
    ElMessage.success('复制成功');
  } catch {
    ElMessage.error('复制失败');
  }
}

/** 打开 URL */
function openUrl(url?: string) {
  if (url) {
    openWindow(url);
  }
}

/** 删除文件 */
async function onDelete(row: InfraFileApi.File) {
  const loading = ElLoading.service({
    lock: true,
    text: $t('ui.actionMessage.deleting', [row.name || row.path]),
    background: 'rgba(0, 0, 0, 0.7)',
  });
  try {
    await deleteFile(row.id as number);
    ElMessage.success(
      $t('ui.actionMessage.deleteSuccess', [row.name || row.path]),
    );
    onRefresh();
  } catch {
    // 错误处理
  } finally {
    loading.close();
  }
}

/** 批量删除文件 */
async function onBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await confirm({
      content: $t('ui.actionMessage.deleteConfirm', [`${rows.length}个文件`]),
      title: $t('ui.actionTitle.deleteBatch'),
      cancelText: $t('common.cancel'),
      confirmText: $t('common.confirm'),
    });
    const ids = rows.map((row) => row.id as number);
    await deleteFileList(ids);
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    onRefresh();
  } catch {
    // 处理异常
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({ code, row }: OnActionClickParams<InfraFileApi.File>) {
  switch (code) {
    case 'copyUrl': {
      onCopyUrl(row);
      break;
    }
    case 'delete': {
      onDelete(row);
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
          return await getFilePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      height: 100,
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<InfraFileApi.File>,
  gridEvents,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid table-title="文件列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '上传文件',
              type: 'primary',
              icon: ACTION_ICON.UPLOAD,
              onClick: onUpload,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'danger',
              icon: ACTION_ICON.DELETE,
              auth: ['infra:file:delete'],
              disabled: selectedIds.length === 0,
              onClick: onBatchDelete,
            },
          ]"
        />
      </template>
      <template #file-content="{ row }">
        <ElImage
          v-if="row.type && row.type.includes('image')"
          fit="cover"
          height="60"
          preview-teleported
          :preview-src-list="[row.url || '']"
          :src="row.url || ''"
        />
        <ElButton
          v-else-if="row.type && row.type.includes('pdf')"
          type="primary"
          link
          @click="() => openUrl(row.url)"
        >
          预览
        </ElButton>
        <ElButton v-else type="primary" link @click="() => openUrl(row.url)">
          下载
        </ElButton>
      </template>
    </Grid>
  </Page>
</template>
