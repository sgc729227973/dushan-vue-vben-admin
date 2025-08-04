<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { getSimpleUserList } from '#/api/system/user';
import { initWebSocketService, websocketService } from '#/services/websocket';
import { addLog, userList } from '#/services/websocket/handlers/testHandler';

import ControlPanel from './components/ControlPanel.vue';
import ReceiveMessage from './components/ReceiveMessage.vue';
import SendMessage from './components/SendMessage.vue';

// 引用子组件
const controlPanelRef = ref();
const sendMessageRef = ref();

// 获取 access store
const accessStore = useAccessStore();

// 暗黑模式
const isDarkMode = ref(false);

// 广播消息
async function sendBroadcast() {
  if (sendMessageRef.value) {
    await sendMessageRef.value.sendBroadcast();
  }
}

// 向指定用户发送消息
async function sendToUser() {
  if (sendMessageRef.value) {
    await sendMessageRef.value.sendToUser();
  }
}

// 初始化
onMounted(async () => {
  try {
    userList.value = await getSimpleUserList();
    addLog('info', `成功获取用户列表，共 ${userList.value.length} 个用户`);
  } catch (error) {
    addLog('error', `获取用户列表失败: ${error}`);
  }

  // 初始化 WebSocket 服务
  initWebSocketService();

  // 如果未连接，则连接 WebSocket
  if (!websocketService.isConnected()) {
    websocketService.connect();
  }

  addLog('info', 'WebSocket 测试中心已初始化');
  addLog(
    'info',
    `当前 AccessToken: ${accessStore.accessToken?.slice(0, 20)}...`,
  );
});
</script>

<template>
  <Page :class="{ 'dark-mode': isDarkMode }">
    <template #doc>
      <DocAlert
        title="WebSocket 实时通信"
        url="https://doc.iocoder.cn/websocket/"
      />
    </template>
    <div class="websocket-container mt-4 grid grid-cols-12 gap-4">
      <!-- 左侧：控制面板 -->
      <div class="card-wrapper col-span-3">
        <ControlPanel
          ref="controlPanelRef"
          @send-broadcast="sendBroadcast"
          @send-to-user="sendToUser"
        />
      </div>

      <!-- 中间：发送消息日志 -->
      <div class="card-wrapper col-span-4">
        <SendMessage ref="sendMessageRef" />
      </div>

      <!-- 右侧：接收消息日志 -->
      <div class="card-wrapper col-span-5">
        <ReceiveMessage />
      </div>
    </div>
  </Page>
</template>

<style scoped>
.websocket-container {
  height: calc(100vh - 150px);
  overflow: hidden;
}

.card-wrapper {
  height: 100%;
  overflow: auto;
}
</style>
