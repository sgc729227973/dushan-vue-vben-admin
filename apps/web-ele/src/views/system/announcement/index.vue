<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemAnnouncementApi } from '#/api/system/announcement';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { ElButton, ElMessage, ElMessageBox } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteAnnouncement,
  deleteAnnouncementList,
  getAnnouncementPage,
  publishAnnouncement,
  scheduleAnnouncement,
} from '#/api/system/announcement';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';
import Preview from './modules/preview.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [PreviewModal, previewModalApi] = useVbenModal({
  connectedComponent: Preview,
  destroyOnClose: true,
});

const selectedIds = ref<number[]>([]);

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
  selectedIds.value = [];
}

/** 创建公告 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑公告 */
function onEdit(row: SystemAnnouncementApi.Announcement) {
  formModalApi.setData(row).open();
}

/** 批量删除公告 */
async function onBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await ElMessageBox.confirm(
      $t('ui.actionMessage.deleteConfirm', [`${rows.length}个公告`]),
      $t('ui.actionTitle.deleteBatch'),
      {
        confirmButtonText: $t('common.confirm'),
        cancelButtonText: $t('common.cancel'),
        type: 'warning',
      },
    );
    const ids = rows.map((row) => row.id as number);
    await deleteAnnouncementList(ids);
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

/** 删除公告 */
async function onDelete(row: SystemAnnouncementApi.Announcement) {
  const loadingInstance = ElMessage({
    message: $t('ui.actionMessage.deleting', [row.title]),
    type: 'info',
    duration: 0,
  });
  try {
    await deleteAnnouncement(row.id as number);
    loadingInstance.close();
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.title]));
    onRefresh();
  } catch {
    loadingInstance.close();
  }
}

/** 立即发布公告 */
async function onPublish(row: SystemAnnouncementApi.Announcement) {
  const loadingInstance = ElMessage({
    message: $t('ui.actionMessage.processing', ['立即发布']),
    type: 'info',
    duration: 0,
  });
  try {
    await publishAnnouncement(row.id as number);
    loadingInstance.close();
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
    onRefresh();
  } catch {
    loadingInstance.close();
  }
}

/** 定时发布公告 */
async function onSchedule(row: SystemAnnouncementApi.Announcement) {
  // 检查是否设置了发布时间
  if (!row.publishTime) {
    ElMessage.warning('请先在编辑页面设置发布时间');
    return;
  }

  const loadingInstance = ElMessage({
    message: $t('ui.actionMessage.processing', ['定时发布']),
    type: 'info',
    duration: 0,
  });
  try {
    await scheduleAnnouncement(row.id as number);
    loadingInstance.close();
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
    onRefresh();
  } catch {
    loadingInstance.close();
  }
}

/** 预览公告 */
function onPreview(row: SystemAnnouncementApi.Announcement) {
  previewModalApi.setData(row).open();
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemAnnouncementApi.Announcement>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'preview': {
      onPreview(row);
      break;
    }
    case 'publish': {
      onPublish(row);
      break;
    }
    case 'schedule': {
      onSchedule(row);
      break;
    }
  }
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
    columns: useGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    checkboxConfig: {
      highlight: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getAnnouncementPage({
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
  } as VxeTableGridOptions<SystemAnnouncementApi.Announcement>,
  gridEvents,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <PreviewModal />
    <Grid table-title="公告列表">
      <template #toolbar-tools>
        <ElButton
          type="primary"
          @click="onCreate"
          v-access:code="['system:announcement:create']"
        >
          <Plus class="mr-2 size-5" />
          {{ $t('ui.actionTitle.create', ['公告']) }}
        </ElButton>
        <ElButton
          type="danger"
          class="ml-2"
          :disabled="selectedIds.length === 0"
          @click="onBatchDelete"
          v-access:code="['system:announcement:delete']"
        >
          {{ $t('ui.actionTitle.deleteBatch') }}
        </ElButton>
      </template>
    </Grid>
  </Page>
</template>
