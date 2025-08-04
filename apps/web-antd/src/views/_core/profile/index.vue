<script setup lang="ts">
// 导入类型定义
import type { SystemUserProfileApi } from '#/api/system/user/profile';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Card, Tabs } from 'ant-design-vue';

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
const profile = ref<SystemUserProfileApi.UserProfileResp>();
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
      <Card class="md:mr-4 md:w-1/3">
        <ProfileUser :profile="profile" @success="refreshProfile" />
      </Card>

      <!-- 标签页 -->
      <Card class="mt-4 flex-1 md:mt-0">
        <Tabs v-model:active-key="activeName">
          <Tabs.TabPane key="basicInfo" :tab="$t('profile.profile.basicInfo')">
            <BaseInfo :profile="profile" @success="refreshProfile" />
          </Tabs.TabPane>
          <Tabs.TabPane key="resetPwd" :tab="$t('profile.password.settings')">
            <ResetPwd />
          </Tabs.TabPane>
          <Tabs.TabPane
            key="accountBind"
            :tab="$t('profile.profile.accountBind')"
          >
            <UserSocial @update:active-name="activeName = $event" />
          </Tabs.TabPane>
          <Tabs.TabPane
            key="onlineDevices"
            :tab="$t('profile.profile.onlineDevices')"
          >
            <OnlineDevices />
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  </Page>
</template>

<style scoped>
/* 美化卡片样式 */
:deep(.ant-card-head) {
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.ant-card-body) {
  padding: 16px;
}

:deep(.ant-tabs-nav) {
  margin-bottom: 16px;
}

:deep(.ant-tabs-tab) {
  padding: 8px 0;
  font-size: 14px;
  font-weight: 500;
}

:deep(.ant-tabs-tab + .ant-tabs-tab) {
  margin-left: 24px;
}

:deep(.ant-tabs-ink-bar) {
  height: 3px;
  border-radius: 3px 3px 0 0;
}
</style>
