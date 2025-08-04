import { requestClient } from '#/api/request';

export namespace SystemUserProfileApi {
  /** 用户在线设备VO */
  export interface SystemUserOnlineDeviceVO {
    /** 设备ID */
    id: string;
    /** 设备名称 */
    deviceName: string;
    /** 设备类型 */
    deviceType: string;
    /** IP地址 */
    ipAddress: string;
    /** 地理位置 */
    location: string;
    /** 浏览器 */
    browser: string;
    /** 操作系统 */
    os: string;
    /** 登录时间 */
    loginTime: Date;
    /** 是否在线 */
    online: boolean;
    /** 是否当前设备 */
    isCurrent: boolean;
  }

  /** 用户角色VO */
  export interface RoleVO {
    /** 角色ID */
    id: number;
    /** 角色名称 */
    name: string;
  }

  /** 用户部门VO */
  export interface DeptVO {
    /** 部门ID */
    id: number;
    /** 部门名称 */
    name: string;
  }

  /** 用户岗位VO */
  export interface PostVO {
    /** 岗位ID */
    id: number;
    /** 岗位名称 */
    name: string;
  }

  /** 用户个人资料 */
  export interface UserProfileResp {
    /** 用户ID */
    id: number;
    /** 用户账号 */
    username: string;
    /** 用户昵称 */
    nickname: string;
    /** 用户邮箱 */
    email?: string;
    /** 手机号码 */
    mobile?: string;
    /** 用户性别 */
    sex?: number;
    /** 用户头像 */
    avatar?: string;
    /** 登录IP */
    loginIp: string;
    /** 所属角色 */
    roles: RoleVO[];
    /** 所属部门 */
    dept?: DeptVO;
    /** 所属岗位 */
    posts: PostVO[];
    /** 创建时间 */
    createTime: string;
    /** 最后登录时间 */
    loginDate: string;
    /** 个人简介 */
    bio?: string;
    /** 用户标签 */
    tags?: string[];
    /** 地址 */
    address?: string;
    /** 技能 */
    skills?: string;
  }

  /** 更新用户个人资料请求 */
  export interface UpdateProfileReqVO {
    /** 用户昵称 */
    nickname?: string;
    /** 用户邮箱 */
    email?: string;
    /** 手机号码 */
    mobile?: string;
    /** 用户性别 */
    sex?: number;
    /** 用户头像 */
    avatar?: string;
    /** 个人简介 */
    bio?: string;
    /** 用户标签 */
    tags?: string[];
    /** 地址 */
    address?: string;
    /** 技能 */
    skills?: string;
  }

  /** 更新用户密码请求 */
  export interface UpdatePasswordReqVO {
    /** 旧密码 */
    oldPassword: string;
    /** 新密码 */
    newPassword: string;
  }
}

/**
 * 获取用户个人资料
 */
export function getUserProfile() {
  return requestClient.get<SystemUserProfileApi.UserProfileResp>(
    '/system/user/profile/get',
  );
}

/**
 * 更新用户个人资料
 */
export function updateUserProfile(
  data: SystemUserProfileApi.UpdateProfileReqVO,
) {
  return requestClient.put('/system/user/profile/update', data);
}

/**
 * 更新用户密码
 */
export function updateUserPassword(
  data: SystemUserProfileApi.UpdatePasswordReqVO,
) {
  return requestClient.put('/system/user/profile/update-password', data);
}

// 在线设备API可以在未来开发，这里暂时保留模拟数据

/**
 * 获取用户在线设备列表
 */
export function getUserOnlineDevices(): Promise<
  SystemUserProfileApi.SystemUserOnlineDeviceVO[]
> {
  // 注意：模拟数据，实际应该从后端获取
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: '1',
          deviceName: 'Chrome浏览器',
          deviceType: 'desktop',
          ipAddress: '192.168.1.1',
          location: '中国 上海',
          browser: 'Chrome 131.0.0.0',
          os: 'Windows 10',
          loginTime: new Date(),
          online: true,
          isCurrent: true,
        },
        {
          id: '2',
          deviceName: 'Firefox浏览器',
          deviceType: 'desktop',
          ipAddress: '192.168.1.2',
          location: '中国 北京',
          browser: 'Firefox 125.0',
          os: 'macOS',
          loginTime: new Date(Date.now() - 86_400_000),
          online: true,
          isCurrent: false,
        },
        {
          id: '3',
          deviceName: 'iPhone 15',
          deviceType: 'mobile',
          ipAddress: '192.168.1.3',
          location: '中国 广州',
          browser: 'Safari',
          os: 'iOS 17',
          loginTime: new Date(Date.now() - 172_800_000),
          online: false,
          isCurrent: false,
        },
      ]);
    }, 300);
  });
}

/**
 * 踢出在线设备
 */
export function kickoutOnlineDevice(_id: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 300);
  });
}
