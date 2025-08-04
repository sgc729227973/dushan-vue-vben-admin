<script lang="ts" setup>
import { ref } from 'vue';

import { ElButton, ElCard, ElEmpty, ElImage, ElTag } from 'element-plus';

import {
  clearReceivedLogs,
  formatBytes,
  formatLogTime,
  getLogTagType,
  getLogTypeText,
  openUrl,
  receivedLogs,
} from '#/services/websocket/handlers/testHandler';

// 检查媒体URL是否有效
function getValidMediaUrl(url: string | undefined): string {
  if (!url) return '';

  // 处理blob URL
  if (url.startsWith('blob:')) {
    return url;
  }

  // 处理相对路径
  if (url.startsWith('/')) {
    return url;
  }

  // 处理完整URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 默认添加https前缀
  return `https://${url}`;
}

// 检查媒体是否加载错误
const mediaErrors = ref<Record<string, boolean>>({});

function handleMediaError(mediaUrl: string | undefined) {
  if (mediaUrl) {
    mediaErrors.value[mediaUrl] = true;
  }
}

function isMediaError(mediaUrl: string | undefined): boolean {
  return mediaUrl ? !!mediaErrors.value[mediaUrl] : false;
}

// 安全打开URL
function safeOpenUrl(url: string | undefined) {
  if (url) {
    openUrl(url);
  }
}
</script>

<template>
  <ElCard shadow="hover" class="card-container">
    <!-- 头部保持不变 -->
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <span
            class="i-ant-design:arrow-down-outlined text-success mr-2 text-lg"
          ></span>
          <span class="text-lg font-medium">接收消息</span>
          <ElTag v-if="receivedLogs.length > 0" class="ml-2" type="success">
            {{ receivedLogs.length }} 条
          </ElTag>
        </div>
        <div class="flex items-center space-x-2">
          <ElButton text type="primary" @click="clearReceivedLogs">
            <template #icon>
              <span class="i-ant-design:clear-outlined"></span>
            </template>
            清空日志
          </ElButton>
        </div>
      </div>
    </template>

    <div class="log-container card-content">
      <ElEmpty v-if="receivedLogs.length === 0" description="暂无接收日志" />
      <div v-else class="space-y-2">
        <div
          v-for="(log, index) in [...receivedLogs].reverse()"
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
          <div class="mt-2">
            <!-- 图片消息 -->
            <div
              v-if="log.type === 'image_received'"
              class="flex justify-center"
            >
              <div
                v-if="isMediaError(log.mediaUrl)"
                class="text-center text-red-500"
              >
                <span class="i-ant-design:picture-outlined text-3xl"></span>
                <div class="mt-1">图片加载失败</div>
                <div class="text-xs">{{ log.mediaUrl }}</div>
                <ElButton
                  type="primary"
                  size="small"
                  class="mt-2"
                  @click="() => safeOpenUrl(log.mediaUrl)"
                >
                  在新窗口打开
                </ElButton>
              </div>
              <ElImage
                v-else
                class="max-h-64 max-w-full rounded-md"
                fit="contain"
                preview-teleported
                :preview-src-list="[getValidMediaUrl(log.mediaUrl)]"
                :src="getValidMediaUrl(log.mediaUrl)"
                @error="() => handleMediaError(log.mediaUrl)"
              />
            </div>

            <!-- 音频消息 -->
            <div
              v-else-if="log.type === 'audio_received'"
              class="flex justify-center"
            >
              <div
                v-if="isMediaError(log.mediaUrl)"
                class="text-center text-red-500"
              >
                <span class="i-ant-design:sound-outlined text-3xl"></span>
                <div class="mt-1">音频加载失败</div>
                <div class="text-xs">{{ log.mediaUrl }}</div>
                <ElButton
                  type="primary"
                  size="small"
                  class="mt-2"
                  @click="() => safeOpenUrl(log.mediaUrl)"
                >
                  下载音频
                </ElButton>
              </div>
              <audio
                v-else
                controls
                class="w-full"
                :src="getValidMediaUrl(log.mediaUrl)"
                @error="() => handleMediaError(log.mediaUrl)"
              ></audio>
            </div>

            <!-- 视频消息 -->
            <div
              v-else-if="log.type === 'video_received'"
              class="flex justify-center"
            >
              <div
                v-if="isMediaError(log.mediaUrl)"
                class="text-center text-red-500"
              >
                <span
                  class="i-ant-design:video-camera-outlined text-3xl"
                ></span>
                <div class="mt-1">视频加载失败</div>
                <div class="text-xs">{{ log.mediaUrl }}</div>
                <ElButton
                  type="primary"
                  size="small"
                  class="mt-2"
                  @click="() => safeOpenUrl(log.mediaUrl)"
                >
                  下载视频
                </ElButton>
              </div>
              <video
                v-else
                controls
                class="max-h-64 max-w-full rounded-md"
                :src="getValidMediaUrl(log.mediaUrl)"
                @error="() => handleMediaError(log.mediaUrl)"
              ></video>
            </div>

            <!-- 文件消息 -->
            <div
              v-else-if="log.type === 'file_received'"
              class="flex flex-col items-center"
            >
              <div class="mb-2 text-center">
                <span class="i-ant-design:file-outlined text-3xl"></span>
                <div class="mt-1 text-sm dark:text-gray-300">
                  {{ log.fileName || '未知文件' }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatBytes(log.fileSize || 0) }}
                </div>
              </div>
              <ElButton
                type="primary"
                size="small"
                @click="() => safeOpenUrl(log.mediaUrl)"
              >
                下载文件
              </ElButton>
            </div>

            <!-- 普通文本消息 -->
            <div
              v-else
              class="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200"
            >
              {{ log.message }}
            </div>
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
