<script setup lang="ts">
import { ref } from 'vue';

import { $t } from '@vben/locales';

import { ElButton, ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus';

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
  if (passwordStrength.value <= 20) return '#F56C6C';
  if (passwordStrength.value <= 60) return '#E6A23C';
  return '#67C23A';
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
    await formRef.value.validate();

    // 额外验证
    if (formData.value.newPassword === formData.value.oldPassword) {
      ElMessage.error($t('profile.password.passwordNotSame'));
      return;
    }

    if (passwordStrength.value < 60) {
      ElMessage.warning($t('profile.password.passwordWeak'));
      return;
    }

    loading.value = true;

    // 提交表单
    await updateUserPassword({
      oldPassword: formData.value.oldPassword,
      newPassword: formData.value.newPassword,
    });

    ElMessage.success($t('ui.actionMessage.operationSuccess'));

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
    <ElForm
      ref="formRef"
      :model="formData"
      label-position="top"
      class="form-container"
    >
      <ElFormItem
        :label="$t('profile.password.oldPassword')"
        prop="oldPassword"
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
        <ElInput
          v-model="formData.oldPassword"
          type="password"
          show-password
          :placeholder="$t('profile.password.inputOldPassword')"
        />
      </ElFormItem>

      <ElFormItem
        :label="$t('profile.password.newPassword')"
        prop="newPassword"
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
        <ElInput
          v-model="formData.newPassword"
          type="password"
          show-password
          :placeholder="$t('profile.password.inputNewPassword')"
          @input="calculatePasswordStrength(formData.newPassword)"
        />
      </ElFormItem>

      <ElFormItem
        v-if="formData.newPassword"
        :label="$t('profile.password.passwordStrength')"
      >
        <div class="password-strength">
          <div class="progress-container">
            <div
              class="progress-bar"
              :style="{
                width: `${passwordStrength}%`,
                backgroundColor: getPasswordStrengthColor(),
              }"
            ></div>
          </div>
          <div
            class="password-strength-text"
            :style="{ color: getPasswordStrengthColor() }"
          >
            {{ getPasswordStrengthText() }}
          </div>
        </div>
      </ElFormItem>

      <ElFormItem
        :label="$t('profile.password.confirmPassword')"
        prop="confirmPassword"
        :rules="[
          {
            required: true,
            message: $t('profile.password.inputConfirmPassword'),
          },
          {
            validator: (_, value, callback) => {
              if (value !== formData.newPassword) {
                callback(new Error($t('profile.password.passwordNotMatch')));
              } else {
                callback();
              }
            },
            trigger: 'blur',
          },
        ]"
      >
        <ElInput
          v-model="formData.confirmPassword"
          type="password"
          show-password
          :placeholder="$t('profile.password.inputConfirmPassword')"
        />
      </ElFormItem>

      <ElFormItem>
        <ElButton type="primary" :loading="loading" @click="handleSubmit">
          {{ $t('profile.password.modify') }}
        </ElButton>
      </ElFormItem>
    </ElForm>
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
  width: 100%;
}

.progress-container {
  flex: 1;
  height: 8px;
  overflow: hidden;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
}

.progress-bar {
  height: 100%;
  border-radius: 4px;
  transition:
    width 0.3s ease,
    background-color 0.3s ease;
}

.password-strength-text {
  width: 50px;
  margin-left: 12px;
  font-size: 14px;
  font-weight: 500;
}

:deep(.el-form-item__error) {
  color: var(--el-color-danger);
}

:deep(.el-input__inner) {
  color: var(--el-text-color-primary);
  background-color: var(--el-input-bg-color, var(--el-fill-color-blank));
}

:deep(.el-form-item__label) {
  color: var(--el-text-color-primary);
}

:deep(.el-button--primary) {
  margin-top: 12px;
}

/* 暗黑模式适配 */
:deep(.dark .progress-container) {
  background-color: rgb(255 255 255 / 10%);
}
</style>
