import { requestClient } from '#/api/request';

/**
 * 获取服务信息
 */
export const getCache = () => {
  return requestClient.get('/infra/server/list');
};

export interface CpuInfoVO {
  cpuNum?: number;
  used?: number;
  sys?: number;
  free?: number;
}

export interface MemoryInfoVO {
  total?: string;
  used?: string;
  free?: string;
  usage?: number;
}

export interface SysInfoVO {
  computerIp?: string;
  computerName?: string;
  osArch?: string;
  osName?: string;
  userDir?: string;
}

export interface PyInfoVO extends MemoryInfoVO {
  name?: string;
  version?: string;
  startTime?: string;
  runTime?: string;
  home?: string;
}

export interface SysFilesInfoVO {
  dirName?: string;
  sysTypeName?: string;
  typeName?: string;
  total?: string;
  used?: string;
  free?: string;
  usage?: string; // 后端返回的是 'xx%' 字符串
}

export interface ServerMonitorRespVO {
  cpu?: CpuInfoVO;
  py?: PyInfoVO;
  mem?: MemoryInfoVO;
  sys?: SysInfoVO;
  sysFiles?: SysFilesInfoVO[];
}
