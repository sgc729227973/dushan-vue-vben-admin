<script lang="ts" setup>
import type { NotificationItem } from './types';

import { ref } from 'vue';

import { Bell, MailCheck } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  VbenButton,
  VbenIconButton,
  VbenPopover,
  VbenScrollbar,
} from '@vben-core/shadcn-ui';

import { useToggle } from '@vueuse/core';

interface Props {
  /** 未读数量 */
  count?: number;
  /** 消息列表 */
  notifications?: NotificationItem[];
}

defineOptions({ name: 'NotificationPopup' });

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  notifications: () => [],
});

const emit = defineEmits<{
  clear: [];
  makeAll: [];
  open: [boolean];
  read: [NotificationItem];
  viewAll: [];
}>();

const [open, toggle] = useToggle();

// 保存已展开的通知 ID
const expandedIds = ref<Set<number | string>>(new Set());

function stripHtml(html: string) {
  return (html || '').replaceAll(/<[^>]+>/g, '');
}

function toggleItem(item: NotificationItem) {
  // 切换展开/折叠
  if (item.id !== undefined) {
    if (expandedIds.value.has(item.id)) {
      expandedIds.value.delete(item.id);
    } else {
      expandedIds.value.add(item.id);
    }
  }

  // 首次点击同时触发已读逻辑
  if (!item.isRead) {
    handleClick(item);
    item.isRead = true;
  }
}

function close() {
  open.value = false;
}

function handleViewAll() {
  emit('viewAll');
  close();
}

function handleMakeAll() {
  emit('makeAll');
}

function handleClear() {
  emit('clear');
}

function handleClick(item: NotificationItem) {
  emit('read', item);
}

function handleOpen() {
  toggle();
  emit('open', open.value);
}
</script>
<template>
  <VbenPopover
    v-model:open="open"
    content-class="relative right-2 w-[60vw] min-w-[320px] max-w-[480px] p-0"
  >
    <template #trigger>
      <div class="flex-center mr-2 h-full" @click.stop="handleOpen">
        <VbenIconButton class="bell-button text-foreground relative">
          <span
            v-if="props.count > 0"
            class="bg-primary absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full px-1 py-0.5 text-[10px] leading-none text-white opacity-90"
          >
            {{ props.count > 99 ? '99+' : props.count }}
          </span>
          <Bell class="size-4" :class="{ 'animate-bell': props.count > 0 }" />
        </VbenIconButton>
      </div>
    </template>

    <div class="relative">
      <div class="flex items-center justify-between p-4 py-3">
        <div class="text-foreground">{{ $t('ui.widgets.notifications') }}</div>
        <VbenIconButton
          :disabled="notifications.length <= 0"
          :tooltip="$t('ui.widgets.markAllAsRead')"
          @click="handleMakeAll"
        >
          <MailCheck class="size-4" />
        </VbenIconButton>
      </div>
      <VbenScrollbar v-if="notifications.length > 0">
        <ul class="!flex max-h-[70vh] w-full flex-col">
          <template v-for="item in notifications" :key="item.title">
            <li
              class="hover:bg-accent border-border relative flex w-full cursor-pointer flex-col gap-2 border-t px-3 py-3"
              @click="toggleItem(item)"
            >
              <span
                v-if="!item.isRead"
                class="bg-primary absolute right-2 top-2 h-2 w-2 rounded"
              ></span>

              <div class="flex items-start gap-5">
                <span
                  class="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full"
                >
                  <img
                    :src="item.avatar"
                    class="aspect-square h-full w-full object-cover"
                    role="img"
                  />
                </span>
                <div class="flex flex-col gap-1 leading-none">
                  <p class="flex items-center gap-1 font-semibold">
                    {{ item.title }}
                    <span
                      v-if="item.nickname"
                      class="text-muted-foreground text-xs"
                    >
                      ({{ item.nickname }})
                    </span>
                  </p>
                  <p
                    class="text-muted-foreground my-1 line-clamp-2 flex items-center gap-1 text-xs"
                  >
                    <span
                      class="size-1.5 rounded-full"
                      :class="item.isRead ? 'bg-muted' : 'bg-primary'"
                    ></span>
                    {{ stripHtml(item.message) }}
                  </p>
                  <p class="text-muted-foreground line-clamp-2 text-xs">
                    {{ item.date }}
                  </p>
                </div>
              </div>
              <div
                v-if="item.id !== undefined && expandedIds.has(item.id)"
                class="prose dark:prose-invert bg-background/50 rounded border border-dashed p-2 text-xs"
                v-html="item.message"
              ></div>
            </li>
          </template>
        </ul>
      </VbenScrollbar>

      <template v-else>
        <div class="flex-center text-muted-foreground min-h-[150px] w-full">
          {{ $t('common.noData') }}
        </div>
      </template>

      <div
        class="border-border flex items-center justify-between border-t px-4 py-3"
      >
        <VbenButton
          :disabled="notifications.length <= 0"
          size="sm"
          variant="ghost"
          @click="handleClear"
        >
          {{ $t('ui.widgets.clearNotifications') }}
        </VbenButton>
        <VbenButton size="sm" @click="handleViewAll">
          {{ $t('ui.widgets.viewAll') }}
        </VbenButton>
      </div>
    </div>
  </VbenPopover>
</template>

<style scoped>
:deep(.bell-button) {
  &:hover {
    svg {
      animation: bell-ring 1s both;
    }
  }
}

:deep(.animate-bell) {
  animation: bell-ring 1.2s infinite;
}

@keyframes bell-ring {
  0%,
  100% {
    transform-origin: top;
  }

  15% {
    transform: rotateZ(10deg);
  }

  30% {
    transform: rotateZ(-10deg);
  }

  45% {
    transform: rotateZ(5deg);
  }

  60% {
    transform: rotateZ(-5deg);
  }

  75% {
    transform: rotateZ(2deg);
  }
}
</style>
