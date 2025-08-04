<script lang="ts" setup>
import { ref, watch } from 'vue';

import { ElButton } from 'element-plus';

import * as RedisListApi from '#/api/infra/redis-cache';

defineOptions({ name: 'InfraCacheValueForm' });

// 定义组件属性和事件
const props = defineProps<{
  cacheKey?: string;
  cacheName?: string;
}>();

const emit = defineEmits<{
  // 清理全部缓存时触发
  (e: 'clearCacheAll'): void;
}>();

// 缓存内容表单
const cacheForm = ref<{
  cacheKey: string;
  cacheName: string;
  cacheValue: string;
}>({
  cacheName: '',
  cacheKey: '',
  cacheValue: '',
});

// 监听cacheName和cacheKey变化，加载缓存内容
watch(
  [() => props.cacheName, () => props.cacheKey],
  async ([newCacheName, newCacheKey]) => {
    if (newCacheName && newCacheKey) {
      await loadCacheValue(newCacheName, newCacheKey);
    } else {
      cacheForm.value = { cacheName: '', cacheKey: '', cacheValue: '' };
    }
  },
  { immediate: true },
);

// 加载缓存内容
async function loadCacheValue(cacheName: string, key: string) {
  try {
    const data = await RedisListApi.getCacheValue(cacheName, key);
    cacheForm.value = data || { cacheName: '', cacheKey: '', cacheValue: '' };
  } catch (error) {
    console.error('获取缓存值失败', error);
    cacheForm.value = { cacheName: '', cacheKey: '', cacheValue: '' };
  }
}

// 清理全部缓存
function onClearCacheAll() {
  emit('clearCacheAll');
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="panel-header">
      <span>缓存内容</span>
      <ElButton type="danger" link @click="onClearCacheAll">
        <Icon icon="ep:delete-location" class="mr-1px" /> 清理全部
      </ElButton>
    </div>

    <div class="panel-body">
      <el-form :model="cacheForm" label-position="top">
        <el-form-item label="缓存名称:" prop="cacheName">
          <el-input v-model="cacheForm.cacheName" readonly />
        </el-form-item>
        <el-form-item label="缓存键名:" prop="cacheKey">
          <el-input v-model="cacheForm.cacheKey" readonly />
        </el-form-item>
        <el-form-item label="缓存内容:" prop="cacheValue">
          <el-input
            v-model="cacheForm.cacheValue"
            type="textarea"
            :rows="12"
            readonly
          />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 500;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.panel-body {
  flex: 1;
  padding: 16px;
  overflow: auto;
}
</style>
