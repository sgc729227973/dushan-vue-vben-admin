<script setup lang="ts">
import { ref } from 'vue';

import { $t } from '@vben/locales';

import { Button, Form, Input, message, Progress } from 'ant-design-vue';

import { updateUserPassword } from '#/api/system/user/profile';

const formRef = ref();
const formData = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});
const passwordStrength = ref(0);
const loading = ref(false);

// 计算密码强度
function calculatePasswordStrength(password: string) {
  if (!password) {
    passwordStrength.value = 0;
    return;
  }

  let strength = 0;

  // 长度检查
  if (password.length >= 8) strength += 20;

  // 包含数字
  if (/\d/.test(password)) strength += 20;

  // 包含小写字母
  if (/[a-z]/.test(password)) strength += 20;

  // 包含大写字母
  if (/[A-Z]/.test(password)) strength += 20;

  // 包含特殊字符
  if (/[^A-Z0-9]/i.test(password)) strength += 20;

  passwordStrength.value = strength;
}

// 获取密码强度颜色
function getPasswordStrengthColor() {
  if (passwordStrength.value <= 20) return '#ff4d4f';
  if (passwordStrength.value <= 60) return '#faad14';
  return '#52c41a';
}

// 获取密码强度文本
function getPasswordStrengthText() {
  if (passwordStrength.value <= 20) return $t('profile.password.weak');
  if (passwordStrength.value <= 60) return $t('profile.password.medium');
  return $t('profile.password.strong');
}

// 提交表单
async function handleSubmit() {
  try {
    await formRef.value.validateFields();

    // 额外验证
    if (formData.value.newPassword === formData.value.oldPassword) {
      message.error($t('profile.password.passwordNotSame'));
      return;
    }

    if (passwordStrength.value < 60) {
      message.warning($t('profile.password.passwordWeak'));
      return;
    }

    loading.value = true;

    // 提交表单
    await updateUserPassword({
      oldPassword: formData.value.oldPassword,
      newPassword: formData.value.newPassword,
    });

    message.success($t('ui.actionMessage.operationSuccess'));

    // 重置表单
    formRef.value.resetFields();
    passwordStrength.value = 0;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="reset-pwd-container">
    <Form
      ref="formRef"
      :model="formData"
      layout="vertical"
      class="form-container"
    >
      <Form.Item
        :label="$t('profile.password.oldPassword')"
        name="oldPassword"
        :rules="[
          {
            required: true,
            message: $t('profile.password.inputOldPassword'),
          },
          {
            min: 8,
            message: $t('profile.password.passwordMinLength'),
          },
        ]"
      >
        <Input.Password
          v-model:value="formData.oldPassword"
          :placeholder="$t('profile.password.inputOldPassword')"
        />
      </Form.Item>

      <Form.Item
        :label="$t('profile.password.newPassword')"
        name="newPassword"
        :rules="[
          {
            required: true,
            message: $t('profile.password.inputNewPassword'),
          },
          {
            min: 8,
            message: $t('profile.password.passwordMinLength'),
          },
        ]"
      >
        <Input.Password
          v-model:value="formData.newPassword"
          :placeholder="$t('profile.password.inputNewPassword')"
          @input="calculatePasswordStrength(formData.newPassword)"
        />
      </Form.Item>

      <Form.Item
        v-if="formData.newPassword"
        :label="$t('profile.password.passwordStrength')"
      >
        <div class="password-strength">
          <Progress
            :percent="passwordStrength"
            :stroke-color="getPasswordStrengthColor()"
            :show-info="false"
            size="small"
          />
          <div
            class="password-strength-text"
            :style="{ color: getPasswordStrengthColor() }"
          >
            {{ getPasswordStrengthText() }}
          </div>
        </div>
      </Form.Item>

      <Form.Item
        :label="$t('profile.password.confirmPassword')"
        name="confirmPassword"
        :rules="[
          {
            required: true,
            message: $t('profile.password.inputConfirmPassword'),
          },
          {
            validator: async (_, value) => {
              if (value !== formData.newPassword) {
                throw new Error($t('profile.password.passwordNotMatch'));
              }
            },
          },
        ]"
      >
        <Input.Password
          v-model:value="formData.confirmPassword"
          :placeholder="$t('profile.password.inputConfirmPassword')"
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" :loading="loading" @click="handleSubmit">
          {{ $t('profile.password.modify') }}
        </Button>
      </Form.Item>
    </Form>
  </div>
</template>

<style scoped>
.reset-pwd-container {
  max-width: 500px;
  padding: 20px 0;
  margin: 0 auto;
}

.form-container {
  width: 100%;
}

.password-strength {
  display: flex;
  align-items: center;
}

.password-strength-text {
  margin-left: 12px;
  font-size: 14px;
  font-weight: 500;
}

:deep(.dark .ant-input) {
  color: rgb(255 255 255 / 85%);
  background-color: rgb(255 255 255 / 8%);
}

:deep(.dark .ant-form-item-explain-error) {
  color: #ff4d4f;
}

:deep(.ant-form-item) {
  margin-bottom: 24px;
}

:deep(.ant-btn-primary) {
  margin-top: 8px;
}
</style>
