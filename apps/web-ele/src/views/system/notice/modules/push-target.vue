<script lang="ts" setup>
import type { SystemDeptApi } from '#/api/system/dept';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { pushNoticeToTargets } from '#/api/system/notice';

import DeptTree from './dept-tree.vue';
import UserList from './user-list.vue';

const emit = defineEmits(['success']);

const selectedDeptId = ref<number | undefined>(); // 当前选中的部门ID，用于用户列表筛选
const selectedDeptIds = ref<number[]>([]); // 选中的部门ID列表，用于推送
const selectedUserIds = ref<number[]>([]); // 选中的用户ID列表
const loading = ref(false);
const selectAllUsers = ref(false); // 是否选择所有用户

/** 处理部门选择（单击） */
function handleDeptSelect(dept: SystemDeptApi.Dept) {
  selectedDeptId.value = dept.id;
}

/** 处理部门勾选变化（复选框） */
function handleDeptCheck(deptIds: number[]) {
  selectedDeptIds.value = deptIds;
}

// 处理用户选择
function handleUserSelectionChange(userIds: number[]) {
  selectedUserIds.value = userIds;
}

// 计算推送按钮是否禁用
const pushButtonDisabled = computed(() => {
  return (
    !selectAllUsers.value &&
    selectedDeptIds.value.length === 0 &&
    selectedUserIds.value.length === 0
  );
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (pushButtonDisabled.value) {
      ElMessage.warning('请选择推送目标');
      return;
    }

    loading.value = true;
    try {
      const noticeId = modalApi.getData()?.id;
      if (!noticeId) {
        ElMessage.error('通知ID不能为空');
        return;
      }

      await pushNoticeToTargets({
        id: noticeId,
        userIds: selectedUserIds.value,
        deptIds: selectedDeptIds.value,
      });
      ElMessage.success('推送成功');
      await modalApi.close();
      emit('success');
    } catch {
      // 错误由统一拦截器处理
    } finally {
      loading.value = false;
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      // 重置状态
      selectedDeptId.value = undefined;
      selectedDeptIds.value = [];
      selectedUserIds.value = [];
      selectAllUsers.value = false;
    }
  },
});
</script>

<template>
  <Modal title="选择推送范围" class="w-3/5">
    <div class="flex h-[60vh]" :class="{ 'opacity-50': selectAllUsers }">
      <!-- 左侧部门树 -->
      <div class="w-1/4 overflow-y-auto border-r pr-4">
        <DeptTree @select="handleDeptSelect" @dept-check="handleDeptCheck" />
      </div>

      <!-- 右侧用户列表 -->
      <div class="flex w-3/4 flex-col pl-4">
        <UserList
          :dept-id="selectedDeptId"
          @selection-change="handleUserSelectionChange"
        />
      </div>
    </div>
  </Modal>
</template>
