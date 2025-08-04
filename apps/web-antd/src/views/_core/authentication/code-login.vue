<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import type { AuthApi } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { AuthenticationCodeLogin, UniversalCaptcha, z } from '@vben/common-ui';
import {
  getClientId,
  getDefaultCaptchaType,
  isCaptchaEnable,
  isTenantEnable,
} from '@vben/hooks';
import { $t } from '@vben/locales';
import { useAccessStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { sendSmsCode } from '#/api';
import {
  checkCaptcha,
  getCaptcha,
  getTenantByWebsite,
  getTenantSimpleList,
} from '#/api/core/auth';
import { useAuthStore } from '#/store';

defineOptions({ name: 'CodeLogin' });

const authStore = useAuthStore();
const accessStore = useAccessStore();
const tenantEnable = isTenantEnable();
const captchaEnable = isCaptchaEnable();

const loading = ref(false);
const CODE_LENGTH = 4;

const loginRef = ref();
const captchaRef = ref();

// 验证码类型
const captchaType = ref(getDefaultCaptchaType());
const clientId = ref(getClientId());

// 暂存请求参数
const pendingSmsRequest = ref<null | { mobile: string; scene: number }>(null);

/** 获取租户列表，并默认选中 */
const tenantList = ref<AuthApi.TenantResult[]>([]); // 租户列表
async function fetchTenantList() {
  if (!tenantEnable) {
    return;
  }
  try {
    // 获取租户列表、域名对应租户
    const websiteTenantPromise = getTenantByWebsite(window.location.hostname);
    tenantList.value = await getTenantSimpleList();

    // 选中租户：域名 > store 中的租户 > 首个租户
    let tenantId: null | number = null;
    const websiteTenant = await websiteTenantPromise;
    if (websiteTenant?.id) {
      tenantId = websiteTenant.id;
    }
    // 如果没有从域名获取到租户，尝试从 store 中获取
    if (!tenantId && accessStore.tenantId) {
      tenantId = accessStore.tenantId;
    }
    // 如果还是没有租户，使用列表中的第一个
    if (!tenantId && tenantList.value?.[0]?.id) {
      tenantId = tenantList.value[0].id;
    }

    // 设置选中的租户编号
    accessStore.setTenantId(tenantId);
    loginRef.value.getFormApi().setFieldValue('tenantId', tenantId?.toString());
  } catch (error) {
    console.error('获取租户列表失败:', error);
  }
}

/** 组件挂载时获取租户信息 */
onMounted(() => {
  fetchTenantList();
});

// 验证码通过后，发送短信验证码
async function handleCaptchaSuccess({
  captchaVerification,
}: {
  captchaVerification: string;
}) {
  if (pendingSmsRequest.value) {
    const { mobile, scene } = pendingSmsRequest.value;
    pendingSmsRequest.value = null; // 清空暂存的请求参数

    try {
      // 发送短信验证码，传递验证码凭证
      const success = await sendSmsVerificationCode(
        mobile,
        scene,
        captchaVerification,
      );
      if (success) {
        // 手动触发倒计时
        const formApi = loginRef.value?.getFormApi();
        const codeField = formApi?.getFieldInstance('code');
        if (codeField && typeof codeField.startCountdown === 'function') {
          codeField.startCountdown();
        } else {
          // 如果没有找到 startCountdown 方法，可能需要直接设置倒计时
          const maxTime = 60; // 默认60秒
          if (codeField) {
            codeField.countdown = maxTime;
            if (typeof codeField.startCountdown === 'function') {
              codeField.startCountdown();
            }
          }
        }
      }
    } catch (error) {
      console.error('验证码处理失败:', error);
    }
  }
}

// 发送短信验证码的函数
async function sendSmsVerificationCode(
  mobile: string,
  scene: number,
  captchaVerification?: string,
) {
  try {
    loading.value = true;
    // 将captchaVerification传递给后端API
    await sendSmsCode({ mobile, scene, captchaVerification });
    message.success($t('authentication.sendCodeSuccess'));
    return true;
  } catch (error) {
    console.error('发送短信验证码失败:', error);
    return false;
  } finally {
    loading.value = false;
  }
}

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenSelect',
      componentProps: {
        options: tenantList.value.map((item) => ({
          label: item.name,
          value: item.id.toString(),
        })),
        placeholder: $t('authentication.tenantTip'),
      },
      fieldName: 'tenantId',
      label: $t('authentication.tenant'),
      rules: z.string().min(1, { message: $t('authentication.tenantTip') }),
      dependencies: {
        triggerFields: ['tenantId'],
        if: tenantEnable,
        trigger(values) {
          if (values.tenantId) {
            accessStore.setTenantId(Number(values.tenantId));
          }
        },
      },
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.mobile'),
      },
      fieldName: 'mobile',
      label: $t('authentication.mobile'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.mobileTip') })
        .refine((v) => /^\d{11}$/.test(v), {
          message: $t('authentication.mobileErrortip'),
        }),
    },
    {
      component: 'VbenPinInput',
      componentProps: {
        codeLength: CODE_LENGTH,
        createText: (countdown: number) => {
          const text =
            countdown > 0
              ? $t('authentication.sendText', [countdown])
              : $t('authentication.sendCode');
          return text;
        },
        placeholder: $t('authentication.code'),
        handleSendCode: async () => {
          try {
            const formApi = loginRef.value?.getFormApi();
            if (!formApi) {
              throw new Error($t('authentication.formNotReady'));
            }
            // 验证手机号
            await formApi.validateField('mobile');
            const isMobileValid = await formApi.isFieldValid('mobile');
            if (!isMobileValid) {
              throw new Error($t('authentication.mobileErrortip'));
            }

            // 发送验证码
            const { mobile } = await formApi.getValues();
            const scene = 21; // 场景：短信验证码登录
            loading.value = true;

            // 暂存请求参数
            pendingSmsRequest.value = { mobile, scene };

            // 显示验证码进行验证
            if (captchaEnable) {
              captchaRef.value?.show();
              throw new Error($t('authentication.verifyRequiredTip')); // 抛出异常，阻止倒计时开始
            }

            // 不需要验证码的情况下，直接发送短信验证码
            await sendSmsVerificationCode(mobile, scene);
            return true; // 返回 true 开始倒计时
          } catch (error) {
            if (
              typeof error === 'string' &&
              error !== $t('authentication.verifyRequiredTip')
            ) {
              message.error(error);
            } else if (
              error instanceof Error &&
              error.message !== $t('authentication.verifyRequiredTip')
            ) {
              message.error(error.message);
            }
            throw error; // 重新抛出异常，确保倒计时不会启动
          } finally {
            loading.value = false;
          }
        },
      },
      fieldName: 'code',
      label: $t('authentication.code'),
      rules: z.string().length(CODE_LENGTH, {
        message: $t('authentication.codeTip', [CODE_LENGTH]),
      }),
    },
  ];
});
/**
 * 异步处理登录操作
 * Asynchronously handle the login process
 * @param values 登录表单数据
 */
async function handleLogin(values: Recordable<any>) {
  try {
    await authStore.authLogin('mobile', {
      ...values,
      clientId: clientId.value,
    });
  } catch (error) {
    console.error('Error in handleLogin:', error);
  }
}
</script>

<template>
  <div>
    <AuthenticationCodeLogin
      ref="loginRef"
      :form-schema="formSchema"
      :loading="loading"
      @submit="handleLogin"
    />
    <UniversalCaptcha
      ref="captchaRef"
      v-if="captchaEnable"
      :captcha-type="captchaType"
      :check-captcha-api="checkCaptcha"
      :get-captcha-api="getCaptcha"
      :img-size="{ width: '400px', height: '200px' }"
      mode="pop"
      @on-success="handleCaptchaSuccess"
    />
  </div>
</template>
