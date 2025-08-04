<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import { getConfigKey } from '#/api/infra/config';
import { IFrame } from '#/components/iframe';

const loading = ref(true); // 是否加载中
const jaegerUrl = ref('http://localhost:16686'); // 默认Jaeger UI地址
const zipkinUrl = ref('http://localhost:9411'); // 默认Zipkin UI地址
const tempoUrl = ref('http://localhost:3000'); // 默认Tempo UI地址
const currentSrc = ref(''); // 当前显示的URL

// 监控类型
const monitorType = ref('jaeger');

/** 初始化 */
onMounted(async () => {
  try {
    // 从配置中获取地址
    const jaegerData = await getConfigKey('url.jaeger');
    if (jaegerData && jaegerData.length > 0) {
      jaegerUrl.value = jaegerData;
    }

    const zipkinData = await getConfigKey('url.zipkin');
    if (zipkinData && zipkinData.length > 0) {
      zipkinUrl.value = zipkinData;
    }

    const tempoData = await getConfigKey('url.tempo');
    if (tempoData && tempoData.length > 0) {
      tempoUrl.value = tempoData;
    }

    // 设置默认显示Jaeger
    currentSrc.value = jaegerUrl.value;
  } finally {
    loading.value = false;
  }
});

// 切换监控类型
function switchMonitorType(type: string) {
  monitorType.value = type;
  const urlMap = {
    jaeger: jaegerUrl.value,
    zipkin: zipkinUrl.value,
    tempo: tempoUrl.value,
  };
  currentSrc.value = urlMap[type as keyof typeof urlMap] || '';
}
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="数据库监控"
        url="https://doc.iocoder.cn/monitor/database/"
      />
      <DocAlert
        title="OpenTelemetry追踪"
        url="https://doc.iocoder.cn/opentelemetry/"
      />
    </template>

    <div class="mb-4">
      <el-radio-group v-model="monitorType" @change="switchMonitorType">
        <el-radio-button label="jaeger">Jaeger监控</el-radio-button>
        <el-radio-button label="zipkin">Zipkin监控</el-radio-button>
        <el-radio-button label="tempo">Tempo监控</el-radio-button>
      </el-radio-group>
    </div>

    <IFrame v-if="!loading" v-loading="loading" :src="currentSrc" />
  </Page>
</template>
