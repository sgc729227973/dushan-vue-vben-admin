import { ref } from 'vue';

/**
 * 表格导出Hook
 * @returns 导出相关的方法和状态
 */
export function useTableExport(options: {
  // 默认文件名
  defaultFileName?: string;
}) {
  const { defaultFileName = 'export.xls' } = options;

  // 导出对话框是否可见
  const exportDialogVisible = ref(false);

  // 导出参数
  const exportParams = ref<Record<string, any>>({});

  /**
   * 打开导出对话框
   * @param params 导出参数
   */
  function openExportDialog(params: Record<string, any> = {}) {
    exportParams.value = params;
    exportDialogVisible.value = true;
  }

  /**
   * 关闭导出对话框
   */
  function closeExportDialog() {
    exportDialogVisible.value = false;
  }

  return {
    exportDialogVisible,
    exportParams,
    defaultFileName,
    openExportDialog,
    closeExportDialog,
  };
}
