<script setup lang="ts">
import type { SystemUserProfileApi } from '#/api/system/user/profile';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { ElCard, ElTabPane, ElTabs } from 'element-plus';

import { getUserProfile } from '#/api/system/user/profile';
import { useAuthStore } from '#/store';

import BaseInfo from './modules/base-info.vue';
import OnlineDevices from './modules/online-devices.vue';
import ProfileUser from './modules/profile-user.vue';
import ResetPwd from './modules/reset-pwd.vue';
import UserSocial from './modules/user-social.vue';

const authStore = useAuthStore();
const activeName = ref('basicInfo');

/** 加载个人信息 */
const profile = ref<SystemUserProfileApi.UserProfileRespVO>();
async function loadProfile() {
  profile.value = await getUserProfile();
}

/** 刷新个人信息 */
async function refreshProfile() {
  // 加载个人信息
  await loadProfile();

  // 更新 store
  await authStore.fetchUserInfo();
}

/** 初始化 */
onMounted(loadProfile);
</script>

<template>
  <Page auto-content-height>
    <div class="flex flex-col md:flex-row">
      <!-- 个人信息卡片 -->
      <ElCard class="md:mr-4 md:w-1/3">
        <ProfileUser :profile="profile" @success="refreshProfile" />
      </ElCard>

      <!-- 标签页 -->
      <ElCard class="mt-4 flex-1 md:mt-0">
        <ElTabs v-model="activeName">
          <ElTabPane name="basicInfo" :label="$t('profile.profile.basicInfo')">
            <BaseInfo :profile="profile" @success="refreshProfile" />
          </ElTabPane>
          <ElTabPane name="resetPwd" :label="$t('profile.password.settings')">
            <ResetPwd />
          </ElTabPane>
          <ElTabPane
            name="accountBind"
            :label="$t('profile.profile.accountBind')"
          >
            <UserSocial @update:active-name="activeName = $event" />
          </ElTabPane>
          <ElTabPane
            name="onlineDevices"
            :label="$t('profile.profile.onlineDevices')"
          >
            <OnlineDevices />
          </ElTabPane>
        </ElTabs>
      </ElCard>
    </div>
  </Page>
</template>

<style scoped>
/* 响应式布局 */
@media (max-width: 768px) {
  :deep(.el-card + .el-card) {
    margin-top: 16px;
  }
}

:deep(.el-card__header) {
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

:deep(.el-card__body) {
  padding: 16px;
}

:deep(.el-tabs__nav) {
  margin-bottom: 16px;
}

:deep(.el-tabs__item) {
  padding: 8px 0;
  font-size: 14px;
  font-weight: 500;
}

:deep(.el-tabs__item + .el-tabs__item) {
  margin-left: 24px;
}

:deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 3px 3px 0 0;
}

/* 美化卡片样式 */
</style>
