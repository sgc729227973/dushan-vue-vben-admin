<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemOAuth2TokenApi } from '#/api/system/oauth2/token';

import { ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import { ElButton, ElLoading, ElMessage, ElMessageBox } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteOAuth2Token,
  deleteOAuth2TokenList,
  getOAuth2TokenPage,
} from '#/api/system/oauth2/token';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';

const selectedAccessTokens = ref<string[]>([]);

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
  selectedAccessTokens.value = [];
}

/** 批量强退 */
async function onBatchForceLogout() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await ElMessageBox.confirm(
      $t('ui.actionMessage.deleteConfirm', [`${rows.length}个令牌`]),
      '批量强退',
      {
        confirmButtonText: $t('common.confirm'),
        cancelButtonText: $t('common.cancel'),
        type: 'warning',
      },
    );
    const accessTokens = rows.map((row) => row.accessToken);
    await deleteOAuth2TokenList(accessTokens);
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    onRefresh();
  } catch {
    // 处理异常
  }
}

/** 更新选中 access token 列表 */
function onCheckboxChange() {
  selectedAccessTokens.value = gridApi.grid
    .getCheckboxRecords()
    .map((row) => row.accessToken);
}

/** 删除 OAuth2 令牌 */
async function onDelete(row: SystemOAuth2TokenApi.OAuth2Token) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', ['令牌']),
    fullscreen: true,
  });
  try {
    await deleteOAuth2Token(row.accessToken);
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
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
}: OnActionClickParams<SystemOAuth2TokenApi.OAuth2Token>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
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
          return await getOAuth2TokenPage({
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
  } as VxeTableGridOptions<SystemOAuth2TokenApi.OAuth2Token>,
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

    <Grid table-title="令牌列表">
      <template #toolbar-tools>
        <ElButton
          type="danger"
          class="ml-2"
          :disabled="selectedAccessTokens.length === 0"
          @click="onBatchForceLogout"
          v-access:code="['system:oauth2-token:delete']"
        >
          批量强退
        </ElButton>
      </template>
    </Grid>
  </Page>
</template>
