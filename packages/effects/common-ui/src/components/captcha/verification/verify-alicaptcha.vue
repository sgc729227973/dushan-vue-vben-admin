<script lang="ts" setup>
/**
 * AliyunCaptcha
 * @description 阿里云V2滑动验证码实现
 */
import type { PropType } from 'vue';

import { onUnmounted, ref } from 'vue';

import { aesEncrypt } from '../verification/utils/ase';

// 声明阿里云验证码实例类型
interface AliyunCaptchaInstance {
  show: () => void;
  destroy: () => void;
  reset: () => void;
}

interface AliyunCaptchaConfig {
  region: string;
  prefix: string;
  [key: string]: any;
}

// 声明全局 AliyunCaptcha
declare global {
  interface Window {
    AliyunCaptchaConfig?: AliyunCaptchaConfig;
    initAliyunCaptcha?: (config: Record<string, any>) => void;
  }
}

// 定义组件选项
defineOptions({
  name: 'AliyunCaptcha',
});

// 定义Props
const props = defineProps({
  // 后端返回的场景ID (sceneId)，如果后端不返回，则使用前端配置
  scene: {
    type: String,
    default: '',
  },
  // 后端返回的AppKey (appKey)，如果后端不返回，则使用前端配置
  appKey: {
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
    default: 'aliyuncaptcha',
  },
});

// 定义事件
const emit = defineEmits(['onSuccess', 'onError', 'onClose', 'onReady']);

// 验证码实例引用
const captchaInstance = ref<AliyunCaptchaInstance | null>(null);

// 后端返回的数据
const backToken = ref('');
const secretKey = ref('');
const timeout = ref(0);

// 超时相关
let timeoutTimer: null | number = null;
// 添加刷新重试次数限制
let refreshRetryCount = 0;
const MAX_RETRY_COUNT = 3;

// 加载阿里云验证码脚本
const loadScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.initAliyunCaptcha) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src =
      'https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js';
    script.async = true;
    script.defer = true;

    script.addEventListener('error', () => {
      reject(new Error('阿里云验证码SDK未正确加载'));
    });

    script.addEventListener('load', () => {
      if (window.initAliyunCaptcha) {
        resolve();
      } else {
        reject(new Error('Aliyun Captcha SDK 加载失败'));
      }
    });

    document.head.append(script);
  });
};

// 设置超时刷新
const setupTimeoutRefresh = (): void => {
  if (timeoutTimer !== null) {
    clearTimeout(timeoutTimer);
    timeoutTimer = null;
  }

  if (timeout.value > 0) {
    const actualTimeout = timeout.value * 0.95;
    const timeoutMs = Math.floor(actualTimeout * 1000);

    timeoutTimer = window.setTimeout(async () => {
      // 添加重试次数限制
      if (refreshRetryCount < MAX_RETRY_COUNT) {
        refreshRetryCount++;

        try {
          // 重新获取验证码参数，但不要调用getCaptchaParams，避免重复请求
          // 直接调用initCaptcha，它内部会调用getCaptchaParams
          await initCaptcha();
        } catch {
          // 自动刷新验证码参数失败
        }
      }
    }, timeoutMs);
  }
};

// 获取验证码参数
const getCaptchaParams = async (): Promise<
  | false
  | {
      appKey: string;
      prefix: string;
      sceneId: string;
    }
> => {
  try {
    if (!props.getCaptchaApi) return false;

    const response = await props.getCaptchaApi({
      captchaType: props.captchaType,
    });

    const resData = response?.data?.data;
    if (response?.data?.code === 0 && resData) {
      backToken.value = resData.token;
      secretKey.value = resData.secretKey;
      timeout.value = resData.timeout || 0;
      return {
        sceneId: resData.sceneId || props.scene,
        appKey: resData.appKey || props.appKey, // appKey seems unused by frontend SDK
        prefix: resData.prefix,
      };
    }
    return false;
  } catch {
    return false;
  }
};

// 验证码回调
const captchaCallback = async (
  captchaVerifyParam: string,
): Promise<{ captchaResult: boolean }> => {
  try {
    if (!props.checkCaptchaApi) {
      return { captchaResult: true }; // 测试模式下假设成功
    }

    // 获取当前使用的场景ID，确保和初始化时使用的一致
    const params = await getCaptchaParams();
    if (!params) {
      throw new Error('获取验证码参数失败');
    }

    // 阿里云V2 SDK提供了单个字符串参数
    // 这是后端需要发送给阿里云的"captchaVerifyParam"
    // 我们将其包装在一个对象中，以保持与现有加密/解密逻辑的一致性
    const verificationData = JSON.parse(captchaVerifyParam);

    const checkData = {
      captchaType: props.captchaType,
      pointJson: secretKey.value
        ? aesEncrypt(JSON.stringify(verificationData), secretKey.value)
        : JSON.stringify(verificationData),
      token: backToken.value,
    };

    const response = await props.checkCaptchaApi(checkData);

    if (response?.data?.code === 0) {
      const captchaVerification = response.data.data?.captchaVerification;
      if (captchaVerification) {
        // 后端验证通过，发送成功事件
        emit('onSuccess', { captchaVerification });
        // 向阿里云SDK返回验证成功，这样SDK会自动关闭验证码
        return { captchaResult: true };
      } else {
        emit('onError', { message: '验证成功但未获取到验证凭证' });
        return { captchaResult: false };
      }
    } else {
      emit('onError', response?.data || { message: '验证失败' });
      return { captchaResult: false };
    }
  } catch (error) {
    emit('onError', error);
    return { captchaResult: false };
  }
};

// 初始化验证码
const initCaptcha = async (): Promise<boolean> => {
  try {
    const params = await getCaptchaParams();
    if (!params) {
      throw new Error('获取验证码参数失败');
    }

    // 确保使用后端返回的正确场景ID
    // 根据文档，必须在加载脚本前设置全局配置对象
    window.AliyunCaptchaConfig = {
      region: 'cn', // region是必需的，默认为'cn'
      prefix: params.prefix,
    };

    setupTimeoutRefresh();

    await loadScript();

    // 加载脚本后，初始化函数应该可以在window对象上使用
    if (!window.initAliyunCaptcha) {
      throw new Error('脚本加载后未找到阿里云验证码SDK函数');
    }

    // 初始化函数接受单个配置对象并使用回调
    window.initAliyunCaptcha({
      SceneId: params.sceneId,
      language: 'cn',
      mode: 'popup',
      captchaVerifyCallback: captchaCallback,
      getInstance: (instance: AliyunCaptchaInstance) => {
        captchaInstance.value = instance;
        emit('onReady', instance);
      },
      onError: (err: any) => {
        emit('onError', err);
        // 发生错误时增加重试计数
        refreshRetryCount++;
      },
    });

    return true;
  } catch (error) {
    emit('onError', error);
    // 发生错误时增加重试计数
    refreshRetryCount++;
    return false;
  }
};

// 显示验证码
const show = async (): Promise<void> => {
  try {
    // 重置重试计数
    refreshRetryCount = 0;

    if (!captchaInstance.value) {
      const initialized = await initCaptcha();
      if (!initialized) {
        return;
      }
    }

    // 使用可选链和类型断言来安全地调用show方法
    const instance = captchaInstance.value as any;
    if (instance && typeof instance.show === 'function') {
      instance.show();
    } else {
      // 尝试重新初始化
      captchaInstance.value = null;
      await initCaptcha();

      // 再次尝试调用show
      const newInstance = captchaInstance.value as any;
      if (newInstance && typeof newInstance.show === 'function') {
        newInstance.show();
      } else {
        throw new Error('无法显示验证码，实例或方法不可用');
      }
    }
  } catch (error) {
    emit('onError', error);
  }
};

// 刷新验证码
const refresh = async (): Promise<void> => {
  // 重置重试计数
  refreshRetryCount = 0;
  if (captchaInstance.value) {
    captchaInstance.value.destroy();
    captchaInstance.value = null;
  }
  await initCaptcha();
};

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
  <div id="aliyun-captcha-container">
    <!-- 阿里云验证码的挂载点, 但V2是弹出式, 这个容器可能不需要 -->
  </div>
</template>

<style scoped>
#aliyun-captcha-container {
  /* V2弹出式验证码可能不需要样式 */
  width: 100%;
}
</style>
