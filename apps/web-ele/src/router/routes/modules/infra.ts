import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/infra/job/job-log',
    component: () => import('#/views/infra/job/logger/index.vue'),
    name: 'InfraJobLog',
    meta: {
      title: '调度日志',
      icon: 'ant-design:history-outlined',
      activePath: '/infra/job',
      keepAlive: false,
      hideInMenu: true,
    },
  },
  {
    path: '/infra/mq/mq-log',
    component: () => import('#/views/infra/mq/logger/index.vue'),
    name: 'InfraMqLog',
    meta: {
      title: '消费日志',
      icon: 'ant-design:history-outlined',
      activePath: '/infra/mq',
      keepAlive: false,
      hideInMenu: true,
    },
  },
];

export default routes;
