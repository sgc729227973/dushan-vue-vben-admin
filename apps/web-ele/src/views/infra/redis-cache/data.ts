import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';

/** 缓存名称表格列定义 */
export function useCacheNameColumns<T = any>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'seq',
      width: 60,
      title: '序号',
    },
    {
      field: 'cacheName',
      title: '缓存名称',
      minWidth: 180,
      showOverflow: true,
    },
    {
      field: 'operation',
      title: '操作',
      width: 80,
      fixed: 'right',
      align: 'center',
      cellRender: {
        attrs: {
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'clearCacheName',
            text: '清理',
            type: 'danger',
          },
        ],
      },
    },
  ];
}

/** 缓存键名表格列定义 */
export function useCacheKeyColumns<T = any>(
  onActionClick: OnActionClickFn<T>,
  keyFormatter: (key: string) => string,
): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'seq',
      width: 60,
      title: '序号',
    },
    {
      field: 'key',
      title: '缓存键名',
      minWidth: 180,
      showOverflow: true,
      formatter: ({ cellValue }) => keyFormatter(cellValue),
    },
    {
      field: 'operation',
      title: '操作',
      width: 80,
      fixed: 'right',
      align: 'center',
      cellRender: {
        attrs: {
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'clearCacheKey',
            text: '清理',
            type: 'danger',
          },
        ],
      },
    },
  ];
}

/** 缓存表单配置 */
export function useCacheFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'cacheName',
      label: '缓存名称',
      component: 'Input',
      componentProps: {
        readonly: true,
      },
    },
    {
      fieldName: 'cacheKey',
      label: '缓存键名',
      component: 'Input',
      componentProps: {
        readonly: true,
      },
    },
    {
      fieldName: 'cacheValue',
      label: '缓存内容',
      component: 'Textarea',
      componentProps: {
        rows: 12,
        readonly: true,
      },
    },
  ];
}
