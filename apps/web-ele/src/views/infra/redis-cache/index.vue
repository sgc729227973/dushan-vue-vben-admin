<script lang="ts" setup>
import { computed, ref } from 'vue';

import { confirm, DocAlert, Page } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import * as RedisListApi from '#/api/infra/redis-cache';

import KeyGrid from './modules/key-grid.vue';
import NameGrid from './modules/name-grid.vue';
import ValueForm from './modules/value-form.vue';

defineOptions({ name: 'InfraCacheList' });

// 当前选中的缓存名称和键名
const selectedCacheName = ref<string>('');
const selectedCacheKey = ref<string>('');

// 组件引用
const nameGridRef = ref();
const keyGridRef = ref();

// 卡片高度，使用计算属性以便于根据需要调整
const cardHeight = computed(() => 'calc(100vh - 180px)');

/** 处理缓存名称选中事件 */
function handleCacheNameSelect(cacheName: string) {
  selectedCacheName.value = cacheName;
  selectedCacheKey.value = '';
}

/** 处理缓存键名选中事件 */
function handleCacheKeySelect(key: string) {
  selectedCacheKey.value = key;
}

/** 清理指定名称缓存 */
async function handleClearCacheName(row: any) {
  try {
    await confirm({
      title: '提示',
      content: `确认要清理缓存【${row.cacheName}】吗？`,
    });
    await RedisListApi.clearCacheName(row.cacheName);
    ElMessage.success(`清理缓存【${row.cacheName}】成功`);

    if (selectedCacheName.value === row.cacheName) {
      keyGridRef.value?.loadData([]);
      selectedCacheKey.value = '';
      selectedCacheName.value = '';
    }

    // 刷新缓存名称列表
    nameGridRef.value?.query();
  } catch (error) {
    console.error('清理缓存名称失败', error);
  }
}

/** 清理指定键名缓存 */
async function handleClearCacheKey(row: any) {
  if (!row) return;

  try {
    await confirm({
      title: '提示',
      content: `确认要清理缓存键【${row.key}】吗？`,
    });
    await RedisListApi.clearCacheKey(row.key);
    ElMessage.success(`清理缓存键【${row.key}】成功`);

    // 重新加载键名列表
    keyGridRef.value?.query();

    if (selectedCacheKey.value === row.key) {
      selectedCacheKey.value = '';
    }
  } catch (error) {
    console.error('清理缓存键名失败', error);
  }
}

/** 清理全部缓存 */
async function handleClearCacheAll() {
  try {
    await confirm({
      title: '警告',
      content: '确认要清理全部 Redis 缓存吗？此操作无法恢复。',
    });
    await RedisListApi.clearCacheAll();
    ElMessage.success('清理全部缓存成功');

    // 清理后刷新所有内容
    nameGridRef.value?.query();
    keyGridRef.value?.loadData([]);
    selectedCacheName.value = '';
    selectedCacheKey.value = '';
  } catch (error) {
    console.error('清理全部缓存失败', error);
  }
}
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="缓存列表" url="https://doc.iocoder.cn/redis-cache/" />

    <div class="app-container">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
          <el-card :style="{ height: cardHeight }">
            <div class="cache-panel">
              <NameGrid
                ref="nameGridRef"
                @select="handleCacheNameSelect"
                @clear-cache-name="handleClearCacheName"
              />
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
          <el-card :style="{ height: cardHeight }">
            <div class="cache-panel">
              <KeyGrid
                ref="keyGridRef"
                :cache-name="selectedCacheName"
                @select="handleCacheKeySelect"
                @clear-cache-key="handleClearCacheKey"
              />
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
          <el-card :style="{ height: cardHeight }">
            <div class="cache-panel">
              <ValueForm
                :cache-name="selectedCacheName"
                :cache-key="selectedCacheKey"
                @clear-cache-all="handleClearCacheAll"
              />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </Page>
</template>

<style lang="scss" scoped>
.app-container {
  padding: 10px;
}

.cache-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

:deep(.el-card__body) {
  height: 100%;
  padding: 0;
}

:deep(.el-table th.el-table__cell),
:deep(.el-table td.el-table__cell) {
  padding: 8px 0;
}

/* 增加空数据区域的最小高度 */
:deep(.vxe-table--empty-block) {
  min-height: 200px;
}

/* 调整表格行高 */
:deep(.vxe-body--row) {
  height: auto;
  min-height: 40px;
}
</style>
