import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemNoticeApi } from '#/api/system/notice';

import { useAccess } from '@vben/access';

import { z } from '#/adapter/form';
import {
  CommonStatusEnum,
  DICT_TYPE,
  getDictOptions,
  getRangePickerDefaultProps,
} from '#/utils';

const { hasAccessByCodes } = useAccess();

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'title',
      label: '通知标题',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'publisher',
      label: '发布人',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'userType',
      label: '用户类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.USER_TYPE, 'number'),
        allowClear: true,
        placeholder: '请选择用户类型',
      },
      rules: 'required',
    },
    {
      fieldName: 'channels',
      label: '推送渠道',
      component: 'Select',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.SYSTEM_NOTIFICATION_CHANNEL,
          'string',
        ),
        allowClear: true,
        placeholder: '请选择推送渠道',
        multiple: true,
        collapseTags: false,
      },
    },
    {
      fieldName: 'type',
      label: '通知类型',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_NOTICE_TYPE, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: 'required',
    },
    {
      fieldName: 'content',
      label: '通知内容',
      component: 'RichTextarea',
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '通知状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'title',
      label: '通知标题',
      component: 'Input',
      componentProps: {
        placeholder: '请输入通知标题',
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '通知状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择通知状态',
        allowClear: true,
      },
    },
    {
      fieldName: 'channels',
      label: '推送渠道',
      component: 'Select',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.SYSTEM_NOTIFICATION_CHANNEL,
          'string',
        ),
        placeholder: '请选择推送渠道',
        allowClear: true,
        multiple: true,
        collapseTags: false,
      },
    },
    {
      fieldName: 'publisher',
      label: '发布人',
      component: 'Input',
      componentProps: {
        placeholder: '请输入发布人',
        allowClear: true,
      },
    },
    {
      fieldName: 'type',
      label: '通知类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_NOTICE_TYPE, 'number'),
        placeholder: '请选择通知类型',
        allowClear: true,
      },
    },
    {
      fieldName: 'userType',
      label: '用户类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.USER_TYPE, 'number'),
        placeholder: '请选择用户类型',
        allowClear: true,
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
export function useGridColumns<T = SystemNoticeApi.Notice>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'checkbox',
      width: 60,
      fixed: 'left',
    },
    {
      field: 'id',
      title: '通知编号',
      minWidth: 100,
    },
    {
      field: 'title',
      title: '通知标题',
      minWidth: 200,
    },
    {
      field: 'publisher',
      title: '发布人',
      minWidth: 120,
    },
    {
      field: 'type',
      title: '通知类型',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_NOTICE_TYPE },
      },
    },
    {
      field: 'status',
      title: '通知状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'userType',
      title: '用户类型',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.USER_TYPE },
      },
    },
    {
      field: 'channels',
      title: '推送渠道',
      minWidth: 180,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_NOTIFICATION_CHANNEL, multiple: true },
      },
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
      minWidth: 180,
      align: 'center',
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'title',
          nameTitle: '通知',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'edit',
            icon: 'ep:edit',
            show: hasAccessByCodes(['system:notice:update']),
          },
          {
            code: 'push',
            text: '推送',
            icon: 'ep:upload',
            show: hasAccessByCodes(['system:notice:send']),
          },
          {
            code: 'delete',
            icon: 'ep:delete',
            show: hasAccessByCodes(['system:notice:delete']),
          },
        ],
      },
    },
  ];
}
