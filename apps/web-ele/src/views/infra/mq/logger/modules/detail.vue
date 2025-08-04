<script lang="ts" setup>
import type { InfraMqLogApi } from '#/api/infra/mq-log';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { ElDescriptions, ElDescriptionsItem } from 'element-plus';

import { getMqLog } from '#/api/infra/mq-log';
import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils';

const formData = ref<InfraMqLogApi.MqLog>();

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
      formData.value = await getMqLog(data.id);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="日志详情"
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
      <ElDescriptionsItem label="日志编号">
        {{ formData?.id }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="消息ID">
        {{ formData?.messageId }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="消费者名称">
        {{ formData?.consumer }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="第几次消费">
        {{ formData?.executeIndex }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="消费时间">
        {{ formData?.beginTime ? formatDateTime(formData.beginTime) : '' }} ~
        {{ formData?.endTime ? formatDateTime(formData.endTime) : '' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="消费时长">
        {{ formData?.duration ? `${formData.duration} 毫秒` : '' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="消费状态">
        <DictTag
          :type="DICT_TYPE.INFRA_JOB_LOG_STATUS"
          :value="formData?.status"
        />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="消费结果">
        {{ formData?.result }}
      </ElDescriptionsItem>
    </ElDescriptions>
  </Modal>
</template>
