<script lang="ts" setup>
/**
 * TencentCaptcha
 * @description 腾讯云验证码实现
 */

import type { PropType } from 'vue';

import { onMounted, onUnmounted, ref } from 'vue';

import { aesEncrypt } from './utils/ase';

// 声明腾讯验证码类型
interface TencentCaptchaInstance {
  show: () => void;
  destroy: () => void;
}

interface TencentCaptchaResponse {
  ret: number;
  ticket?: string;
  randstr?: string;
  [key: string]: any;
}

// 声明全局 TencentCaptcha
declare global {
  interface Window {
    TencentCaptcha: {
      new (
        appId: string,
        callback: (res: TencentCaptchaResponse) => void,
        options?: Record<string, any>,
      ): TencentCaptchaInstance;
    };
  }
}

// 定义组件选项
defineOptions({
  name: 'TencentCaptcha',
});

// 定义Props
const props = defineProps({
  appId: {
    type: String,
    default: '',
  },
  checkCaptchaApi: {
    type: Function as PropType<(data: any) => Promise<any>>,
    default: null,
  },
  getCaptchaApi: {
    type: Function as PropType<(data: any) => Promise<any>>,
    default: null,
  },
  captchaType: {
    type: String,
    default: 'tencentCaptcha',
  },
});

// 定义事件
const emit = defineEmits(['onSuccess', 'onError', 'onClose', 'onReady']);

// 验证码容器引用
const captchaContainer = ref<HTMLElement | null>(null);

// 验证码实例引用
const captchaInstance = ref<null | TencentCaptchaInstance>(null);

// 后端返回的token和加密密钥
const backToken = ref('');
const secretKey = ref('');

// 超时相关
const timeout = ref(0);
let timeoutTimer: null | number = null;

// 加载腾讯验证码脚本
const loadScript = (): Promise<typeof window.TencentCaptcha> => {
  return new Promise((resolve, reject) => {
    if (window.TencentCaptcha) {
      resolve(window.TencentCaptcha);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://turing.captcha.qcloud.com/TJCaptcha.js';
    script.async = true;

    script.addEventListener('error', () => {
      reject(new Error('腾讯验证码SDK未正确加载'));
    });

    script.addEventListener('load', () => {
      if (window.TencentCaptcha) {
        resolve(window.TencentCaptcha);
      } else {
        reject(new Error('TencentCaptcha SDK 加载失败'));
      }
    });

    document.head.append(script);
  });
};

// 设置超时刷新
const setupTimeoutRefresh = (): void => {
  // 清除之前的计时器
  if (timeoutTimer !== null) {
    clearTimeout(timeoutTimer);
    timeoutTimer = null;
  }

  // 如果有超时设置，创建新的计时器
  if (timeout.value > 0) {
    const timeoutMs = timeout.value * 1000;
    timeoutTimer = window.setTimeout(async () => {
      await initCaptcha();
    }, timeoutMs);
  }
};

// 获取验证码参数
const getCaptchaParams = async (): Promise<false | string> => {
  try {
    if (!props.getCaptchaApi) return false;

    const response = await props.getCaptchaApi({
      captchaType: props.captchaType,
    });

    if (response?.data?.code === 0) {
      backToken.value = response.data.data?.token;
      secretKey.value = response.data.data?.secretKey;
      timeout.value = response.data.data?.timeout || 0;
      return response.data.data?.captchaAppId || props.appId;
    }
    return false;
  } catch (error) {
    console.error('获取验证码参数失败:', error);
    return false;
  }
};

// 验证码回调
const captchaCallback = async (res: TencentCaptchaResponse): Promise<void> => {
  if (res.ret === 0 && res.ticket) {
    // 验证成功，需要调用后端验证接口
    const verificationData = {
      captchaType: props.captchaType,
      pointJson: secretKey.value
        ? aesEncrypt(
            JSON.stringify({
              ticket: res.ticket,
              randstr: res.randstr,
            }),
            secretKey.value,
          )
        : JSON.stringify({
            ticket: res.ticket,
            randstr: res.randstr,
          }),
      token: backToken.value,
    };

    try {
      if (props.checkCaptchaApi) {
        const response = await props.checkCaptchaApi(verificationData);

        if (response?.data?.code === 0) {
          // 生成最终的验证码凭证
          const captchaVerification = secretKey.value
            ? aesEncrypt(
                `${backToken.value}---${JSON.stringify({
                  ticket: res.ticket,
                  randstr: res.randstr,
                })}`,
                secretKey.value,
              )
            : `${backToken.value}---${JSON.stringify({
                ticket: res.ticket,
                randstr: res.randstr,
              })}`;

          emit('onSuccess', { captchaVerification });
          emit('onClose');
        } else {
          emit('onError', response?.data || { message: '验证失败' });
        }
      } else {
        // 如果没有提供验证API，直接返回结果
        const captchaVerification = secretKey.value
          ? aesEncrypt(
              `${backToken.value}---${JSON.stringify({
                ticket: res.ticket,
                randstr: res.randstr,
              })}`,
              secretKey.value,
            )
          : `${backToken.value}---${JSON.stringify({
              ticket: res.ticket,
              randstr: res.randstr,
            })}`;

        emit('onSuccess', { captchaVerification });
        emit('onClose');
      }
    } catch (error) {
      console.error('验证码校验失败:', error);
      emit('onError', error);
    }
  } else {
    // 验证失败或用户主动关闭
    emit('onError', res);
    emit('onClose');
  }
};

// 初始化验证码
const initCaptcha = async (): Promise<boolean> => {
  try {
    // 先获取验证码参数
    const appId = await getCaptchaParams();
    if (!appId) {
      throw new Error('获取验证码参数失败');
    }

    // 设置超时刷新
    setupTimeoutRefresh();

    // 加载验证码SDK
    const TencentCaptcha = await loadScript();

    // 创建验证码实例
    captchaInstance.value = new TencentCaptcha(appId, captchaCallback, {
      userLanguage: 'zh-cn',
    });

    emit('onReady', captchaInstance.value);
    return true;
  } catch (error) {
    console.error('初始化验证码失败:', error);
    emit('onError', error);
    return false;
  }
};

// 显示验证码
const show = async (): Promise<void> => {
  try {
    if (!captchaInstance.value) {
      const initialized = await initCaptcha();
      if (!initialized) {
        return;
      }
    }

    captchaInstance.value?.show();
  } catch (error) {
    emit('onError', error);
  }
};

// 刷新验证码
const refresh = async (): Promise<void> => {
  if (captchaInstance.value) {
    captchaInstance.value.destroy();
    captchaInstance.value = null;
  }

  await initCaptcha();
};

// 组件挂载时初始化
onMounted(() => {
  initCaptcha();
});

// 组件卸载时销毁
onUnmounted(() => {
  if (captchaInstance.value) {
    captchaInstance.value.destroy();
  }

  if (timeoutTimer !== null) {
    clearTimeout(timeoutTimer);
  }
});

// 导出方法
defineExpose({
  show,
  refresh,
});
</script>

<template>
  <div id="tencent-captcha-container" ref="captchaContainer">
    <!-- 腾讯云验证码会在这里自动渲染 -->
  </div>
</template>

<style scoped>
#tencent-captcha-container {
  width: 100%;
}
</style>
