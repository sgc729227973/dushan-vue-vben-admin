<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemOAuth2ClientApi } from '#/api/system/oauth2/client';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { ElButton, ElLoading, ElMessage, ElMessageBox } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteOAuth2Client,
  deleteOAuth2ClientList,
  getOAuth2ClientPage,
} from '#/api/system/oauth2/client';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const selectedIds = ref<number[]>([]);

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
  selectedIds.value = [];
}

/** 创建 OAuth2 客户端 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑 OAuth2 客户端 */
function onEdit(row: SystemOAuth2ClientApi.OAuth2Client) {
  formModalApi.setData(row).open();
}

/** 批量删除 OAuth2 客户端 */
async function onBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await ElMessageBox.confirm(
      $t('ui.actionMessage.deleteConfirm', [`${rows.length}个客户端`]),
      $t('ui.actionTitle.deleteBatch'),
      {
        confirmButtonText: $t('common.confirm'),
        cancelButtonText: $t('common.cancel'),
        type: 'warning',
      },
    );
    const ids = rows.map((row) => row.id as number);
    await deleteOAuth2ClientList(ids);
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

/** 删除 OAuth2 客户端 */
async function onDelete(row: SystemOAuth2ClientApi.OAuth2Client) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
    fullscreen: true,
  });
  try {
    await deleteOAuth2Client(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } catch {
    // 异常处理
  } finally {
    loadingInstance.close();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemOAuth2ClientApi.OAuth2Client>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
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
          return await getOAuth2ClientPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      height: 80,
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<SystemOAuth2ClientApi.OAuth2Client>,
  gridEvents,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="OAuth 2.0（SSO 单点登录）"
        url="https://doc.iocoder.cn/oauth2/"
      />
    </template>

    <FormModal @success="onRefresh" />
    <Grid table-title="OAuth2 客户端列表">
      <template #toolbar-tools>
        <ElButton
          type="primary"
          @click="onCreate"
          v-access:code="['system:oauth2-client:create']"
        >
          <Plus class="mr-2 size-5" />
          {{ $t('ui.actionTitle.create', [' OAuth2.0 客户端']) }}
        </ElButton>
        <ElButton
          type="danger"
          class="ml-2"
          :disabled="selectedIds.length === 0"
          @click="onBatchDelete"
          v-access:code="['system:oauth2-client:delete']"
        >
          {{ $t('ui.actionTitle.deleteBatch') }}
        </ElButton>
      </template>
    </Grid>
  </Page>
</template>
