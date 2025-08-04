<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemMenuApi } from '#/api/system/menu';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { ElButton, ElLoading, ElMessage, ElMessageBox } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteMenu, deleteMenuList, getMenuList } from '#/api/system/menu';
import { $t } from '#/locales';
import { SystemMenuTypeEnum } from '#/utils';

import { useGridColumns } from './data';
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

/** 创建菜单 */
function onCreate() {
  formModalApi.setData({}).open();
}

/** 添加下级菜单 */
function onAppend(row: SystemMenuApi.Menu) {
  formModalApi.setData({ pid: row.id }).open();
}

/** 编辑菜单 */
function onEdit(row: SystemMenuApi.Menu) {
  formModalApi.setData(row).open();
}

/** 批量删除菜单 */
async function onBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await ElMessageBox.confirm(
      $t('ui.actionMessage.deleteConfirm', [`${rows.length}个菜单`]),
      $t('ui.actionTitle.deleteBatch'),
      {
        confirmButtonText: $t('common.confirm'),
        cancelButtonText: $t('common.cancel'),
        type: 'warning',
      },
    );
    const ids = rows.map((row) => row.id as number);
    await deleteMenuList(ids);
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

/** 删除菜单 */
async function onDelete(row: SystemMenuApi.Menu) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
    fullscreen: true,
  });
  try {
    await deleteMenu(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } catch {
    // 异常处理
  } finally {
    loadingInstance.close();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({ code, row }: OnActionClickParams<SystemMenuApi.Menu>) {
  switch (code) {
    case 'append': {
      onAppend(row);
      break;
    }
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

/** 切换树形展开/收缩状态 */
const isExpanded = ref(false);
function toggleExpand() {
  isExpanded.value = !isExpanded.value;
  gridApi.grid.setAllTreeExpand(isExpanded.value);
}

const gridEvents = {
  checkboxChange: onCheckboxChange,
  checkboxAll: onCheckboxChange,
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents,
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    checkboxConfig: {
      highlight: true,
      checkStrictly: true, // 严格的遵循父子不关联
    },
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async (_params) => {
          return await getMenuList();
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: { code: 'query' },
    },
    treeConfig: {
      parentField: 'parentId',
      rowField: 'id',
      transform: true,
      reserve: true,
    },
  } as VxeTableGridOptions,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="功能权限"
        url="https://doc.iocoder.cn/resource-permission"
      />
      <DocAlert title="菜单路由" url="https://doc.iocoder.cn/vue3/route/" />
    </template>

    <FormModal @success="onRefresh" />
    <Grid>
      <template #toolbar-tools>
        <ElButton
          type="primary"
          @click="onCreate"
          v-access:code="['system:menu:create']"
        >
          <Plus class="mr-2 size-5" />
          {{ $t('ui.actionTitle.create', ['菜单']) }}
        </ElButton>
        <ElButton
          type="danger"
          class="ml-2"
          :disabled="selectedIds.length === 0"
          @click="onBatchDelete"
          v-access:code="['system:menu:delete']"
        >
          {{ $t('ui.actionTitle.deleteBatch') }}
        </ElButton>
        <ElButton class="ml-2" @click="toggleExpand">
          {{ isExpanded ? '收缩' : '展开' }}
        </ElButton>
      </template>
      <template #name="{ row }">
        <div class="flex w-full items-center gap-1">
          <div class="size-5 flex-shrink-0">
            <IconifyIcon
              v-if="row.type === SystemMenuTypeEnum.BUTTON"
              icon="carbon:square-outline"
              class="size-full"
            />
            <IconifyIcon
              v-else-if="row.icon"
              :icon="row.icon || 'carbon:circle-dash'"
              class="size-full"
            />
          </div>
          <span class="flex-auto">{{ $t(row.name) }}</span>
          <div class="items-center justify-end"></div>
        </div>
      </template>
    </Grid>
  </Page>
</template>
