<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InfraOnlineApi } from '#/api/infra/online';

import { Page } from '@vben/common-ui';

import { ElMessage, ElMessageBox } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { forceLogout, getOnlineUserPage } from '#/api/infra/online';

import { useGridColumns, useGridFormSchema } from './data';

/** 强退用户 */
async function onForceLogout(row: InfraOnlineApi.OnlineRespVO) {
  try {
    // 强退的二次确认
    await ElMessageBox.confirm('确定要强制退出该用户吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    // 发起强退
    await forceLogout(row.tokenId!);
    ElMessage.success(`【${row.tokenId}】强退成功`);
    // 刷新列表
    gridApi.query();
  } catch {
    // 取消操作
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<InfraOnlineApi.OnlineRespVO>) {
  switch (code) {
    case 'forceLogout': {
      onForceLogout(row);
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
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getOnlineUserPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'tokenId',
    },
    toolbarConfig: {
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<InfraOnlineApi.OnlineRespVO>,
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert
      title="在线用户监控"
      url="https://doc.iocoder.cn/monitor/online/"
    />
    <Grid table-title="在线用户列表" />
  </Page>
</template>
