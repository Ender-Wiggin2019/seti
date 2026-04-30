export enum EConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
}

export interface IRouteMeta {
  title: string;
  requiresAuth: boolean;
}

export type TLocaleCode = 'en' | 'zh';
