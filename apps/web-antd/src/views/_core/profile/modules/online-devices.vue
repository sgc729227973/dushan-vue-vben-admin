<script setup lang="tsx">
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemUserProfileApi } from '#/api/system/user/profile';

import { confirm } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Badge, Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getUserOnlineDevices,
  kickoutOnlineDevice,
} from '#/api/system/user/profile';
import { $t } from '#/locales';

function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'deviceName',
      title: $t('profile.devices.deviceName'),
      minWidth: 200,
      slots: {
        default: ({
          row,
        }: {
          row: SystemUserProfileApi.SystemUserOnlineDeviceVO;
        }) => (
          <div class="flex items-center">
            <i
              class={[
                'mr-2 text-lg text-blue-500',
                row.deviceType === 'mobile'
                  ? 'i-ant-design:mobile-outlined'
                  : 'i-ant-design:laptop-outlined',
              ]}
            ></i>
            <span>{row.deviceName}</span>
            {row.isCurrent && (
              <span class="ml-2 rounded-sm bg-green-500 px-[6px] text-xs text-white">
                {$t('profile.devices.currentDevice')}
              </span>
            )}
          </div>
        ),
      },
    },
    {
      field: 'ipAddress',
      title: $t('profile.devices.ipAddress'),
      minWidth: 120,
      slots: {
        default: ({
          row,
        }: {
          row: SystemUserProfileApi.SystemUserOnlineDeviceVO;
        }) => (
          <div>
            <div>{row.ipAddress}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {row.location}
            </div>
          </div>
        ),
      },
    },
    {
      field: 'browser',
      title: $t('profile.devices.browserSystem'),
      minWidth: 180,
      slots: {
        default: ({
          row,
        }: {
          row: SystemUserProfileApi.SystemUserOnlineDeviceVO;
        }) => (
          <div>
            <div>{row.browser}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{row.os}</div>
          </div>
        ),
      },
    },
    {
      field: 'loginTime',
      title: $t('profile.devices.loginTime'),
      minWidth: 160,
      formatter: ({ cellValue }) => String(formatDateTime(cellValue) || ''),
    },
    {
      field: 'online',
      title: $t('profile.devices.status'),
      minWidth: 100,
      slots: {
        default: ({
          row,
        }: {
          row: SystemUserProfileApi.SystemUserOnlineDeviceVO;
        }) => (
          <Badge
            status={row.online ? 'success' : 'default'}
            text={
              row.online
                ? $t('profile.devices.online')
                : $t('profile.devices.offline')
            }
          />
        ),
      },
    },
    {
      field: 'operation',
      title: $t('profile.devices.operation'),
      width: 100,
      align: 'center',
      fixed: 'right',
      slots: {
        default: ({
          row,
        }: {
          row: SystemUserProfileApi.SystemUserOnlineDeviceVO;
        }) => {
          if (!row.isCurrent && row.online) {
            return (
              <Button onClick={() => onKickout(row)} type="link">
                {$t('profile.devices.kickout')}
              </Button>
            );
          }
          return [];
        },
      },
    },
  ];
}
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    minHeight: 0,
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async () => {
          return await getUserOnlineDevices();
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      height: 60,
    },
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<SystemUserProfileApi.SystemUserOnlineDeviceVO>,
});

/** 踢出设备 */
function onKickout(row: SystemUserProfileApi.SystemUserOnlineDeviceVO) {
  confirm({
    content: $t('profile.devices.kickoutConfirm', { device: row.deviceName }),
  }).then(async () => {
    await kickoutOnlineDevice(row.id);
    // 提示成功
    message.success($t('ui.actionMessage.operationSuccess'));
    await gridApi.reload();
  });
}
</script>

<template>
  <div class="online-devices flex flex-col">
    <Grid />
  </div>
</template>

<style scoped>
/*
 The styles for the custom table have been removed as we are now using the VxeGrid component.
 The VxeGrid component handles its own styling, ensuring consistency with other tables in the application.
*/
</style>
