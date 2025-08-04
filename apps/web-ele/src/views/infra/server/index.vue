<script lang="ts" setup>
import type { InfraServerApi } from '#/api/infra/server';

import { computed, onMounted, onUnmounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { websocketService } from '#/services/websocket';
import {
  addServerMonitorCallback,
  removeServerMonitorCallback,
} from '#/services/websocket/handlers/serverMonitorHandler';

import {
  useCpuCard,
  useDiskStatusCard,
  useMemoryCard,
  usePythonInfoCard,
  useServerInfoCard,
} from './data';

// 仪表盘样式函数
const getGaugeStyle = (usage: number = 0) => {
  const percentage = Math.min(usage, 100);
  const color =
    percentage > 80 ? '#f56c6c' : (percentage > 60 ? '#e6a23c' : '#67c23a');

  return {
    '--percentage': percentage,
    '--color': color,
    animation: `gauge-fill 1s ease-out`,
  };
};

const server = ref<InfraServerApi.ServerMonitorRespVO>({});
let refreshTimer: null | number = null;
const isLoading = ref(false); // 改为 false，页面立即显示
const isDataLoaded = ref(false); // 新增：数据是否已加载
const previousData = ref<Record<string, any>>({});

// WebSocket回调处理函数
const handleServerMonitorUpdate = (
  data: InfraServerApi.ServerMonitorRespVO,
) => {
  if (data && typeof data === 'object') {
    // 存储之前的数据用于动画对比
    previousData.value = { ...server.value };

    // 直接更新服务器数据
    server.value = { ...server.value, ...data };

    // 标记数据已加载
    isDataLoaded.value = true;
    isLoading.value = false;

    // 触发数值更新动画
    triggerValueUpdateAnimations();

    // 触发数字滚动动画
    watchDataChanges();
  }
};

// 触发数值更新动画
const triggerValueUpdateAnimations = () => {
  setTimeout(() => {
    const elements = document.querySelectorAll('.animated-value');
    elements.forEach((el) => {
      el.classList.add('updated');
      setTimeout(() => {
        el.classList.remove('updated');
      }, 600);
    });
  }, 100);
};

// 数字滚动动画
const animateValue = (
  element: HTMLElement,
  start: number,
  end: number,
  duration: number,
) => {
  const startTime = performance.now();
  const isDecimal = end % 1 !== 0;

  const updateValue = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // 使用缓动函数
    const easeOutQuart = 1 - (1 - progress) ** 4;
    const current = start + (end - start) * easeOutQuart;

    element.textContent = isDecimal
      ? current.toFixed(1)
      : Math.floor(current).toString();

    if (progress < 1) {
      requestAnimationFrame(updateValue);
    }
  };

  requestAnimationFrame(updateValue);
};

// 监听数据变化并触发数字滚动动画
const watchDataChanges = () => {
  const cpuUsage = (server.value.cpu?.used || 0) + (server.value.cpu?.sys || 0);
  const prevCpuUsage =
    (previousData.value.cpu?.used || 0) + (previousData.value.cpu?.sys || 0);

  if (cpuUsage !== prevCpuUsage) {
    const gaugeElements = document.querySelectorAll('.gauge-value');
    gaugeElements.forEach((el) => {
      if (el.textContent?.includes('%')) {
        animateValue(el as HTMLElement, prevCpuUsage || 0, cpuUsage || 0, 800);
      }
    });
  }
};

// 请求服务器监控数据
function requestServerMonitorData() {
  // 显示加载状态
  isLoading.value = true;

  // 通过WebSocket发送请求服务器监控数据的消息
  const message = {
    type: 'get_server_monitor_data',
    payload: {
      resource: 'server_monitor',
    },
  };

  // 发送消息到WebSocket服务器
  websocketService.sendMessage(message);
}

// 启动定时刷新
function startRefreshTimer() {
  // 清除现有的定时器
  if (refreshTimer !== null) {
    window.clearInterval(refreshTimer);
  }

  // 每10秒请求一次服务器监控数据
  refreshTimer = window.setInterval(() => {
    requestServerMonitorData();
  }, 10_000);
}

// 停止定时刷新
function stopRefreshTimer() {
  if (refreshTimer !== null) {
    window.clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

// 计算属性，用于获取各个卡片组件的数据
const cpuCard = computed(() => useCpuCard(server.value));
const memoryCard = computed(() => useMemoryCard(server.value));
const serverInfoCard = computed(() => useServerInfoCard(server.value));
const pythonInfoCard = computed(() => usePythonInfoCard(server.value));
const diskStatusCard = computed(() => useDiskStatusCard(server.value));

onMounted(() => {
  // 注册WebSocket回调
  addServerMonitorCallback(handleServerMonitorUpdate);

  // 立即请求初始数据（异步）
  setTimeout(() => {
    requestServerMonitorData();
  }, 100);

  // 启动定时刷新
  startRefreshTimer();
});

// 组件卸载时移除WebSocket回调和定时器
onUnmounted(() => {
  removeServerMonitorCallback(handleServerMonitorUpdate);
  stopRefreshTimer();
});
</script>

<template>
  <Page auto-content-height>
    <div class="server-monitor">
      <!-- 实际内容 - 始终显示，使用默认值或真实数据 -->
      <div class="monitor-grid">
        <!-- CPU卡片 -->
        <div class="monitor-card">
          <div class="card-header">
            <component :is="cpuCard.icon" class="card-icon" />
            <span>{{ cpuCard.title }}</span>
          </div>
          <div class="card-body">
            <div class="dashboard-container">
              <div class="gauge-chart">
                <div class="gauge-circle" :style="getGaugeStyle(cpuCard.usage)">
                  <div class="gauge-inner">
                    <div class="gauge-value">{{ cpuCard.usage || 0 }}%</div>
                    <div class="gauge-label">总使用率</div>
                  </div>
                </div>
              </div>
              <div class="gauge-details">
                <table class="custom-table">
                  <thead>
                    <tr>
                      <th>属性</th>
                      <th>值</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(column, index) in cpuCard.columns" :key="index">
                      <td>{{ column.label }}</td>
                      <td>
                        <span class="animated-value">
                          {{ column.value || 'N/A' }}{{ column.suffix || '' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- 内存卡片 -->
        <div class="monitor-card">
          <div class="card-header">
            <component :is="memoryCard.icon" class="card-icon" />
            <span>{{ memoryCard.title }}</span>
          </div>
          <div class="card-body">
            <div class="dashboard-container">
              <div class="memory-gauges">
                <div class="gauge-chart small">
                  <div
                    class="gauge-circle"
                    :style="getGaugeStyle(memoryCard.usage)"
                  >
                    <div class="gauge-inner">
                      <div class="gauge-value">
                        {{ memoryCard.usage || 0 }}%
                      </div>
                      <div class="gauge-label">内存</div>
                    </div>
                  </div>
                </div>
                <div class="gauge-chart small">
                  <div
                    class="gauge-circle"
                    :style="getGaugeStyle(memoryCard.pyUsage)"
                  >
                    <div class="gauge-inner">
                      <div class="gauge-value">
                        {{ memoryCard.pyUsage || 0 }}%
                      </div>
                      <div class="gauge-label">Python</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="gauge-details">
                <table class="custom-table">
                  <thead>
                    <tr>
                      <th>属性</th>
                      <th>内存</th>
                      <th>Python</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(column, index) in memoryCard.columns"
                      :key="index"
                    >
                      <td>{{ column.label }}</td>
                      <td
                        v-for="(value, vIndex) in column.values"
                        :key="vIndex"
                        :class="{ 'text-danger': value.danger }"
                      >
                        <span class="animated-value">
                          {{ value.value || 'N/A' }}{{ value.suffix || '' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- 服务器信息卡片 -->
        <div class="monitor-card full-width">
          <div class="card-header">
            <component :is="serverInfoCard.icon" class="card-icon" />
            <span>{{ serverInfoCard.title }}</span>
          </div>
          <div class="card-body">
            <table class="custom-table info-table">
              <tbody>
                <tr
                  v-for="(row, rowIndex) in serverInfoCard.rows"
                  :key="rowIndex"
                >
                  <template v-for="(cell, cellIndex) in row" :key="cellIndex">
                    <td class="label-cell">{{ cell.label }}</td>
                    <td class="value-cell">{{ cell.value || 'N/A' }}</td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Python解释器信息卡片 -->
        <div class="monitor-card full-width">
          <div class="card-header">
            <component :is="pythonInfoCard.icon" class="card-icon" />
            <span>{{ pythonInfoCard.title }}</span>
          </div>
          <div class="card-body">
            <table class="custom-table info-table">
              <tbody>
                <tr
                  v-for="(row, rowIndex) in pythonInfoCard.rows"
                  :key="rowIndex"
                >
                  <template v-for="(cell, cellIndex) in row" :key="cellIndex">
                    <td class="label-cell" :colspan="cell.colspan || 1">
                      {{ cell.label }}
                    </td>
                    <td class="value-cell" :colspan="cell.colspan ? 3 : 1">
                      {{ cell.value || 'N/A' }}
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 磁盘状态卡片 -->
        <div class="monitor-card full-width">
          <div class="card-header">
            <component :is="diskStatusCard.icon" class="card-icon" />
            <span>{{ diskStatusCard.title }}</span>
          </div>
          <div class="card-body">
            <table class="custom-table">
              <thead>
                <tr>
                  <th
                    v-for="(header, index) in diskStatusCard.headers"
                    :key="index"
                  >
                    {{ header }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, rowIndex) in diskStatusCard.rows"
                  :key="rowIndex"
                >
                  <td
                    v-for="(cell, cellIndex) in row"
                    :key="cellIndex"
                    :class="{
                      'text-danger':
                        typeof cell === 'object' &&
                        cell &&
                        'danger' in cell &&
                        cell.danger,
                    }"
                  >
                    {{
                      typeof cell === 'object' && cell
                        ? cell.value || 'N/A'
                        : cell || 'N/A'
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>

<style lang="scss" scoped>
@keyframes gauge-rotate {
  from {
    transform: rotate(-90deg);
  }

  to {
    transform: rotate(0deg);
  }
}

@keyframes gauge-fill {
  from {
    opacity: 0;
    transform: scale(0.8);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }
}

@keyframes slide-in-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@keyframes value-update {
  0% {
    color: inherit;
    transform: scale(1);
  }

  50% {
    color: #409eff;
    transform: scale(1.1);
  }

  100% {
    color: inherit;
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .monitor-grid {
    grid-template-columns: 1fr;
  }

  .monitor-card.full-width {
    grid-column: span 1;
  }
}

.server-monitor {
  padding: 16px;
}

.monitor-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.monitor-card {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgb(0 0 0 / 8%);
  transition: all 0.3s ease;
  animation: slide-in-up 0.6s ease-out;

  &.full-width {
    grid-column: span 2;
  }

  &:hover {
    box-shadow: 0 6px 16px rgb(0 0 0 / 12%);
    transform: translateY(-2px);
  }

  &:nth-child(1) {
    animation-delay: 0.1s;
  }

  &:nth-child(2) {
    animation-delay: 0.2s;
  }

  &:nth-child(3) {
    animation-delay: 0.3s;
  }

  &:nth-child(4) {
    animation-delay: 0.4s;
  }

  &:nth-child(5) {
    animation-delay: 0.5s;
  }
}

.card-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 500;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  border-radius: 4px 4px 0 0;

  .card-icon {
    width: 1.2em;
    height: 1.2em;
    margin-right: 8px;
    vertical-align: middle;
  }
}

.card-body {
  padding: 16px;
  overflow-x: auto;
}

.custom-table {
  width: 100%;
  font-size: 14px;
  border-collapse: collapse;

  th,
  td {
    padding: 12px 8px;
    text-align: left;
    border-bottom: 1px solid #ebeef5;
  }

  th {
    font-weight: 500;
    color: #606266;
    background-color: #f5f7fa;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover > td {
    background-color: #f5f7fa;
  }
}

.info-table {
  td.label-cell {
    width: 120px;
    font-weight: 500;
    color: #606266;
  }

  td.value-cell {
    color: #333;
  }
}

.text-danger {
  font-weight: 500;
  color: #f56c6c;
}

// 仪表盘样式
.dashboard-container {
  display: flex;
  gap: 24px;
  align-items: center;
}

.gauge-chart {
  position: relative;
  width: 120px;
  height: 120px;

  &.small {
    width: 100px;
    height: 100px;
  }
}

.gauge-circle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: conic-gradient(
    var(--color) 0%,
    var(--color) calc(var(--percentage) * 1%),
    #e9ecef calc(var(--percentage) * 1%),
    #e9ecef 100%
  );
  border-radius: 50%;
  animation: gauge-rotate 1s ease-out;

  &::before {
    position: absolute;
    width: 80%;
    height: 80%;
    content: '';
    background: white;
    border-radius: 50%;
  }
}

.gauge-inner {
  position: relative;
  z-index: 1;
  text-align: center;
}

.gauge-value {
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
  color: #333;
}

.gauge-label {
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}

.memory-gauges {
  display: flex;
  gap: 16px;
}

.gauge-details {
  flex: 1;
}

// 加载动画
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: rgb(255 255 255 / 90%);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 16px;
  font-size: 14px;
  color: #666;
}

// 数值变化动画
.animated-value {
  display: inline-block;
  transition: all 0.3s ease;

  &.updated {
    animation: value-update 0.6s ease;
  }
}

/* 响应式布局 */

// 加载指示器
.loading-indicator {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  font-size: 12px;
  color: white;
  background: rgb(64 158 255 / 90%);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);

  .loading-spinner.small {
    width: 16px;
    height: 16px;
    border: 2px solid rgb(255 255 255 / 30%);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}
</style>
