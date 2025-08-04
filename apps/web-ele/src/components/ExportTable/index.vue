<script lang="ts" setup>
import type { Column } from './types';

import { computed, ref, watch } from 'vue';

import { downloadFileFromBlobPart } from '@vben/utils';

import {
  ElButton,
  ElCheckbox,
  ElDialog,
  ElMessage,
  ElOption,
  ElSelect,
  ElTag,
} from 'element-plus';

import { $t } from '#/locales';

// 定义组件属性
const props = defineProps({
  // 导出接口函数
  exportApi: {
    type: Function,
    required: true,
  },
  // 表格列定义
  columns: {
    type: Array as () => Column[],
    required: true,
  },
  // 文件名
  fileName: {
    type: String,
    default: 'export.xls',
  },
  // 是否显示
  visible: {
    type: Boolean,
    default: false,
  },
  // 查询参数
  searchParams: {
    type: Object,
    default: () => ({}),
  },
});

// 定义事件
const emit = defineEmits(['success', 'update:visible', 'close']);

// 获取所有可导出的字段
const allColumns = computed(() =>
  props.columns.filter(
    (col): col is Column & { field: string; title: string } =>
      col.type !== 'checkbox' &&
      !col.slots && // 排除操作列
      col.field !== undefined && // 确保有字段名
      col.title !== undefined, // 确保有标题
  ),
);

// 表单数据
const formData = ref({
  // 默认查询条件
  searchParams: {},
  // 默认选择所有字段
  selectedFields: [] as string[],
});

// 初始化选中所有字段
const initSelectedFields = () => {
  formData.value.selectedFields = allColumns.value.map(
    (col) => col.field as string,
  );
};

// 监听props.visible变化
const watchVisible = (val: boolean) => {
  if (val) {
    // 打开时，初始化数据
    formData.value.searchParams = props.searchParams || {};
    initSelectedFields();
    allSelected.value = true;
  }
};

// 监听visible变化
watch(() => props.visible, watchVisible, { immediate: true });

// 全选/取消全选
const allSelected = ref(true);
function toggleSelectAll() {
  formData.value.selectedFields = allSelected.value
    ? allColumns.value.map((col) => col.field as string)
    : [];
}

// 监听选择变化
function onSelectionChange() {
  allSelected.value =
    formData.value.selectedFields.length === allColumns.value.length;
}

// 导出数据
async function handleExport() {
  // 如果没有选择任何字段，提示错误
  if (formData.value.selectedFields.length === 0) {
    ElMessage.warning('请至少选择一个导出字段');
    return;
  }

  try {
    // 导出数据
    const data = await props.exportApi({
      ...formData.value.searchParams,
      fields: formData.value.selectedFields,
    });

    // 下载文件
    downloadFileFromBlobPart({ fileName: props.fileName, source: data });

    // 关闭弹窗
    emit('update:visible', false);
    emit('success');
  } catch (error) {
    console.error('导出失败', error);
  }
}

// 关闭弹窗
function handleClose() {
  emit('update:visible', false);
  emit('close');
}

// 获取已选择的字段数量
const selectedCount = computed(() => formData.value.selectedFields.length);

// 获取总字段数量
const totalCount = computed(() => allColumns.value.length);
</script>

<template>
  <ElDialog
    :title="$t('ui.actionTitle.export')"
    :model-value="visible"
    :width="500"
    destroy-on-close
    @update:model-value="(val) => emit('update:visible', val)"
  >
    <div class="p-5">
      <!-- 字段选择列表 -->
      <ElSelect
        v-model="formData.selectedFields"
        class="w-full"
        multiple
        placeholder="请选择要导出的字段"
        @change="onSelectionChange"
      >
        <ElOption
          v-for="col in allColumns"
          :key="col.field"
          :label="col.title"
          :value="col.field"
        />
      </ElSelect>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="flex w-full items-center justify-between">
        <!-- 左侧 -->
        <div class="flex items-center gap-4">
          <ElCheckbox
            v-model="allSelected"
            class="font-medium"
            @change="toggleSelectAll"
          >
            全选
          </ElCheckbox>
          <ElTag type="info" size="small" class="flex items-center">
            <span class="mr-1">已选</span>
            <span class="font-medium">
              {{ selectedCount }}/{{ totalCount }}
            </span>
          </ElTag>
        </div>
        <!-- 右侧 -->
        <div class="flex justify-end gap-2">
          <ElButton @click="handleClose">{{ $t('common.cancel') }}</ElButton>
          <ElButton type="primary" @click="handleExport">
            {{ $t('ui.actionTitle.export') }}
          </ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<style scoped></style>
