<script setup lang="ts">
import type { SystemUserProfileApi } from '#/api/system/user/profile';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { formatDateTime } from '@vben/utils';

import { Tag } from 'ant-design-vue';

import { updateUserProfile } from '#/api/system/user/profile';
import { CropperAvatar } from '#/components/cropper';
import { useUpload } from '#/components/upload/use-upload';

const props = defineProps<{
  profile?: SystemUserProfileApi.UserProfileResp;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const avatar = computed(() => props.profile?.avatar);
const bio = computed(() => props.profile?.bio || $t('profile.user.noBio'));
const userTags = computed(() => props.profile?.tags || []);

// 标签颜色
const tagColors = [
  'blue',
  'cyan',
  'purple',
  'magenta',
  'green',
  'orange',
  'red',
];
const getTagColor = (index: number) => tagColors[index % tagColors.length];

async function handelUpload({
  file,
  filename,
}: {
  file: Blob;
  filename: string;
}) {
  // 1. 上传头像，获取 URL
  const { httpRequest } = useUpload();
  // 将 Blob 转换为 File
  const fileObj = new File([file], filename, { type: file.type });
  const avatar = await httpRequest(fileObj);
  // 2. 更新用户头像
  await updateUserProfile({ avatar });
}
</script>

<template>
  <div v-if="profile" class="profile-container">
    <div class="profile-content">
      <!-- 头像和用户名 -->
      <div class="mb-6 flex flex-col items-center">
        <CropperAvatar
          :show-btn="false"
          :upload-api="handelUpload"
          :value="avatar"
          :width="120"
          class="mb-4"
          @change="emit('success')"
        />
        <div class="flex flex-col items-center">
          <h2 class="text-lg font-medium">
            {{ profile.nickname }}
          </h2>
          <div class="mt-2 flex items-center">
            <Tag color="blue">{{ profile.username }}</Tag>
          </div>
        </div>
        <p class="mt-1 text-sm text-gray-500">{{ bio }}</p>
      </div>

      <!-- 用户信息列表 -->
      <div class="user-info-list">
        <div class="info-item">
          <IconifyIcon icon="ant-design:user-outlined" class="info-icon" />
          <span class="text-sm text-gray-500">{{ profile.nickname }}</span>
        </div>

        <div v-if="profile.mobile" class="info-item">
          <IconifyIcon icon="ant-design:phone-outlined" class="info-icon" />
          <span class="text-sm text-gray-500">{{ profile.mobile }}</span>
        </div>

        <div v-if="profile.email" class="info-item">
          <IconifyIcon icon="ant-design:mail-outlined" class="info-icon" />
          <span class="text-sm text-gray-500">{{ profile.email }}</span>
        </div>

        <div class="info-item">
          <IconifyIcon icon="ant-design:calendar-outlined" class="info-icon" />
          <span class="text-sm text-gray-500">{{
            formatDateTime(profile.createTime)
          }}</span>
        </div>

        <div class="info-item">
          <IconifyIcon icon="ant-design:woman-outlined" class="info-icon" />
          <span class="text-sm text-gray-500">{{
            profile.sex === 1
              ? $t('profile.user.male')
              : profile.sex === 2
                ? $t('profile.user.female')
                : $t('profile.user.unknown')
          }}</span>
        </div>

        <div v-if="profile.dept" class="info-item">
          <IconifyIcon icon="ant-design:team-outlined" class="info-icon" />
          <span class="text-sm text-gray-500">{{ profile.dept.name }}</span>
        </div>

        <div v-if="profile.posts && profile.posts.length > 0" class="info-item">
          <IconifyIcon icon="ant-design:solution-outlined" class="info-icon" />
          <span class="text-sm text-gray-500">{{
            profile.posts.map((post) => post.name).join('、')
          }}</span>
        </div>

        <div v-if="profile.roles && profile.roles.length > 0" class="info-item">
          <IconifyIcon icon="ant-design:crown-outlined" class="info-icon" />
          <span class="text-sm text-gray-500">{{
            profile.roles.map((role) => role.name).join('、')
          }}</span>
        </div>

        <div class="info-item">
          <IconifyIcon
            icon="ant-design:environment-outlined"
            class="info-icon"
          />
          <span class="text-sm text-gray-500">{{ profile.address }}</span>
        </div>

        <div class="info-item">
          <IconifyIcon icon="ant-design:global-outlined" class="info-icon" />
          <span class="text-sm text-gray-500">{{ profile.loginIp }}</span>
        </div>

        <div class="info-item">
          <IconifyIcon
            icon="ant-design:clock-circle-outlined"
            class="info-icon"
          />
          <span class="text-sm text-gray-500">
            {{ $t('profile.user.lastLogin') }}:
            {{ formatDateTime(profile.loginDate) }}
          </span>
        </div>

        <div class="info-item">
          <IconifyIcon icon="ant-design:code-outlined" class="info-icon" />
          <span class="text-sm text-gray-500">{{ profile.skills }}</span>
        </div>
      </div>

      <!-- 个性标签 -->
      <div v-if="userTags.length > 0" class="tag-section mt-6">
        <div class="divider"></div>
        <h3 class="mb-2 text-sm font-bold">
          {{ $t('profile.user.personalTags') }}
        </h3>
        <div class="flex flex-wrap gap-2">
          <Tag
            v-for="(tag, index) in userTags"
            :key="tag"
            :color="getTagColor(index)"
          >
            {{ tag }}
          </Tag>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  height: 100%;
  max-height: calc(100vh - 200px);
  padding-right: 24px;
  overflow-y: auto;
}

.profile-content {
  padding: 20px 16px;
  margin-right: 8px;
}

.user-info-list {
  padding-top: 20px;
  margin-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.info-item {
  display: flex;
  align-items: center;
  padding-left: 4px;
  margin-bottom: 14px;
}

.info-icon {
  margin-right: 12px;
  font-size: 16px;
  color: #8c8c8c;
}

.tag-section {
  position: relative;
  padding-top: 20px;
  margin-top: 4px;
}

.divider {
  height: 1px;
  margin-bottom: 20px;
  background-color: #f0f0f0;
}
</style>
