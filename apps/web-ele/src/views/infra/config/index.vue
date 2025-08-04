<script lang="ts" setup>
import { ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import DataGrid from './modules/data-grid.vue';
import TypeGrid from './modules/type-grid.vue';

const searchTypeId = ref<number>(); // 搜索的配置类型ID

function onTypeSelect(typeId: number) {
  searchTypeId.value = typeId;
}
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="配置管理" url="https://doc.iocoder.cn/infra-config/" />
    </template>

    <div class="flex h-full">
      <!-- 左侧配置类型列表 -->
      <div class="w-1/2 pr-3">
        <TypeGrid @select="onTypeSelect" />
      </div>
      <!-- 右侧配置数据列表 -->
      <div class="w-1/2">
        <DataGrid :type-id="searchTypeId" />
      </div>
    </div>
  </Page>
</template>
