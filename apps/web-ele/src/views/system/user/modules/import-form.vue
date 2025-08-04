<script lang="ts" setup>
import type { UploadInstance, UploadProps, UploadRawFile } from 'element-plus';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import {
  ElCheckbox,
  ElDescriptions,
  ElDescriptionsItem,
  ElLink,
  ElMessage,
  ElUpload,
} from 'element-plus';

import { importUser, importUserTemplate } from '#/api/system/user';

defineOptions({ name: 'SystemUserImportForm' });

const emit = defineEmits(['success']);

const message = ElMessage;

const formLoading = ref(false);
const uploadRef = ref<UploadInstance>();
const updateSupport = ref(false);
const importResult = ref<null | Record<string, any>>(null);

const [Modal, modalApi] = useVbenModal({
  onConfirm,
});

function onConfirm() {
  if (importResult.value) {
    modalApi.close();
    return;
  }
  uploadRef.value?.submit();
}

/**
 * 打开弹窗
 */
function open() {
  importResult.value = null;
  updateSupport.value = false;
  uploadRef.value?.clearFiles();
  modalApi.open();
}

defineExpose({ open });

/**
 * 文件上传
 */

const handleUploadSuccess: UploadProps['onSuccess'] = (
  data: Record<string, any>,
) => {
  formLoading.value = false;
  modalApi.unlock();
  importResult.value = data;
  emit('success');
};

const handleUploadError: UploadProps['onError'] = () => {
  message.error('上传失败，请您重新上传！');
  formLoading.value = false;
  modalApi.unlock();
};

const beforeUpload = (_file: UploadRawFile) => {
  formLoading.value = true;
  modalApi.lock();
  return true;
};

/** 文件数超出提示 */
const handleExceed: UploadProps['onExceed'] = () => {
  message.error('最多只能上传一个文件！');
};

/** 下载模板操作 */
const onDownloadTemplate = async () => {
  const data = await importUserTemplate();
  downloadFileFromBlobPart({
    fileName: '用户导入模板.xls',
    source: data,
  });
};
</script>

<template>
  <Modal
    :title="importResult ? '导入结果' : '用户导入'"
    :show-cancel-button="!importResult"
    :confirm-button-text="importResult ? '关闭' : '确定'"
    @confirm="onConfirm"
    :width="400"
  >
    <!-- 结果展示 -->
    <div v-if="importResult" class="p-4">
      <ElDescriptions title="导入成功" :column="1" border>
        <ElDescriptionsItem label="创建用户">
          {{ importResult.createUsernames.join(', ') || '无' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="更新用户">
          {{ importResult.updateUsernames.join(', ') || '无' }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <ElDescriptions
        v-if="Object.keys(importResult.failureUsernames).length > 0"
        title="导入失败"
        :column="1"
        border
        class="mt-4"
      >
        <ElDescriptionsItem
          v-for="(reason, username) in importResult.failureUsernames"
          :key="username"
          :label="String(username)"
        >
          {{ reason }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </div>

    <!-- 上传组件 -->
    <ElUpload
      v-else
      ref="uploadRef"
      :auto-upload="false"
      :before-upload="beforeUpload"
      :disabled="formLoading"
      :http-request="(options) => importUser(options.file, updateSupport)"
      :limit="1"
      :on-error="handleUploadError"
      :on-exceed="handleExceed"
      :on-success="handleUploadSuccess"
      accept=".xlsx, .xls"
      drag
    >
      <IconifyIcon class="text-4xl" icon="ep:upload-filled" />
      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      <template #tip>
        <div class="el-upload__tip text-center">
          <div class="el-upload__tip">
            <ElCheckbox v-model="updateSupport" />
            是否更新已经存在的用户数据
          </div>
          <span>仅允许导入 xls、xlsx 格式文件。</span>
          <ElLink
            :underline="false"
            class="text-xs"
            type="primary"
            @click="onDownloadTemplate"
          >
            下载模板
          </ElLink>
        </div>
      </template>
    </ElUpload>
  </Modal>
</template>
