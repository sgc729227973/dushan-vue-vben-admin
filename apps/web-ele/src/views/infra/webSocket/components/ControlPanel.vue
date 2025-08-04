<script lang="ts" setup>
import { computed } from 'vue';

import { useAccessStore } from '@vben/stores';

import {
  ElBadge,
  ElButton,
  ElCard,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTag,
  ElTooltip,
} from 'element-plus';

import { FileUpload, ImageUpload } from '#/components/upload';
import { websocketService } from '#/services/websocket';
import {
  addLog,
  AUDIO,
  broadcastFileUrl,
  broadcastMsgContent,
  broadcastMsgType,
  copyToClipboard,
  getMessageTypeText,
  handleBroadcastUploadSuccess,
  handleUserUploadSuccess,
  IMAGE,
  messageContent,
  messageType,
  messageTypeOptions,
  messageTypes,
  selectedUserId,
  targetUserFileUrl,
  targetUserMessage,
  targetUserMsgType,
  targetUserType,
  TEXT,
  userList,
  VIDEO,
} from '#/services/websocket/handlers/testHandler';

// 定义事件
const emit = defineEmits(['sendBroadcast', 'sendToUser']);

// 获取 access store
const accessStore = useAccessStore();
const accessToken = computed(() => accessStore.accessToken);

// 使用响应式的状态值，确保按钮随 WebSocket 状态实时变化
const isConnected = computed(
  () => websocketService.getStatus().value === 'OPEN',
);
const wsStatus = computed(() => websocketService.getStatus().value);
const statusColor = computed(() =>
  isConnected.value ? 'success' : ('danger' as const),
);
const statusText = computed(() => {
  switch (wsStatus.value) {
    case 'CLOSED': {
      return '已断开';
    }
    case 'CONNECTING': {
      return '连接中...';
    }
    case 'OPEN': {
      return '已连接';
    }
    default: {
      return '未连接';
    }
  }
});

// WebSocket URL 配置
const baseUrl = computed(() =>
  `${import.meta.env.VITE_BASE_URL}/infra/ws`.replace('http', 'ws'),
);
const wsUrl = computed(() => {
  return `${baseUrl.value}?token=${accessToken.value}`;
});

// WebSocket 连接管理
function connectWebSocket() {
  if (websocketService.isConnected()) {
    addLog('info', '已存在连接，请先断开');
    return;
  }

  try {
    addLog('info', `正在连接到: ${wsUrl.value}`);
    // 连接 WebSocket
    websocketService.connect();
  } catch (error) {
    addLog('error', `连接失败: ${error}`);
  }
}

function disconnectWebSocket() {
  if (!websocketService.isConnected()) {
    addLog('info', '没有活动的连接');
    return;
  }

  try {
    websocketService.disconnect();
    addLog('info', '正在断开连接...');
  } catch (error) {
    addLog('error', `断开连接时出错: ${error}`);
  }
}

// 发送自定义消息
function sendCustomMessage() {
  if (!websocketService.isConnected()) {
    ElMessage.warning('WebSocket 未连接');
    return;
  }

  switch (messageType.value) {
    case 'custom': {
      try {
        // 尝试解析用户输入的 JSON
        const messageObj = JSON.parse(messageContent.value);
        websocketService.sendMessage(messageObj);
        addLog(
          'sent',
          `发送自定义消息: ${JSON.stringify(messageObj, null, 2)}`,
        );
      } catch (error) {
        addLog('error', `发送失败，消息内容不是有效的JSON格式: ${error}`);
        ElMessage.error('消息内容不是有效的JSON格式');
      }

      break;
    }
    case 'get_app_config': {
      getAppConfig();
      break;
    }
    case 'get_user_info': {
      getUserInfo();
      break;
    }
    case 'ping': {
      sendPing();
      break;
    }
    // No default
  }
}

// 发送心跳
function sendPing() {
  if (!websocketService.isConnected()) {
    ElMessage.warning('WebSocket 未连接');
    return;
  }

  try {
    const message = {
      type: 'ping',
      payload: { timestamp: new Date().toISOString() },
    };
    websocketService.sendMessage(message);
    addLog('sent', `发送心跳: ${JSON.stringify(message, null, 2)}`);
  } catch (error) {
    addLog('error', `发送心跳失败: ${error}`);
  }
}

// 获取用户信息
function getUserInfo() {
  if (!websocketService.isConnected()) {
    ElMessage.warning('WebSocket 未连接');
    return;
  }

  try {
    const message = {
      type: 'get_user_info',
      payload: {}, // 添加空的payload对象
    };
    websocketService.sendMessage(message);
    addLog('sent', `请求用户信息: ${JSON.stringify(message, null, 2)}`);
  } catch (error) {
    addLog('error', `请求用户信息失败: ${error}`);
  }
}

// 获取应用配置
function getAppConfig() {
  if (!websocketService.isConnected()) {
    ElMessage.warning('WebSocket 未连接');
    return;
  }

  try {
    const message = {
      type: 'get_app_config',
      payload: {}, // 添加空的payload对象
    };
    websocketService.sendMessage(message);
    addLog('sent', `请求应用配置: ${JSON.stringify(message, null, 2)}`);
  } catch (error) {
    addLog('error', `请求应用配置失败: ${error}`);
  }
}

defineExpose({
  connectWebSocket,
  disconnectWebSocket,
  sendCustomMessage,
});
</script>

<template>
  <ElCard shadow="hover" class="card-container">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <ElBadge :type="statusColor" is-dot />
          <span class="ml-2 text-lg font-medium">控制中心</span>
        </div>
        <ElTag :type="statusColor">{{ statusText }}</ElTag>
      </div>
    </template>

    <div class="card-content space-y-4">
      <!-- 连接配置 -->
      <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
        <h3 class="mb-2 text-base font-medium dark:text-gray-200">连接设置</h3>

        <div class="mb-3">
          <label class="mb-1 block text-sm font-medium dark:text-gray-300">
            WebSocket URL
          </label>
          <ElInput v-model="baseUrl" size="default" />
        </div>

        <div class="mb-3">
          <label class="mb-1 block text-sm font-medium dark:text-gray-300">
            完整连接地址
          </label>
          <div class="flex items-center">
            <ElInput v-model="wsUrl" readonly size="default" />
            <ElTooltip content="复制到剪贴板" placement="top">
              <ElButton
                class="ml-2"
                circle
                type="primary"
                @click="copyToClipboard(wsUrl)"
              >
                <span class="i-ant-design:copy-outlined"></span>
              </ElButton>
            </ElTooltip>
          </div>
        </div>

        <div class="flex space-x-2">
          <ElButton
            :disabled="isConnected"
            :loading="wsStatus === 'CONNECTING'"
            class="flex-1"
            type="primary"
            @click="connectWebSocket"
          >
            <template #icon>
              <span class="i-ant-design:link-outlined"></span>
            </template>
            连接
          </ElButton>
          <ElButton
            :disabled="!isConnected"
            class="flex-1"
            type="danger"
            @click="disconnectWebSocket"
          >
            <template #icon>
              <span class="i-ant-design:disconnect-outlined"></span>
            </template>
            断开
          </ElButton>
        </div>
      </div>

      <!-- 消息类型选择 -->
      <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
        <h3 class="mb-2 text-base font-medium dark:text-gray-200">消息类型</h3>
        <div class="mb-3">
          <ElSelect v-model="messageType" class="w-full" size="default">
            <ElOption
              v-for="type in messageTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </ElSelect>
        </div>
      </div>

      <!-- 消息内容 -->
      <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
        <h3 class="mb-2 text-base font-medium dark:text-gray-200">消息内容</h3>
        <div v-if="messageType === 'custom'" class="mb-3">
          <ElInput
            v-model="messageContent"
            :disabled="!isConnected"
            :rows="5"
            clearable
            placeholder="请输入JSON格式的消息内容..."
            type="textarea"
          />
        </div>

        <ElButton
          :disabled="!isConnected"
          type="primary"
          class="w-full"
          @click="sendCustomMessage"
        >
          <template #icon>
            <span class="i-ant-design:send-outlined"></span>
          </template>
          {{
            messageType === 'custom'
              ? '发送消息'
              : messageType === 'ping'
                ? '发送心跳'
                : messageType === 'get_user_info'
                  ? '获取用户信息'
                  : '获取应用配置'
          }}
        </ElButton>
      </div>

      <!-- 广播消息 -->
      <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
        <h3 class="mb-2 text-base font-medium dark:text-gray-200">广播消息</h3>
        <div class="mb-3">
          <label class="mb-1 block text-sm font-medium dark:text-gray-300">
            消息类型
          </label>
          <ElSelect v-model="broadcastMsgType" class="w-full" size="default">
            <ElOption
              v-for="type in messageTypeOptions"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </ElSelect>
        </div>
        <div v-if="broadcastMsgType === TEXT" class="mb-3">
          <ElInput
            v-model="broadcastMsgContent"
            :rows="4"
            clearable
            placeholder="请输入JSON格式的广播消息..."
            type="textarea"
          />
        </div>
        <div v-if="broadcastMsgType !== TEXT" class="mb-3">
          <label class="mb-1 block text-sm font-medium dark:text-gray-300">
            选择{{ getMessageTypeText(broadcastMsgType) }}文件
          </label>
          <!-- 根据消息类型选择不同的上传组件 -->
          <div v-if="broadcastMsgType === IMAGE">
            <ImageUpload
              v-model:value="broadcastFileUrl"
              :max-size="10"
              @change="handleBroadcastUploadSuccess"
            />
          </div>
          <div v-else>
            <FileUpload
              v-model:value="broadcastFileUrl"
              :max-size="20"
              :accept="
                broadcastMsgType === AUDIO
                  ? ['mp3', 'wav', 'ogg']
                  : broadcastMsgType === VIDEO
                    ? ['mp4', 'webm', 'ogg']
                    : []
              "
              @change="handleBroadcastUploadSuccess"
            />
          </div>
        </div>
        <ElButton type="warning" class="w-full" @click="emit('sendBroadcast')">
          <template #icon>
            <span class="i-ant-design:notification-outlined"></span>
          </template>
          发送广播{{ getMessageTypeText(broadcastMsgType) }}
        </ElButton>
      </div>

      <!-- 向指定用户发送消息 -->
      <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
        <h3 class="mb-2 text-base font-medium dark:text-gray-200">
          向指定用户发送
        </h3>
        <div class="mb-3 grid grid-cols-2 gap-2">
          <div>
            <label class="mb-1 block text-sm font-medium dark:text-gray-300">
              用户类型
            </label>
            <ElSelect v-model="targetUserType" class="w-full" size="default">
              <ElOption :value="2" label="管理员(2)" />
              <!-- <ElOption :value="1" label="会员(1)" /> -->
            </ElSelect>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium dark:text-gray-300">
              选择用户
            </label>
            <ElSelect v-model="selectedUserId" class="w-full" size="default">
              <ElOption
                v-for="user in userList"
                :key="user.id"
                :value="user.id"
                :label="user.nickname"
              />
            </ElSelect>
          </div>
        </div>
        <div class="mb-3">
          <label class="mb-1 block text-sm font-medium dark:text-gray-300">
            消息类型
          </label>
          <ElSelect v-model="targetUserMsgType" class="w-full" size="default">
            <ElOption
              v-for="type in messageTypeOptions"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </ElSelect>
        </div>
        <div v-if="targetUserMsgType === TEXT" class="mb-3">
          <ElInput
            v-model="targetUserMessage"
            :rows="4"
            clearable
            placeholder="请输入JSON格式的消息..."
            type="textarea"
          />
        </div>
        <div v-if="targetUserMsgType !== TEXT" class="mb-3">
          <label class="mb-1 block text-sm font-medium dark:text-gray-300">
            选择{{ getMessageTypeText(targetUserMsgType) }}文件
          </label>
          <!-- 根据消息类型选择不同的上传组件 -->
          <div v-if="targetUserMsgType === IMAGE">
            <ImageUpload
              v-model:value="targetUserFileUrl"
              :max-size="10"
              @change="handleUserUploadSuccess"
            />
          </div>
          <div v-else>
            <FileUpload
              v-model:value="targetUserFileUrl"
              :max-size="20"
              :accept="
                targetUserMsgType === AUDIO
                  ? ['mp3', 'wav', 'ogg']
                  : targetUserMsgType === VIDEO
                    ? ['mp4', 'webm', 'ogg']
                    : []
              "
              @change="handleUserUploadSuccess"
            />
          </div>
        </div>
        <ElButton type="success" class="w-full" @click="emit('sendToUser')">
          <template #icon>
            <span class="i-ant-design:user-outlined"></span>
          </template>
          发送{{ getMessageTypeText(targetUserMsgType) }}给用户
        </ElButton>
      </div>
    </div>
  </ElCard>
</template>

<style scoped>
.card-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-content {
  flex: 1;
  overflow-y: auto;
}

:deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  height: calc(100% - 58px);
  padding: 15px;
  overflow: hidden;
}
</style>
