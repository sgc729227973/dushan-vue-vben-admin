import { requestClient } from '#/api/request';

export namespace InfraServerApi {
  /** CPU信息 */
  export interface CpuInfoVO {
    cpuNum?: number;
    used?: number;
    sys?: number;
    free?: number;
  }

  /** 内存信息 */
  export interface MemoryInfoVO {
    total?: string;
    used?: string;
    free?: string;
    usage?: number;
  }

  /** 系统信息 */
  export interface SysInfoVO {
    computerIp?: string;
    computerName?: string;
    osArch?: string;
    osName?: string;
    userDir?: string;
  }

  /** Python环境信息 */
  export interface PyInfoVO extends MemoryInfoVO {
    name?: string;
    version?: string;
    startTime?: string;
    runTime?: string;
    home?: string;
  }

  /** 系统文件信息 */
  export interface SysFilesInfoVO {
    dirName?: string;
    sysTypeName?: string;
    typeName?: string;
    total?: string;
    used?: string;
    free?: string;
    usage?: string; // 后端返回的是 'xx%' 字符串
  }

  /** 服务器监控响应对象 */
  export interface ServerMonitorRespVO {
    cpu?: CpuInfoVO;
    py?: PyInfoVO;
    mem?: MemoryInfoVO;
    sys?: SysInfoVO;
    sysFiles?: SysFilesInfoVO[];
  }
}

/** 获取服务信息 */
export function getCache() {
  return requestClient.get<InfraServerApi.ServerMonitorRespVO>(
    '/infra/server/list',
  );
}
