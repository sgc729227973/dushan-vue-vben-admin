import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { InfraOnlineApi } from '#/api/infra/online';

import { useAccess } from '@vben/access';

const { hasAccessByCodes } = useAccess();

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'ipaddr',
      label: '登录地址',
      component: 'Input',
      componentProps: {
        placeholder: '请输入登录地址',
        clearable: true,
      },
    },
    {
      fieldName: 'userName',
      label: '用户名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户名称',
        clearable: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = InfraOnlineApi.OnlineRespVO>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'seq',
      width: 60,
      title: '序号',
    },
    {
      field: 'tokenId',
      title: '会话编号',
      minWidth: 120,
      showOverflow: true,
    },
    {
      field: 'userName',
      title: '登录名称',
      minWidth: 120,
      showOverflow: true,
    },
    {
      field: 'deptName',
      title: '所属部门',
      minWidth: 120,
      showOverflow: true,
    },
    {
      field: 'ipaddr',
      title: '主机',
      minWidth: 120,
      showOverflow: true,
    },
    {
      field: 'loginLocation',
      title: '登录地点',
      minWidth: 120,
      showOverflow: true,
    },
    {
      field: 'os',
      title: '操作系统',
      minWidth: 120,
      showOverflow: true,
    },
    {
      field: 'browser',
      title: '浏览器',
      minWidth: 120,
      showOverflow: true,
    },
    {
      field: 'loginTime',
      title: '登录时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'operation',
      title: '操作',
      width: 120,
      fixed: 'right',
      align: 'center',
      cellRender: {
        attrs: {
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'forceLogout',
            text: '强退',
            show: hasAccessByCodes(['infra:online:force-logout']),
          },
        ],
      },
    },
  ];
}
