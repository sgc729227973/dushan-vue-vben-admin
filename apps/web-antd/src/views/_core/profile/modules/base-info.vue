<script setup lang="ts">
import type { SystemUserProfileApi } from '#/api/system/user/profile';

import { ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Form, Input, message, Radio, Tag } from 'ant-design-vue';

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
    await formRef.value.validateFields();

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
    message.success($t('ui.actionMessage.operationSuccess'));
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
    <Form
      ref="formRef"
      :model="formData"
      layout="vertical"
      class="form-container"
    >
      <div class="form-row">
        <Form.Item
          :label="$t('profile.user.name')"
          name="username"
          class="form-item"
        >
          <Input v-model:value="formData.username" disabled />
        </Form.Item>

        <Form.Item
          :label="$t('profile.user.nickname')"
          name="nickname"
          :rules="[
            { required: true, message: $t('profile.user.inputNickname') },
          ]"
          class="form-item"
        >
          <Input
            v-model:value="formData.nickname"
            :placeholder="$t('profile.user.inputNickname')"
          />
        </Form.Item>
      </div>

      <div class="form-row">
        <Form.Item
          :label="$t('profile.user.mobile')"
          name="mobile"
          class="form-item"
        >
          <Input
            v-model:value="formData.mobile"
            :placeholder="$t('profile.user.inputMobile')"
          />
        </Form.Item>

        <Form.Item
          :label="$t('profile.user.email')"
          name="email"
          class="form-item"
        >
          <Input
            v-model:value="formData.email"
            :placeholder="$t('profile.user.inputEmail')"
          />
        </Form.Item>
      </div>

      <div class="form-row">
        <Form.Item
          :label="$t('profile.user.address')"
          name="address"
          class="form-item"
        >
          <Input
            v-model:value="formData.address"
            :placeholder="$t('profile.user.inputAddress')"
          />
        </Form.Item>

        <Form.Item
          :label="$t('profile.user.skills')"
          name="skills"
          class="form-item"
        >
          <Input
            v-model:value="formData.skills"
            :placeholder="$t('profile.user.inputSkills')"
          />
        </Form.Item>
      </div>

      <Form.Item :label="$t('profile.user.gender')" name="sex">
        <Radio.Group
          v-model:value="formData.sex"
          button-style="solid"
          option-type="button"
        >
          <Radio.Button
            v-for="opt in sexOptions"
            :key="String(opt.value)"
            :value="opt.value"
          >
            {{ opt.label }}
          </Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Form.Item :label="$t('profile.user.bio')" name="bio">
        <Input.TextArea
          v-model:value="formData.bio"
          :rows="4"
          :placeholder="$t('profile.user.inputBio')"
        />
      </Form.Item>

      <Form.Item :label="$t('profile.user.tags')">
        <div class="mb-2 flex flex-wrap gap-2">
          <Tag
            v-for="tag in formData.tags"
            :key="tag"
            color="blue"
            closable
            class="tag-item"
            @close="removeTag(tag)"
          >
            {{ tag }}
          </Tag>
          <div class="tag-input-wrapper">
            <Input
              v-model:value="newTagName"
              :placeholder="$t('profile.user.newTag')"
              class="tag-input"
              @keyup.enter="addTag"
            />
            <Button type="primary" size="small" @click="addTag">
              <IconifyIcon icon="ant-design:plus-outlined" />
            </Button>
          </div>
        </div>
      </Form.Item>

      <Form.Item>
        <div class="flex items-center">
          <Button type="primary" @click="handleSubmit">
            {{ $t('common.save') }}
          </Button>
        </div>
      </Form.Item>
    </Form>
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
