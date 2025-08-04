<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemSocialClientApi } from '#/api/system/social/client';

import { ref } from 'vue';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSocialClient,
  deleteSocialClientList,
  getSocialClientPage,
} from '#/api/system/social/client';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

// 选中的社交客户端ID列表
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

/** 创建社交客户端 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑社交客户端 */
function onEdit(row: SystemSocialClientApi.SocialClient) {
  formModalApi.setData(row).open();
}

/** 删除社交客户端 */
async function onDelete(row: SystemSocialClientApi.SocialClient) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
    fullscreen: true,
  });
  try {
    await deleteSocialClient(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } catch {
    // 发生错误时不需要做特殊处理，finally会关闭loading
  } finally {
    loadingInstance.close();
  }
}

/** 批量删除社交客户端 */
async function onBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await confirm({
      content: $t('ui.actionMessage.deleteConfirm', [
        `${rows.length}个社交客户端`,
      ]),
      title: $t('ui.actionTitle.deleteBatch'),
      cancelText: $t('common.cancel'),
      confirmText: $t('common.confirm'),
    });
    const ids = rows.map((row) => row.id as number);
    await deleteSocialClientList(ids);
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
}: OnActionClickParams<SystemSocialClientApi.SocialClient>) {
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

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    checkboxConfig: {
      highlight: true, // 高亮选中行
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getSocialClientPage({
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
  } as VxeTableGridOptions<SystemSocialClientApi.SocialClient>,
  gridEvents, // 传入事件
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="三方登录" url="https://doc.iocoder.cn/social-user/" />
    </template>

    <FormModal @success="onRefresh" />
    <Grid table-title="社交客户端列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['社交客户端']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['system:social-client:create'],
              onClick: onCreate,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'danger',
              icon: ACTION_ICON.DELETE,
              auth: ['system:social-client:delete'],
              disabled: selectedIds.length === 0,
              onClick: onBatchDelete,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
