<script lang="ts" setup>
import type { InfraConfigApi } from '#/api/infra/config';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createConfigData,
  getConfigData,
  updateConfigData,
} from '#/api/infra/config';
import { $t } from '#/locales';

import { useDataFormSchema } from '../data';

defineOptions({ name: 'InfraConfigDataForm' });

const emit = defineEmits(['success']);
const formData = ref<InfraConfigApi.ConfigData>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['配置数据'])
    : $t('ui.actionTitle.create', ['配置数据']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useDataFormSchema(),
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
    const data = (await formApi.getValues()) as InfraConfigApi.ConfigData;
    try {
      await (formData.value?.id
        ? updateConfigData(data)
        : createConfigData(data));
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
    const data = modalApi.getData<
      InfraConfigApi.ConfigData | { typeId?: number }
    >();

    // 如果有ID，表示是编辑
    if (data && 'id' in data && data.id) {
      modalApi.lock();
      try {
        formData.value = await getConfigData(data.id as number);
        // 设置到 values
        if (formData.value) {
          await formApi.setValues(formData.value);
        }
      } finally {
        modalApi.unlock();
      }
    } else if (data && 'typeId' in data && data.typeId) {
      // 新增时，如果传入了typeId，则需要设置
      await formApi.setValues({
        typeId: data.typeId,
      });
    }
  },
});
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
