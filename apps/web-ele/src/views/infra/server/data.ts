import type { InfraServerApi } from '#/api/infra/server';

// 定义各种卡片组件的接口
interface CpuColumn {
  label: string;
  value: number | undefined;
  suffix?: string;
}

interface MemoryValue {
  label: string;
  value: number | string | undefined;
  suffix?: string;
  danger?: boolean;
}

interface MemoryColumn {
  label: string;
  values: MemoryValue[];
}

interface InfoCell {
  label: string;
  value: string | undefined;
  colspan?: number;
}

interface DiskCell {
  value: string | undefined;
  danger?: boolean;
}

/**
 * CPU卡片组件
 */
export function useCpuCard(server: InfraServerApi.ServerMonitorRespVO) {
  const cpuUsage = (server.cpu?.used || 0) + (server.cpu?.sys || 0);
  return {
    title: 'CPU',
    icon: 'Cpu',
    usage: cpuUsage,
    columns: [
      { label: '核心数', value: server.cpu?.cpuNum },
      { label: '用户使用率', value: server.cpu?.used, suffix: '%' },
      { label: '系统使用率', value: server.cpu?.sys, suffix: '%' },
      { label: '当前空闲率', value: server.cpu?.free, suffix: '%' },
    ] as CpuColumn[],
  };
}

/**
 * 内存卡片组件
 */
export function useMemoryCard(server: InfraServerApi.ServerMonitorRespVO) {
  const memUsage = server.mem?.usage;
  const pyUsage = server.py?.usage;

  return {
    title: '内存',
    icon: 'Tickets',
    usage: memUsage,
    pyUsage,
    columns: [
      {
        label: '总内存',
        values: [
          { label: '内存', value: server.mem?.total },
          { label: 'Python', value: server.py?.total },
        ],
      },
      {
        label: '已用内存',
        values: [
          { label: '内存', value: server.mem?.used },
          { label: 'Python', value: server.py?.used },
        ],
      },
      {
        label: '剩余内存',
        values: [
          { label: '内存', value: server.mem?.free },
          { label: 'Python', value: server.py?.free },
        ],
      },
      {
        label: '使用率',
        values: [
          {
            label: '内存',
            value: memUsage,
            suffix: '%',
            danger: typeof memUsage === 'number' && memUsage > 80,
          },
          {
            label: 'Python',
            value: pyUsage,
            suffix: '%',
            danger: typeof pyUsage === 'number' && pyUsage > 80,
          },
        ],
      },
    ] as MemoryColumn[],
  };
}

/**
 * 服务器信息卡片组件
 */
export function useServerInfoCard(server: InfraServerApi.ServerMonitorRespVO) {
  return {
    title: '服务器信息',
    icon: 'Monitor',
    rows: [
      [
        { label: '服务器名称', value: server.sys?.computerName },
        { label: '操作系统', value: server.sys?.osName },
      ],
      [
        { label: '服务器IP', value: server.sys?.computerIp },
        { label: '系统架构', value: server.sys?.osArch },
      ],
    ] as InfoCell[][],
  };
}

/**
 * Python解释器信息卡片组件
 */
export function usePythonInfoCard(server: InfraServerApi.ServerMonitorRespVO) {
  return {
    title: 'Python解释器信息',
    icon: 'CoffeeCup',
    rows: [
      [
        { label: 'Python名称', value: server.py?.name },
        { label: 'Python版本', value: server.py?.version },
      ],
      [
        { label: '启动时间', value: server.py?.startTime },
        { label: '运行时长', value: server.py?.runTime },
      ],
      [{ label: '安装路径', value: server.py?.home, colspan: 3 }],
      [{ label: '项目路径', value: server.sys?.userDir, colspan: 3 }],
    ] as InfoCell[][],
  };
}

/**
 * 磁盘状态卡片组件
 */
export function useDiskStatusCard(server: InfraServerApi.ServerMonitorRespVO) {
  return {
    title: '磁盘状态',
    icon: 'MessageBox',
    headers: [
      '盘符路径',
      '文件系统',
      '盘符名称',
      '总大小',
      '可用大小',
      '已用大小',
      '已用百分比',
    ],
    rows:
      server.sysFiles?.map((sysFile) => [
        sysFile.dirName,
        sysFile.sysTypeName,
        sysFile.typeName,
        sysFile.total,
        sysFile.free,
        sysFile.used,
        {
          value: sysFile.usage,
          danger: Number.parseInt(sysFile.usage ?? '0') > 80,
        } as DiskCell,
      ]) || [],
  };
}
