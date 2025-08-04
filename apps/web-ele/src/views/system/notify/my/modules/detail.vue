<script lang="ts" setup>
import type { SystemDeptApi } from '#/api/system/dept';
import type { SystemNotifyMessageApi } from '#/api/system/notify/message';

import { computed, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { ElAvatar } from 'element-plus';

import { getSimpleDeptList } from '#/api/system/dept';

const formData = ref<SystemNotifyMessageApi.NotifyMessage>();
const deptMap = reactive<Record<number, string>>({});

async function ensureDeptMap() {
  if (Object.keys(deptMap).length > 0) return;
  try {
    const list = await getSimpleDeptList();
    list.forEach((d: SystemDeptApi.Dept) => {
      if (d.id) deptMap[d.id] = d.name;
    });
  } catch {
    // ignore
  }
}

const deptName = computed(() => {
  const id = formData.value?.publisherInfo?.deptId as number | undefined;
  return id ? deptMap[id] || id : '-';
});

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    const data = modalApi.getData<SystemNotifyMessageApi.NotifyMessage>();
    if (!data) return;
    await ensureDeptMap();
    formData.value = data;
  },
});
</script>

<template>
  <Modal
    title="消息详情"
    class="w-1/2"
    :show-cancel-button="true"
    :show-confirm-button="false"
  >
    <div class="p-4">
      <div
        class="mb-4 flex flex-col gap-2 border-b pb-2 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-center gap-3">
          <ElAvatar
            :src="formData?.publisherInfo?.avatar"
            :size="40"
            v-if="formData?.publisherInfo?.avatar"
          />
          <div class="flex flex-col">
            <span class="font-medium">{{
              formData?.publisherInfo?.nickname || '未知'
            }}</span>
            <span class="text-xs text-gray-500">{{ deptName }}</span>
          </div>
        </div>
        <div class="text-sm text-gray-500">
          发布时间: {{ formatDateTime(formData?.createTime || '') }}
        </div>
      </div>

      <div class="mb-4">
        <h1 class="text-xl font-bold">{{ formData?.noticeTitle }}</h1>
      </div>

      <div
        class="prose dark:prose-invert max-w-full"
        v-html="formData?.noticeContent"
      ></div>
    </div>
  </Modal>
</template>
