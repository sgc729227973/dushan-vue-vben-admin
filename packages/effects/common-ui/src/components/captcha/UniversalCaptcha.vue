<script lang="ts" setup>
/**
 * UniversalCaptcha
 * @description 验证码工厂方法，支持多种验证码类型
 */

import type { VerificationProps } from './verification/typing';

import { computed, defineAsyncComponent, ref, toRefs } from 'vue';

// 定义组件属性
const props = defineProps<
  {
    // 阿里云验证码配置
    aliAppKey?: string;
    aliScene?: string;
    // 腾讯云验证码配置
    tencentAppId?: string;
  } & VerificationProps
>();
// 定义事件
const emit = defineEmits(['onSuccess', 'onError', 'onClose', 'onReady']);
// 动态导入各类验证码组件
const Verification = defineAsyncComponent(
  () => import('./verification/index.vue'),
);
const TencentCaptcha = defineAsyncComponent(
  () => import('./verification/verify-tjcaptcha.vue'),
);
const AliCaptcha = defineAsyncComponent(
  () => import('./verification/verify-alicaptcha.vue'),
);

// 解构属性
const { captchaType } = toRefs(props);

// 验证码实例引用
const captchaRef = ref<null | {
  refresh: () => void;
  show: () => void;
}>(null);

// 计算当前使用的验证码组件
const currentCaptcha = computed(() => {
  switch (captchaType.value) {
    case 'aliyuncaptcha': {
      return 'AliCaptcha';
    }
    case 'blockPuzzle':
    case 'clickWord': {
      return 'Verification';
    }
    case 'recaptcha': {
      return 'GoogleReCaptcha';
    }
    case 'tjcaptcha': {
      return 'TencentCaptcha';
    }
    default: {
      return 'Verification';
    }
  }
});

// 显示验证码
const show = () => {
  if (captchaRef.value && captchaRef.value.show) {
    captchaRef.value.show();
  }
};

// 刷新验证码
const refresh = () => {
  if (captchaRef.value && captchaRef.value.refresh) {
    captchaRef.value.refresh();
  }
};

// 处理成功事件
const handleSuccess = (data: any) => {
  emit('onSuccess', data);
};

// 处理错误事件
const handleError = (error: any) => {
  emit('onError', error);
};

// 处理关闭事件
const handleClose = () => {
  emit('onClose');
};

// 处理准备完成事件
const handleReady = (instance: any) => {
  emit('onReady', instance);
};

// 导出方法
defineExpose({
  show,
  refresh,
});
</script>

<template>
  <div class="universal-captcha-container">
    <!-- 原有滑块/文字点选验证码 -->
    <Verification
      v-if="currentCaptcha === 'Verification'"
      ref="captchaRef"
      v-bind="$props"
      @on-success="handleSuccess"
      @on-error="handleError"
      @on-close="handleClose"
      @on-ready="handleReady"
    />

    <!-- 腾讯云验证码 -->
    <TencentCaptcha
      v-else-if="currentCaptcha === 'TencentCaptcha'"
      ref="captchaRef"
      :app-id="tencentAppId"
      :check-captcha-api="checkCaptchaApi"
      :get-captcha-api="getCaptchaApi"
      :captcha-type="captchaType"
      @on-success="handleSuccess"
      @on-error="handleError"
      @on-close="handleClose"
      @on-ready="handleReady"
    />

    <!-- 阿里云验证码 -->
    <AliCaptcha
      v-else-if="currentCaptcha === 'AliCaptcha'"
      ref="captchaRef"
      :app-key="aliAppKey"
      :scene="aliScene"
      :check-captcha-api="checkCaptchaApi"
      :get-captcha-api="getCaptchaApi"
      :captcha-type="captchaType"
      @on-success="handleSuccess"
      @on-error="handleError"
      @on-close="handleClose"
      @on-ready="handleReady"
    />
  </div>
</template>

<style scoped>
.universal-captcha-container {
  width: 100%;
}
</style>
