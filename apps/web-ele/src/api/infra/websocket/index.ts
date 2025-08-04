import { requestClient } from '#/api/request';

// 消息类型枚举
export enum MessageType {
  AUDIO = 'audio',
  FILE = 'file',
  IMAGE = 'image',
  TEXT = 'text',
  VIDEO = 'video',
}

export namespace InfraWebSocketApi {
  export interface BroadcastMessageReqVO {
    message: Record<string, any>;
    file?: File;
    message_type: MessageType;
  }

  export interface SendToUserReqVO {
    userType: number;
    userId: number;
    message: Record<string, any>;
    file?: File;
    message_type: MessageType;
  }
}

export function broadcastMessage(
  data: InfraWebSocketApi.BroadcastMessageReqVO,
) {
  const formData = new FormData();
  formData.append('message', JSON.stringify(data.message));
  formData.append('message_type', data.message_type);

  if (data.file) {
    formData.append('file', data.file);
  }

  return requestClient.post<any>('/infra/websocket/broadcast', formData);
}

export function sendMessageToUser(data: InfraWebSocketApi.SendToUserReqVO) {
  const formData = new FormData();
  formData.append('userType', data.userType.toString());
  formData.append('userId', data.userId.toString());
  formData.append('message', JSON.stringify(data.message));
  formData.append('message_type', data.message_type);

  if (data.file) {
    formData.append('file', data.file);
  }

  return requestClient.post<any>('/infra/websocket/send-to-user', formData);
}
