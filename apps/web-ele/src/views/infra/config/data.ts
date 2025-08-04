import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { InfraConfigApi } from '#/api/infra/config';

import { useAccess } from '@vben/access';

import { z } from '#/adapter/form';
import {
  CommonStatusEnum,
  DICT_TYPE,
  getDictOptions,
  getRangePickerDefaultProps,
} from '#/utils';

const { hasAccessByCodes } = useAccess();

/** 类型新增/修改的表单 */
export function useTypeFormSchema(): VbenFormSchema[] {
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
      label: '配置类型名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入配置类型名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'code',
      label: '配置类型编码',
      component: 'Input',
      componentProps: (values) => {
        return {
          placeholder: '请输入配置类型编码',
          disabled: !!values.id,
        };
      },
      rules: 'required',
      dependencies: {
        triggerFields: [''],
      },
    },
    {
      fieldName: 'status',
      label: '状态',
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

/** 类型列表的搜索表单 */
export function useTypeGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '配置类型名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入配置类型名称',
        clearable: true,
      },
    },
    {
      fieldName: 'code',
      label: '配置类型编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入配置类型编码',
        clearable: true,
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
        clearable: true,
      },
    },
  ];
}

/** 类型列表的字段 */
export function useTypeGridColumns<T = InfraConfigApi.ConfigType>(
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
      title: '类型编号',
      minWidth: 100,
    },
    {
      field: 'name',
      title: '配置类型名称',
      minWidth: 200,
    },
    {
      field: 'code',
      title: '配置类型编码',
      minWidth: 220,
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 180,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      minWidth: 120,
      title: '操作',
      field: 'operation',
      fixed: 'right',
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '配置类型',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'edit',
            show: hasAccessByCodes(['infra:config-type:update']),
          },
          {
            code: 'delete',
            show: hasAccessByCodes(['infra:config-type:delete']),
          },
        ],
      },
    },
  ];
}

// ============================== 配置数据 ==============================

/** 数据新增/修改的表单 */
export function useDataFormSchema(): VbenFormSchema[] {
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
      fieldName: 'typeId',
      label: '配置类型',
      component: 'ApiSelect',
      componentProps: (values) => {
        return {
          api: () =>
            import('#/api/infra/config').then((m) =>
              m.getSimpleConfigTypeList(),
            ),
          placeholder: '请选择配置类型',
          labelField: 'name',
          valueField: 'id',
          disabled: !!values.id,
        };
      },
      rules: 'required',
      dependencies: {
        triggerFields: [''],
      },
    },
    {
      fieldName: 'name',
      label: '配置名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入配置名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'key',
      label: '配置键名',
      component: 'Input',
      componentProps: {
        placeholder: '请输入配置键名',
      },
      rules: 'required',
    },
    {
      fieldName: 'value',
      label: '配置键值',
      component: 'Input',
      componentProps: {
        placeholder: '请输入配置键值',
      },
      rules: 'required',
    },
    {
      fieldName: 'visible',
      label: '是否可见',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      defaultValue: true,
      rules: 'required',
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

/** 配置数据列表搜索表单 */
export function useDataGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '配置名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入配置名称',
        clearable: true,
      },
    },
    {
      fieldName: 'key',
      label: '配置键名',
      component: 'Input',
      componentProps: {
        placeholder: '请输入配置键名',
        clearable: true,
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

/**
 * 配置数据表格列
 */
export function useDataGridColumns<T = InfraConfigApi.ConfigData>(
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
      title: '配置编号',
      minWidth: 100,
    },
    {
      field: 'typeName',
      title: '配置类型',
      minWidth: 180,
    },
    {
      field: 'name',
      title: '配置名称',
      minWidth: 180,
    },
    {
      field: 'key',
      title: '配置键名',
      minWidth: 180,
    },
    {
      field: 'value',
      title: '配置键值',
      minWidth: 180,
    },
    {
      field: 'visible',
      title: '是否可见',
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
      minWidth: 120,
      title: '操作',
      field: 'operation',
      fixed: 'right',
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '配置数据',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'edit',
            show: hasAccessByCodes(['infra:config-data:update']),
          },
          {
            code: 'delete',
            show: hasAccessByCodes(['infra:config-data:delete']),
          },
        ],
      },
    },
  ];
}
