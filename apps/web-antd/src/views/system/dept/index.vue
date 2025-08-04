<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemDeptApi } from '#/api/system/dept';
import type { SystemUserApi } from '#/api/system/user';

import { onMounted, ref, watch } from 'vue';

import { confirm, Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteDept, deleteDeptList, getDeptList } from '#/api/system/dept';
import { getSimpleUserList } from '#/api/system/user';
import { $t } from '#/locales';

import { useGridColumns } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const userList = ref<SystemUserApi.User[]>([]);
const selectedRows = ref<SystemDeptApi.Dept[]>([]);
const selectedIds = ref<number[]>([]);

/** 获取负责人名称 */
function getLeaderName(userId: number) {
  return userList.value.find((user) => user.id === userId)?.nickname;
}

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
  // 清空选中状态
  gridApi.grid.clearCheckboxRow();
  selectedRows.value = [];
  selectedIds.value = [];
}

/** 切换树形展开/收缩状态 */
const isExpanded = ref(true);
function toggleExpand() {
  isExpanded.value = !isExpanded.value;
  gridApi.grid.setAllTreeExpand(isExpanded.value);
}

/** 创建部门 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 添加下级部门 */
function handleAppend(row: SystemDeptApi.Dept) {
  formModalApi.setData({ parentId: row.id }).open();
}

/** 编辑部门 */
function handleEdit(row: SystemDeptApi.Dept) {
  formModalApi.setData(row).open();
}

/** 删除部门 */
async function handleDelete(row: SystemDeptApi.Dept) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    key: 'action_key_msg',
  });
  try {
    await deleteDept(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.name]),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 批量删除部门 */
async function handleBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords();
  try {
    await confirm({
      content: $t('ui.actionMessage.deleteConfirm', [`${rows.length}个部门`]),
      title: $t('ui.actionTitle.deleteBatch'),
      cancelText: $t('common.cancel'),
      confirmText: $t('common.confirm'),
    });
    const ids = rows.map((row) => row.id as number);
    await deleteDeptList(ids);
    message.success($t('ui.actionMessage.deleteSuccess'));
    onRefresh();
  } catch {
    // 处理异常
  }
}

/** 选择行变化事件 */
function onCheckboxChange({ records }: { records: SystemDeptApi.Dept[] }) {
  selectedRows.value = records;
  selectedIds.value = records.map((row) => row.id as number);
}

/**
 * 当子部门全部被选中时，解锁父部门使其可选
 */
function updateParentCheckable() {
  const tableData = gridApi.grid.getData();
  if (!tableData || tableData.length === 0) return;

  const childrenMap = new Map<number, number[]>();
  const deptMap = new Map<number, SystemDeptApi.Dept>();

  tableData.forEach((dept) => {
    deptMap.set(dept.id as number, dept);
    if (dept.parentId) {
      if (!childrenMap.has(dept.parentId)) {
        childrenMap.set(dept.parentId, []);
      }
      childrenMap.get(dept.parentId)?.push(dept.id as number);
    }
  });

  childrenMap.forEach((childIds, parentId) => {
    const parentDept = deptMap.get(parentId);
    if (parentDept) {
      const allChildrenSelected = childIds.every((childId) =>
        selectedIds.value.includes(childId),
      );
      // 直接修改数据源，触发响应式更新
      (parentDept as any).checkboxDisabled = !allChildrenSelected;
    }
  });
}

const gridEvents = {
  checkboxChange: onCheckboxChange,
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents,
  gridOptions: {
    columns: useGridColumns(getLeaderName),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async (_params) => {
          const data = await getDeptList();
          const parentIds = new Set(
            data.map((item: SystemDeptApi.Dept) => item.parentId),
          );
          return data.map((item: SystemDeptApi.Dept) => {
            return {
              ...item,
              // 如果一个部门是任何其他部门的父部门，则默认禁用它
              checkboxDisabled: parentIds.has(item.id),
            };
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    checkboxConfig: {
      checkField: 'checked',
      highlight: true,
      checkStrictly: true,
      checkMethod: ({ row }) => {
        return !(row as any).checkboxDisabled;
      },
    },
    toolbarConfig: {
      refresh: { code: 'query' },
    },
    treeConfig: {
      parentField: 'parentId',
      rowField: 'id',
      transform: true,
      expandAll: true,
      reserve: true,
    },
  } as VxeTableGridOptions,
});

// 监听选择变化，更新父部门可选状态
watch(selectedIds, updateParentCheckable, {
  deep: true,
});

/** 初始化 */
onMounted(async () => {
  userList.value = await getSimpleUserList();
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid table-title="部门列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['部门']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['system:dept:create'],
              onClick: handleCreate,
            },
            {
              label: isExpanded ? '收缩' : '展开',
              type: 'primary',
              onClick: toggleExpand,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['system:dept:delete'],
              disabled: selectedIds.length === 0,
              onClick: handleBatchDelete,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '新增下级',
              type: 'link',
              icon: ACTION_ICON.ADD,
              auth: ['system:dept:create'],
              onClick: handleAppend.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['system:dept:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['system:dept:delete'],
              disabled: !!(row.children && row.children.length > 0),
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
