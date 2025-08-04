<script lang="ts" setup>
import type { SystemDeptApi } from '#/api/system/dept';

import { onMounted, ref } from 'vue';

import { handleTree } from '@vben/utils';

import { ElTree } from 'element-plus';

import { getSimpleDeptList } from '#/api/system/dept';

const emit = defineEmits(['select', 'deptCheck']);
const deptList = ref<SystemDeptApi.Dept[]>([]); // 部门列表
const deptTree = ref<any[]>([]); // 部门树
const loading = ref(false); // 加载状态
const treeRef = ref<InstanceType<typeof ElTree>>();

/** 选中部门 */
const handleSelect = (data: any, event: Event) => {
  // 阻止事件冒泡，防止触发复选框
  event.stopPropagation();
  emit('select', data);
};

/** 处理部门勾选变化 */
const handleCheckChange = () => {
  if (treeRef.value) {
    const checkedKeys = treeRef.value.getCheckedKeys() as number[];
    emit('deptCheck', checkedKeys);
  }
};

/** 初始化 */
onMounted(async () => {
  try {
    loading.value = true;
    const data = await getSimpleDeptList();
    deptList.value = data;
    deptTree.value = handleTree(data);
  } catch (error) {
    console.error('获取部门数据失败', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div v-loading="loading">
    <ElTree
      ref="treeRef"
      class="dept-tree custom-tree pt-2"
      v-if="deptTree.length > 0"
      :data="deptTree"
      :props="{ label: 'name', children: 'children' }"
      @check="handleCheckChange"
      default-expand-all
      node-key="id"
      show-checkbox
      :check-on-click-node="false"
    >
      <template #default="{ data }">
        <div class="custom-node">
          <span class="dept-name" @click="handleSelect(data, $event)">{{
            data.name
          }}</span>
        </div>
      </template>
    </ElTree>
    <div v-else-if="!loading" class="py-4 text-center text-gray-500">
      暂无数据
    </div>
  </div>
</template>
