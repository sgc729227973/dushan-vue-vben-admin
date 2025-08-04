<script setup lang="ts">
import type { SystemUserProfileApi } from '#/api/system/user/profile';

import { ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElRadioButton,
  ElRadioGroup,
  ElTag,
} from 'element-plus';

import { updateUserProfile } from '#/api/system/user/profile';
import { DICT_TYPE, getDictOptions } from '#/utils';

const props = defineProps<{
  profile?: SystemUserProfileApi.UserProfileRespVO;
}>();
const emit = defineEmits<{
  (e: 'success'): void;
}>();

const formRef = ref();
const formData = ref({
  username: '',
  nickname: '',
  sex: undefined as number | undefined,
  bio: '',
  tags: [] as string[],
  email: '',
  mobile: '',
  address: '',
  skills: '',
});

// 标签管理相关
const newTagName = ref('');

// 获取性别选项
const sexOptions = getDictOptions(DICT_TYPE.SYSTEM_USER_SEX, 'number');

/** 监听 profile 变化 */
watch(
  () => props.profile,
  (newProfile) => {
    if (newProfile) {
      formData.value = {
        username: newProfile.username,
        nickname: newProfile.nickname,
        sex: newProfile.sex,
        bio: newProfile.bio || '',
        tags: newProfile.tags || [],
        email: newProfile.email || '',
        mobile: newProfile.mobile || '',
        address: newProfile.address || '',
        skills: newProfile.skills || '',
      };
    }
  },
  { immediate: true },
);

// 提交表单
async function handleSubmit() {
  try {
    await formRef.value.validate();

    // 提交表单
    await updateUserProfile({
      nickname: formData.value.nickname,
      sex: formData.value.sex,
      bio: formData.value.bio,
      tags: formData.value.tags,
      email: formData.value.email,
      mobile: formData.value.mobile,
      address: formData.value.address,
      skills: formData.value.skills,
    });

    // 关闭并提示
    emit('success');
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
  } catch (error) {
    console.error(error);
  }
}

// 删除标签
function removeTag(tag: string) {
  const index = formData.value.tags.indexOf(tag);
  if (index !== -1) {
    formData.value.tags.splice(index, 1);
  }
}

// 添加标签
function addTag() {
  if (!newTagName.value) return;
  if (!formData.value.tags.includes(newTagName.value)) {
    formData.value.tags.push(newTagName.value);
  }
  newTagName.value = '';
}
</script>

<template>
  <div class="base-info-container">
    <ElForm
      ref="formRef"
      :model="formData"
      label-position="top"
      class="form-container"
    >
      <div class="form-row">
        <ElFormItem
          :label="$t('profile.user.name')"
          prop="username"
          class="form-item"
        >
          <ElInput v-model="formData.username" disabled />
        </ElFormItem>

        <ElFormItem
          :label="$t('profile.user.nickname')"
          prop="nickname"
          :rules="[
            { required: true, message: $t('profile.user.inputNickname') },
          ]"
          class="form-item"
        >
          <ElInput
            v-model="formData.nickname"
            :placeholder="$t('profile.user.inputNickname')"
          />
        </ElFormItem>
      </div>

      <div class="form-row">
        <ElFormItem
          :label="$t('profile.user.mobile')"
          prop="mobile"
          class="form-item"
        >
          <ElInput
            v-model="formData.mobile"
            :placeholder="$t('profile.user.inputMobile')"
          />
        </ElFormItem>

        <ElFormItem
          :label="$t('profile.user.email')"
          prop="email"
          class="form-item"
        >
          <ElInput
            v-model="formData.email"
            :placeholder="$t('profile.user.inputEmail')"
          />
        </ElFormItem>
      </div>

      <div class="form-row">
        <ElFormItem
          :label="$t('profile.user.address')"
          prop="address"
          class="form-item"
        >
          <ElInput
            v-model="formData.address"
            :placeholder="$t('profile.user.inputAddress')"
          />
        </ElFormItem>

        <ElFormItem
          :label="$t('profile.user.skills')"
          prop="skills"
          class="form-item"
        >
          <ElInput
            v-model="formData.skills"
            :placeholder="$t('profile.user.inputSkills')"
          />
        </ElFormItem>
      </div>

      <ElFormItem :label="$t('profile.user.gender')" prop="sex">
        <ElRadioGroup v-model="formData.sex">
          <ElRadioButton
            v-for="opt in sexOptions"
            :key="String(opt.value)"
            :label="opt.value"
          >
            {{ opt.label }}
          </ElRadioButton>
        </ElRadioGroup>
      </ElFormItem>

      <ElFormItem :label="$t('profile.user.bio')" prop="bio">
        <ElInput
          v-model="formData.bio"
          :rows="4"
          type="textarea"
          :placeholder="$t('profile.user.inputBio')"
        />
      </ElFormItem>

      <ElFormItem :label="$t('profile.user.tags')">
        <div class="mb-2 flex flex-wrap gap-2">
          <ElTag
            v-for="tag in formData.tags"
            :key="tag"
            type="primary"
            closable
            class="tag-item"
            @close="removeTag(tag)"
          >
            {{ tag }}
          </ElTag>
          <div class="tag-input-wrapper">
            <ElInput
              v-model="newTagName"
              :placeholder="$t('profile.user.newTag')"
              class="tag-input"
              @keyup.enter="addTag"
            />
            <ElButton type="primary" size="small" @click="addTag">
              <IconifyIcon icon="ant-design:plus-outlined" />
            </ElButton>
          </div>
        </div>
      </ElFormItem>

      <ElFormItem>
        <div class="flex items-center">
          <ElButton type="primary" @click="handleSubmit">
            {{ $t('common.save') }}
          </ElButton>
        </div>
      </ElFormItem>
    </ElForm>
  </div>
</template>

<style scoped>
.base-info-container {
  max-height: calc(100vh - 200px);
  padding: 16px 24px 16px 16px;
  overflow-y: auto;
}

.form-container {
  width: 100%;
  max-width: 95%;
}

.form-row {
  display: flex;
  gap: 24px;
  margin-bottom: 8px;
}

.form-item {
  flex: 1;
  min-width: 0;
}

.tag-item {
  display: flex;
  align-items: center;
  margin-right: 8px;
  margin-bottom: 8px;
}

.tag-input-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.tag-input {
  width: 120px;
  margin-right: 8px;
}
</style>
