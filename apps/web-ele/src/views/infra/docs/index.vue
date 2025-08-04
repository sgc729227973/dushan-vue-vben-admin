<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import { getConfigKey } from '#/api/infra/config';
import { IFrame } from '#/components/iframe';

const loading = ref(true); // 是否加载中
const baseUrl = ref(import.meta.env.VITE_BASE_URL); // 基础URL
const currentSrc = ref(''); // 当前显示的文档URL

// 文档类型
const docType = ref('redoc');
const docTypes = [
  { value: 'redoc', label: 'ReDoc文档' },
  { value: 'docs', label: 'Swagger文档' },
];

// 文档URL映射
const docUrls = ref({
  redoc: `${baseUrl.value}/redoc`,
  docs: `${baseUrl.value}/docs`,
});

/** 初始化 */
onMounted(async () => {
  try {
    // 尝试从配置中获取文档地址
    const redocUrl = await getConfigKey('url.redoc');
    if (redocUrl && redocUrl.length > 0) {
      docUrls.value.redoc = redocUrl;
    }

    const swaggerUrl = await getConfigKey('url.docs');
    if (swaggerUrl && swaggerUrl.length > 0) {
      docUrls.value.docs = swaggerUrl;
    }

    // 设置默认显示ReDoc
    switchDocType(docType.value);
  } finally {
    loading.value = false;
  }
});

// 切换文档类型
function switchDocType(type: string) {
  docType.value = type;
  currentSrc.value =
    docUrls.value[type as keyof typeof docUrls.value] || docUrls.value.redoc;
}
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="接口文档" url="https://doc.iocoder.cn/api-doc/" />
    </template>

    <div class="mb-4">
      <el-radio-group v-model="docType" @change="switchDocType">
        <el-radio-button
          v-for="type in docTypes"
          :key="type.value"
          :label="type.value"
        >
          {{ type.label }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <IFrame v-if="!loading" v-loading="loading" :src="currentSrc" />
  </Page>
</template>

<style scoped>
/* 添加一些基础样式以确保iframe正常显示 */
:deep(.iframe-container) {
  height: calc(100vh - 180px);
}
</style>
