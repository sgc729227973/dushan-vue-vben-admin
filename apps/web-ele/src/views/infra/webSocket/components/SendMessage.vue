<script lang="ts" setup>
import { ElButton, ElCard, ElEmpty, ElMessage, ElTag } from 'element-plus';

import { requestClient } from '#/api/request';
import { websocketService } from '#/services/websocket';
import {
  addLog,
  broadcastFileUrl,
  broadcastMsgContent,
  broadcastMsgType,
  clearSentLogs,
  formatLogTime,
  getLogTagType,
  getLogTypeText,
  getMessageTypeText,
  messageContent,
  messageType,
  selectedUserId,
  sentLogs,
  targetUserFileUrl,
  targetUserMessage,
  targetUserMsgType,
  targetUserType,
  TEXT,
} from '#/services/websocket/handlers/testHandler';

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

// 发送广播消息
async function sendBroadcast() {
  try {
    const messageObj = JSON.parse(broadcastMsgContent.value);

    // 如果是非文本消息，需要有文件URL
    if (broadcastMsgType.value !== TEXT && !broadcastFileUrl.value) {
      ElMessage.warning(
        `请先上传${getMessageTypeText(broadcastMsgType.value)}文件`,
      );
      return;
    }

    // 根据消息类型，构建不同的payload
    if (broadcastMsgType.value !== TEXT) {
      // 非文本消息，完全替换payload为媒体消息格式
      messageObj.payload = {
        file_url: broadcastFileUrl.value,
        file_type: broadcastMsgType.value,
      };
    }

    addLog('sent', `准备发送广播消息: ${JSON.stringify(messageObj, null, 2)}`);

    // 调用API发送广播消息
    await requestClient.post('/infra/websocket/broadcast', {
      message: messageObj,
      message_type: broadcastMsgType.value,
    });

    // 由于全局拦截器已处理响应，这里直接获取到的是data
    ElMessage.success(`广播消息已成功发送`);
  } catch (error) {
    console.error('发送广播消息失败:', error);
    ElMessage.error(`发送失败: ${error}`);
  }
}

// 向指定用户发送消息
async function sendToUser() {
  try {
    if (!selectedUserId.value) {
      ElMessage.warning('请选择一个用户');
      return;
    }

    // 如果是非文本消息，需要有文件URL
    if (targetUserMsgType.value !== TEXT && !targetUserFileUrl.value) {
      ElMessage.warning(
        `请先上传${getMessageTypeText(targetUserMsgType.value)}文件`,
      );
      return;
    }

    const messageObj = JSON.parse(targetUserMessage.value);

    // 根据消息类型，构建不同的payload
    if (targetUserMsgType.value !== TEXT) {
      // 非文本消息，完全替换payload为媒体消息格式
      messageObj.payload = {
        file_url: targetUserFileUrl.value,
        file_type: targetUserMsgType.value,
      };
    }

    addLog(
      'sent',
      `准备向用户(ID=${selectedUserId.value})发送消息: ${JSON.stringify(messageObj, null, 2)}`,
    );

    // 调用API发送消息给指定用户
    await requestClient.post('/infra/websocket/send-to-user', {
      userType: targetUserType.value,
      userId: selectedUserId.value,
      message: messageObj,
      message_type: targetUserMsgType.value,
    });

    ElMessage.success(`消息已成功发送给用户`);
  } catch (error) {
    console.error('发送用户消息失败:', error);
    ElMessage.error(`发送失败: ${error}`);
  }
}

defineExpose({
  sendCustomMessage,
  sendBroadcast,
  sendToUser,
});
</script>

<template>
  <ElCard shadow="hover" class="card-container">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <span
            class="i-ant-design:arrow-up-outlined text-warning mr-2 text-lg"
          ></span>
          <span class="text-lg font-medium">发送消息</span>
          <ElTag v-if="sentLogs.length > 0" class="ml-2" type="warning">
            {{ sentLogs.length }} 条
          </ElTag>
        </div>
        <div class="flex items-center space-x-2">
          <ElButton text type="primary" @click="clearSentLogs">
            <template #icon>
              <span class="i-ant-design:clear-outlined"></span>
            </template>
            清空日志
          </ElButton>
        </div>
      </div>
    </template>

    <div class="log-container card-content">
      <ElEmpty v-if="sentLogs.length === 0" description="暂无发送日志" />
      <div v-else class="space-y-2">
        <div
          v-for="(log, index) in [...sentLogs].reverse()"
          :key="index"
          class="rounded-md border bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div class="mb-2 flex items-center justify-between">
            <div class="flex items-center">
              <ElTag :type="getLogTagType(log.type)" size="small">
                {{ getLogTypeText(log.type) }}
              </ElTag>
            </div>
            <span class="text-xs text-gray-400 dark:text-gray-500">
              {{ formatLogTime(log.time) }}
            </span>
          </div>
          <div
            class="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200"
          >
            {{ log.message }}
          </div>
        </div>
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

.log-container {
  padding: 8px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.dark .log-container {
  background-color: #1a1a1a;
}

:deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  height: calc(100% - 58px);
  padding: 15px;
  overflow: hidden;
}
</style>
