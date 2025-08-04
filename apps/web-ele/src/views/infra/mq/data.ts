import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { InfraMqApi } from '#/api/infra/mq';

import { useAccess } from '@vben/access';

import {
  getRangePickerDefaultProps,
  InfraMqDefinitionStatusEnum,
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
      fieldName: 'topic',
      label: '消息主题',
      component: 'Input',
      componentProps: {
        placeholder: '请输入消息主题',
      },
      rules: 'required',
    },
    {
      fieldName: 'consumer',
      label: '消费者名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入消费者名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'retryCount',
      label: '重试次数',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入重试次数',
        min: 0,
      },
      rules: 'required',
    },
    {
      fieldName: 'description',
      label: '描述',
      component: 'Input',
      componentProps: {
        placeholder: '请输入描述信息',
        type: 'textarea',
        rows: 4,
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'topic',
      label: '消息主题',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入消息主题',
      },
    },
    {
      fieldName: 'consumer',
      label: '消费者名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入消费者名称',
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

/** 表格列配置 */
export function useGridColumns<T = InfraMqApi.Mq>(
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
      title: '编号',
      minWidth: 80,
    },
    {
      field: 'topic',
      title: '消息主题',
      minWidth: 120,
    },
    {
      field: 'consumer',
      title: '消费者名称',
      minWidth: 120,
    },
    {
      field: 'retryCount',
      title: '重试次数',
      minWidth: 100,
    },
    {
      field: 'description',
      title: '描述',
      minWidth: 140,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      cellRender: {
        name: 'CellDate',
      },
    },
    {
      field: 'operation',
      title: '操作',
      width: 240,
      fixed: 'right',
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'topic',
          nameTitle: 'MQ消息',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'edit',
            show: hasAccessByCodes(['infra:mq-definition:update']),
          },
          {
            code: 'update-status',
            text: '开启',
            show: (row: any) =>
              hasAccessByCodes(['infra:mq-definition:update']) &&
              row.status === InfraMqDefinitionStatusEnum.DISABLE,
          },
          {
            code: 'update-status',
            text: '停用',
            show: (row: any) =>
              hasAccessByCodes(['infra:mq-definition:update']) &&
              row.status === InfraMqDefinitionStatusEnum.ENABLE,
          },
          {
            code: 'detail',
            text: '详细',
            show: hasAccessByCodes(['infra:mq-definition:query']),
          },
          {
            code: 'log',
            text: '日志',
            show: hasAccessByCodes(['infra:mq-log:query']),
          },
          {
            code: 'delete',
            show: hasAccessByCodes(['infra:mq-definition:delete']),
          },
        ],
      },
    },
  ];
}
