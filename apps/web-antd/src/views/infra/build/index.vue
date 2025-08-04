<!-- eslint-disable no-useless-escape -->
<script setup lang="ts">
import { ref, unref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import FcDesigner from '@form-create/antd-designer';
import { useClipboard } from '@vueuse/core';
import { Button, message } from 'ant-design-vue';

import { useFormCreateDesigner } from '#/components/form-create';

defineOptions({ name: 'InfraBuild' });

const [Modal] = useVbenModal();

const designer = ref(); // 表单设计器

// 表单设计器配置
const designerConfig = ref({
  switchType: [], // 是否可以切换组件类型,或者可以相互切换的字段
  autoActive: true, // 是否自动选中拖入的组件
  useTemplate: false, // 是否生成vue2语法的模板组件
  formOptions: {
    form: {
      labelWidth: '100px', // 设置默认的 label 宽度为 100px
    },
  }, // 定义表单配置默认值
  fieldReadonly: false, // 配置field是否可以编辑
  hiddenDragMenu: false, // 隐藏拖拽操作按钮
  hiddenDragBtn: false, // 隐藏拖拽按钮
  hiddenMenu: [], // 隐藏部分菜单
  hiddenItem: [], // 隐藏部分组件
  hiddenItemConfig: {}, // 隐藏组件的部分配置项
  disabledItemConfig: {}, // 禁用组件的部分配置项
  showSaveBtn: false, // 是否显示保存按钮
  showConfig: true, // 是否显示右侧的配置界面
  showBaseForm: true, // 是否显示组件的基础配置表单
  showControl: true, // 是否显示组件联动
  showPropsForm: true, // 是否显示组件的属性配置表单
  showEventForm: true, // 是否显示组件的事件配置表单
  showValidateForm: true, // 是否显示组件的验证配置表单
  showFormConfig: true, // 是否显示表单配置
  showInputData: true, // 是否显示录入按钮
  showDevice: true, // 是否显示多端适配选项
  appendConfigData: [], // 定义渲染规则所需的formData
});

const dialogTitle = ref(''); // 弹窗的标题
const formType = ref(-1); // 表单的类型：0 - 生成 JSON；1 - 生成 Options；2 - 生成组件
const formData = ref(''); // 表单数据
useFormCreateDesigner(designer); // 表单设计器增强

/** 复制 */
async function copy(text: string) {
  const textToCopy = JSON.stringify(text, null, 2);
  const { copy, copied, isSupported } = useClipboard({ source: textToCopy });
  if (isSupported) {
    await copy();
    if (unref(copied)) {
      message.success('复制成功');
    }
  } else {
    message.error('复制失败');
  }
}
</script>

<template>
  <Page auto-content-height>
    <FcDesigner ref="designer" height="90vh" :config="designerConfig" />

    <!-- 弹窗：表单预览 -->
    <Modal :title="dialogTitle" :footer="false" :fullscreen-button="false">
      <div>
        <Button style="float: right" @click="copy(formData)"> 复制 </Button>
        <div>
          <pre><code>{{ formType === 2 ? formData : JSON.stringify(formData, null, 2) }}</code></pre>
        </div>
      </div>
    </Modal>
  </Page>
</template>
