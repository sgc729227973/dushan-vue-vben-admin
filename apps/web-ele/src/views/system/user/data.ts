import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api/system/user';

import { useAccess } from '@vben/access';
import { $t } from '@vben/locales';
import { handleTree } from '@vben/utils';

import { z } from '#/adapter/form';
import { getDeptList } from '#/api/system/dept';
import { getSimplePostList } from '#/api/system/post';
import { getSimpleRoleList } from '#/api/system/role';
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
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'username',
      label: '用户名称',
      component: 'Input',
      rules: 'required',
    },
    {
      label: '用户密码',
      fieldName: 'password',
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '请输入密码',
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['id'],
        show: (values) => !values.id,
      },
    },
    {
      fieldName: 'nickname',
      label: '用户昵称',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'deptId',
      label: '归属部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => {
          const data = await getDeptList();
          return handleTree(data);
        },
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择归属部门',
        treeDefaultExpandAll: true,
        checkStrictly: true,
      },
      rules: 'required',
    },
    {
      fieldName: 'postIds',
      label: '岗位',
      component: 'ApiSelect',
      componentProps: {
        api: getSimplePostList,
        labelField: 'name',
        valueField: 'id',
        mode: 'multiple',
        placeholder: '请选择岗位',
        allowClear: true,
        multiple: true,
        collapseTags: false,
      },
    },
    {
      fieldName: 'email',
      label: '邮箱',
      component: 'Input',
      rules: z.string().email('邮箱格式不正确').or(z.literal('')).optional(),
    },
    {
      fieldName: 'mobile',
      label: '手机号码',
      component: 'Input',
    },
    {
      fieldName: 'sex',
      label: '用户性别',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_USER_SEX, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(1),
    },
    {
      fieldName: 'status',
      label: '用户状态',
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
    },
  ];
}

/** 重置密码的表单 */
export function useResetPasswordFormSchema(): VbenFormSchema[] {
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
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '请输入新密码',
      },
      dependencies: {
        rules(values) {
          return z
            .string({ message: '请输入新密码' })
            .min(5, '密码长度不能少于 5 个字符')
            .max(20, '密码长度不能超过 20 个字符')
            .refine(
              (value) => value !== values.oldPassword,
              '新旧密码不能相同',
            );
        },
        triggerFields: ['newPassword', 'oldPassword'],
      },
      fieldName: 'newPassword',
      label: '新密码',
      rules: 'required',
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: $t('authentication.confirmPassword'),
      },
      dependencies: {
        rules(values) {
          return z
            .string({ message: '请输入确认密码' })
            .min(5, '密码长度不能少于 5 个字符')
            .max(20, '密码长度不能超过 20 个字符')
            .refine(
              (value) => value === values.newPassword,
              '新密码和确认密码不一致',
            );
        },
        triggerFields: ['newPassword', 'confirmPassword'],
      },
      fieldName: 'confirmPassword',
      label: '确认密码',
      rules: 'required',
    },
  ];
}

/** 分配角色的表单 */
export function useAssignRoleFormSchema(): VbenFormSchema[] {
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
      fieldName: 'username',
      label: '用户名称',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'nickname',
      label: '用户昵称',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'roleIds',
      label: '角色',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleRoleList,
        labelField: 'name',
        valueField: 'id',
        mode: 'multiple',
        placeholder: '请选择角色',
        allowClear: true,
        multiple: true,
        collapseTags: false,
      },
    },
  ];
}

/** 用户导入的表单 */
export function useImportFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'file',
      label: '用户数据',
      component: 'Upload',
      rules: 'required',
      help: '仅允许导入 xls、xlsx 格式文件',
      labelWidth: 100,
    },
    {
      fieldName: 'updateSupport',
      label: '是否覆盖',
      component: 'Switch',
      componentProps: {
        checkedChildren: '是',
        unCheckedChildren: '否',
      },
      rules: z.boolean().default(false),
      help: '是否更新已经存在的用户数据',
      labelWidth: 100,
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'username',
      label: '用户名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户名称',
        allowClear: true,
      },
    },
    {
      fieldName: 'mobile',
      label: '手机号码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入手机号码',
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
export function useGridColumns<T = SystemUserApi.User>(
  onActionClick: OnActionClickFn<T>,
  onStatusChange?: (
    newStatus: number,
    row: T,
  ) => PromiseLike<boolean | undefined>,
): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'checkbox',
      width: 60,
      fixed: 'left',
    },
    {
      field: 'id',
      title: '用户编号',
      minWidth: 100,
    },
    {
      field: 'username',
      title: '用户名称',
      minWidth: 120,
    },
    {
      field: 'nickname',
      title: '用户昵称',
      minWidth: 120,
    },
    {
      field: 'deptName',
      title: '部门',
      minWidth: 120,
    },
    {
      field: 'mobile',
      title: '手机号码',
      minWidth: 120,
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 100,
      align: 'center',
      cellRender: {
        attrs: { beforeChange: onStatusChange },
        name: 'CellSwitch',
        props: {
          checkedValue: CommonStatusEnum.ENABLE,
          unCheckedValue: CommonStatusEnum.DISABLE,
          inlinePrompt: true,
        },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 320,
      fixed: 'right',
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'username',
          nameTitle: '用户',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'edit',
            icon: 'ep:edit',
            show: hasAccessByCodes(['system:user:update']),
          },
          {
            code: 'delete',
            icon: 'ep:delete',
            show: hasAccessByCodes(['system:user:delete']),
          },
          {
            code: 'assignRole',
            text: '分配角色',
            icon: 'ep:user',
            show: hasAccessByCodes(['system:permission:assign-user-role']),
          },
          {
            code: 'resetPassword',
            text: '重置密码',
            icon: 'ep:key',
            show: hasAccessByCodes(['system:user:update-password']),
          },
        ],
      },
    },
  ];
}
