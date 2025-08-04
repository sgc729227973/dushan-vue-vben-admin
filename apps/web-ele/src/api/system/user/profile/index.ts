import { requestClient } from '#/api/request';

export namespace SystemUserProfileApi {
  /** 用户在线设备VO */
  export interface SystemUserOnlineDeviceVO {
    /** 会话编号 (Access Token) */
    tokenId: string;
    /** 设备名称 (例如: Chrome 浏览器) */
    deviceName?: string;
    /** IP 地址 */
    ipAddress?: string;
    /** 地理位置 */
    loginLocation?: string;
    /** 浏览器 */
    browser?: string;
    /** 操作系统 */
    os?: string;
    /** 登录时间 */
    loginTime?: Date;
    /** 是否在线 */
    online: boolean;
    /** 是否为当前设备 */
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
  export interface UserProfileRespVO {
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

/** 获取登录用户信息 */
export function getUserProfile() {
  return requestClient.get<SystemUserProfileApi.UserProfileRespVO>(
    '/system/user/profile/get',
  );
}

/** 修改用户个人信息 */
export function updateUserProfile(
  data: SystemUserProfileApi.UpdateProfileReqVO,
) {
  return requestClient.put('/system/user/profile/update', data);
}

/** 修改用户个人密码 */
export function updateUserPassword(
  data: SystemUserProfileApi.UpdatePasswordReqVO,
) {
  return requestClient.put('/system/user/profile/update-password', data);
}

/**
 * 获取用户在线设备列表
 */
export function getUserOnlineDevices() {
  return requestClient.get<SystemUserProfileApi.SystemUserOnlineDeviceVO[]>(
    '/system/user/profile/online-devices',
  );
}

/**
 * 踢出在线设备
 */
export function kickoutOnlineDevice(tokenId: string) {
  return requestClient.delete(`/system/user/profile/online-devices/${tokenId}`);
}
