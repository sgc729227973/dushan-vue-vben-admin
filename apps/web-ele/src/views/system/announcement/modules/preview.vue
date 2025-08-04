<script setup lang="ts">
import type { SystemAnnouncementApi } from '#/api/system/announcement';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { getAnnouncement } from '#/api/system/announcement';
import { $t } from '#/locales';

const formData = ref<SystemAnnouncementApi.Announcement>();
const getTitle = computed(() => {
  return formData.value?.title || $t('ui.actionTitle.preview', ['公告']);
});

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<SystemAnnouncementApi.Announcement>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getAnnouncement(data.id as number);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-1/2">
    <div class="p-4">
      <div class="mb-4 border-b pb-2">
        <h1 class="text-xl font-bold">{{ formData?.title }}</h1>
        <div class="mt-2 text-sm text-gray-500">
          <span>发布时间: {{ formData?.publishTime }}</span>
          <span class="ml-4">发布人: {{ formData?.publisher }}</span>
        </div>
      </div>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="mt-4" v-html="formData?.content"></div>
    </div>
  </Modal>
</template>
