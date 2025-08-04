<script lang="ts" setup>
import type { InfraDataSourceConfigApi } from '#/api/infra/data-source-config';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { ElButton, ElMessage } from 'element-plus';

import {
  createDataSourceConfig,
  getDataSourceConfig,
  updateDataSourceConfig,
} from '#/api/infra/data-source-config';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<InfraDataSourceConfigApi.DataSourceConfig>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['数据源'])
    : $t('ui.actionTitle.create', ['数据源']);
});

// 获取表单配置
const formSchema = useFormSchema();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 90,
  },
  layout: 'horizontal',
  schema: formSchema,
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const formValues =
      (await formApi.getValues()) as InfraDataSourceConfigApi.DataSourceConfig;

    const data = formValues;

    try {
      await (formData.value?.id
        ? updateDataSourceConfig(data)
        : createDataSourceConfig(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },

  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<InfraDataSourceConfigApi.DataSourceConfig>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getDataSourceConfig(data.id as number);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    :title="getTitle"
    :show-footer="true"
    :fullscreen-button="false"
    class="w-[40%]"
  >
    <Form class="mx-4" />
    <template #footer>
      <ElButton @click="modalApi.close()"> 取消 </ElButton>
      <ElButton type="primary" @click="modalApi.onConfirm()"> 确定 </ElButton>
    </template>
  </Modal>
</template>
