<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemOAuth2TokenApi } from '#/api/system/oauth2/token';

import { ref } from 'vue';

import { confirm, DocAlert, Page } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteOAuth2Token,
  deleteOAuth2TokenList,
  getOAuth2TokenPage,
} from '#/api/system/oauth2/token';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';

// 选中的访问令牌列表
const selectedAccessTokens = ref<string[]>([]);

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
  // 清空选中状态
  gridApi.grid.clearCheckboxRow();
  selectedAccessTokens.value = [];
}

/** 删除 OAuth2 令牌 */
async function handleDelete(row: SystemOAuth2TokenApi.OAuth2Token) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', ['令牌']),
    key: 'action_key_msg',
  });
  try {
    await deleteOAuth2Token(row.accessToken);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', ['令牌']),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 批量强退令牌 */
async function handleBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await confirm({
      content: $t('ui.actionMessage.deleteConfirm', [`${rows.length}个令牌`]),
      title: '批量强退',
      cancelText: $t('common.cancel'),
      confirmText: $t('common.confirm'),
    });
    await deleteOAuth2TokenList(rows.map((row) => row.accessToken));
    message.success($t('ui.actionMessage.deleteSuccess'));
    onRefresh();
  } catch {
    // 处理异常
  }
}

/** 更新选中访问令牌列表 */
function onCheckboxChange() {
  selectedAccessTokens.value = gridApi.grid
    .getCheckboxRecords()
    .map((row) => row.accessToken);
}

// 表格事件
const gridEvents = {
  checkboxChange: onCheckboxChange,
  checkboxAll: onCheckboxChange,
};

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
        <TableAction
          :actions="[
            {
              label: '批量强退',
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['system:oauth2-token:delete'],
              disabled: selectedAccessTokens.length === 0,
              onClick: handleBatchDelete,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '强退',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['system:oauth2-token:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', ['令牌']),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
