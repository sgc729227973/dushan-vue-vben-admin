import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemAnnouncementApi } from '#/api/system/announcement';

import { useAccess } from '@vben/access';

import { z } from '#/adapter/form';
import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

const { hasAccessByCodes } = useAccess();

/** 表单校验规则 */
export const formRules = {
  title: [{ required: true, message: '公告标题不能为空' }],
  content: [{ required: true, message: '公告内容不能为空' }],
  category: [{ required: true, message: '公告类别不能为空' }],
  priority: [{ required: true, message: '优先级不能为空' }],
};

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
      label: '公告标题',
      component: 'Input',
      rules: 'required',
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'category',
      label: '公告类别',
      component: 'Select',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.SYSTEM_ANNOUNCEMENT_CATEGORY,
          'number',
        ),
        placeholder: '请选择公告类别',
      },
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '公告状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_ANNOUNCEMENT_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(0),
    },
    {
      fieldName: 'sort',
      label: '排序',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        placeholder: '请输入排序',
      },
      rules: 'required',
    },
    {
      fieldName: 'isTop',
      label: '是否置顶',
      component: 'Switch',
      componentProps: {
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
      },
    },
    {
      fieldName: 'publishTime',
      label: '发布时间',
      component: 'DatePicker',
      componentProps: {
        type: 'datetime',
        placeholder: '请选择发布时间',
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
      },
    },
    {
      fieldName: 'expireTime',
      label: '过期时间',
      component: 'DatePicker',
      componentProps: {
        type: 'datetime',
        placeholder: '请选择过期时间',
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
      },
    },
    {
      fieldName: 'publisher',
      label: '发布人',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'content',
      label: '公告内容',
      component: 'RichTextarea',
      rules: 'required',
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
      },
      formItemClass: 'col-span-2',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'title',
      label: '公告标题',
      component: 'Input',
      componentProps: {
        placeholder: '请输入公告标题',
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '公告状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_ANNOUNCEMENT_STATUS, 'number'),
        placeholder: '请选择公告状态',
        allowClear: true,
      },
    },
    {
      fieldName: 'category',
      label: '公告类别',
      component: 'Select',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.SYSTEM_ANNOUNCEMENT_CATEGORY,
          'number',
        ),
        placeholder: '请选择公告类别',
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
export function useGridColumns<T = SystemAnnouncementApi.Announcement>(
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
      title: '公告编号',
      minWidth: 100,
    },
    {
      field: 'title',
      title: '公告标题',
      minWidth: 200,
    },
    {
      field: 'publisher',
      title: '发布人',
      minWidth: 100,
    },
    {
      field: 'category',
      title: '公告类别',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_ANNOUNCEMENT_CATEGORY },
      },
    },
    {
      field: 'isTop',
      title: '是否置顶',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: {
          type: DICT_TYPE.INFRA_BOOLEAN_STRING,
        },
      },
    },
    {
      field: 'status',
      title: '公告状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_ANNOUNCEMENT_STATUS },
      },
    },
    {
      field: 'publishTime',
      title: '发布时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'expireTime',
      title: '过期时间',
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
      minWidth: 380,
      align: 'center',
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'title',
          nameTitle: '公告',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'preview',
            text: '预览',
            icon: 'ep:view',
            show: true,
          },
          {
            code: 'edit',
            icon: 'ep:edit',
            show: hasAccessByCodes(['system:announcement:update']),
          },
          {
            code: 'publish',
            text: '立即发布',
            icon: 'ep:upload',
            show: hasAccessByCodes(['system:announcement:publish']),
          },
          {
            code: 'schedule',
            text: '定时发布',
            icon: 'ep:alarm-clock',
            show: hasAccessByCodes(['system:announcement:publish']),
          },
          {
            code: 'delete',
            icon: 'ep:delete',
            show: hasAccessByCodes(['system:announcement:delete']),
          },
        ],
      },
    },
  ];
}
