<script lang="ts" setup>
import type { InfraMqApi } from '#/api/infra/mq';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElDescriptions, ElDescriptionsItem } from 'element-plus';

import { getMq } from '#/api/infra/mq';

const formData = ref<InfraMqApi.Mq>();

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<{ id: number }>();
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getMq(data.id);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="消息详情"
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <ElDescriptions
      :column="1"
      border
      size="default"
      class="mx-4"
      :label-width="140"
    >
      <ElDescriptionsItem label="消息编号">
        {{ formData?.id }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="消息主题">
        {{ formData?.topic }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="消费者名称">
        {{ formData?.consumer }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="重试次数">
        {{ formData?.retryCount }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="描述">
        {{ formData?.description }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="创建时间">
        {{ formData?.createTime }}
      </ElDescriptionsItem>
    </ElDescriptions>
  </Modal>
</template>
