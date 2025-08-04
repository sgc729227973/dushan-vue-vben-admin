import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemNotifyMessageApi } from '#/api/system/notify/message';

import { useAccess } from '@vben/access';

import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

const { hasAccessByCodes } = useAccess();

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'userId',
      label: '用户编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入用户编号',
      },
    },
    {
      fieldName: 'userType',
      label: '用户类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.USER_TYPE, 'number'),
        placeholder: '请选择用户类型',
      },
    },
    {
      fieldName: 'noticeTitle',
      label: '通知标题',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入通知标题',
      },
    },
    {
      fieldName: 'noticeType',
      label: '通知类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_NOTICE_TYPE, 'number'),
        allowClear: true,
        placeholder: '请选择通知类型',
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = SystemNotifyMessageApi.NotifyMessage>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      minWidth: 100,
    },
    {
      field: 'userType',
      title: '用户类型',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.USER_TYPE },
      },
    },
    {
      field: 'userId',
      title: '用户编号',
      minWidth: 100,
    },
    {
      field: 'noticeTitle',
      title: '通知标题',
      minWidth: 200,
    },
    {
      field: 'noticeType',
      title: '通知类型',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_NOTICE_TYPE },
      },
    },
    {
      field: 'noticeContent',
      title: '通知内容',
      minWidth: 300,
      showOverflow: 'tooltip', // 内容过长时显示省略号，悬浮展示完整文本
      formatter: ({ cellValue }) =>
        (cellValue || '').replaceAll(/<[^>]+>/g, ''), // 去除 HTML 标签
    },
    {
      field: 'readStatus',
      title: '是否已读',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'readTime',
      title: '阅读时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'operation',
      title: '操作',
      minWidth: 80,
      align: 'center',
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'id',
          nameTitle: '站内信',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'detail',
            text: '详情',
            show: hasAccessByCodes(['system:notify-message:query']),
          },
        ],
      },
    },
  ];
}
