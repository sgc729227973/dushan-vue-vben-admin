import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { InfraDataSourceConfigApi } from '#/api/infra/data-source-config';

import { useAccess } from '@vben/access';

import {
  DICT_TYPE,
  getDictOptions,
  getRangePickerDefaultProps,
  InfraDbTypeEnum,
} from '#/utils';

const { hasAccessByCodes } = useAccess();

// 数据库类型选项
const dbTypeOptions = Object.values(InfraDbTypeEnum).map((item) => ({
  value: item.value,
  label: item.label,
}));

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'name',
      label: '数据源名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入数据源名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'dbType',
      label: '数据库类型',
      component: 'Select',
      componentProps: {
        options: dbTypeOptions,
        placeholder: '请选择数据库类型',
      },
      rules: 'required',
    },
    {
      fieldName: 'url',
      label: '数据源连接',
      component: 'DataSourceUrl',
      componentProps: {
        placeholder: '请配置数据源连接',
      },
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '数据源状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
      rules: 'required',
      defaultValue: 0,
    },
    {
      fieldName: 'sourceType',
      label: '主从类型',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.INFRA_DATA_SOURCE_TYPE, 'number'),
      },
      rules: 'required',
      defaultValue: 1,
    },
    {
      fieldName: 'isDefault',
      label: '是否默认',
      component: 'Switch',
      defaultValue: false,
    },
    {
      fieldName: 'echo',
      label: 'SQL回显',
      component: 'Switch',
      defaultValue: false,
    },
    {
      fieldName: 'poolSize',
      label: '连接池大小',
      component: 'InputNumber',
      componentProps: {
        min: 1,
        placeholder: '请输入连接池大小',
      },
      rules: 'required',
      defaultValue: 5,
    },
    {
      fieldName: 'maxOverflow',
      label: '最大溢出',
      component: 'InputNumber',
      componentProps: {
        min: -1,
        placeholder: '请输入最大溢出',
      },
      rules: 'required',
      defaultValue: 10,
    },
    {
      fieldName: 'poolRecycle',
      label: '池回收秒数',
      component: 'InputNumber',
      componentProps: {
        min: -1,
        placeholder: '请输入池回收秒数',
      },
      rules: 'required',
      defaultValue: 3600,
    },
    {
      fieldName: 'poolTimeout',
      label: '池超时秒数',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        placeholder: '请输入池超时秒数',
      },
      rules: 'required',
      defaultValue: 30,
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

/** 列表的字段 */
export function useGridColumns<T = InfraDataSourceConfigApi.DataSourceConfig>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '主键编号',
      minWidth: 100,
    },
    {
      field: 'name',
      title: '数据源名称',
      minWidth: 150,
    },
    {
      field: 'url',
      title: '数据源连接',
      minWidth: 300,
    },
    {
      field: 'dbType',
      title: '数据库类型',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: {
          type: 'INFRA_DB_TYPE',
          options: dbTypeOptions,
        },
      },
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'sourceType',
      title: '主从',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_DATA_SOURCE_TYPE },
      },
    },
    {
      field: 'isDefault',
      title: '默认',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
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
      minWidth: 140,
      align: 'center',
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '数据源',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'edit',
            show: hasAccessByCodes(['infra:data-source-config:update']),
            disabled: (row: any) => row.id === 0,
          },
          {
            code: 'test',
            text: '测试',
            show: hasAccessByCodes(['infra:data-source-config:query']),
            disabled: (row: any) => row.id === 0,
          },
          {
            code: 'delete',
            show: hasAccessByCodes(['infra:data-source-config:delete']),
            disabled: (row: any) => row.id === 0,
          },
        ],
      },
    },
  ];
}

/** 数据源列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '数据源名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入数据源名称',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        allowClear: true,
        placeholder: '请选择状态',
      },
    },
    {
      fieldName: 'dbType',
      label: '数据库类型',
      component: 'Select',
      componentProps: {
        options: dbTypeOptions,
        allowClear: true,
        placeholder: '请选择数据库类型',
      },
    },
    {
      fieldName: 'sourceType',
      label: '主从类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.INFRA_DATA_SOURCE_TYPE, 'number'),
        allowClear: true,
        placeholder: '请选择主从类型',
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
