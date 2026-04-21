export interface IAuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  token: string;
  user: IAuthUser;
}

export interface IRegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface IRegisterResponse {
  token: string;
  user: IAuthUser;
}

export interface IDebugServerSessionResponse {
  gameId: string;
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export enum ERoomStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

export interface IRoomPlayer {
  id: string;
  name: string;
  seatIndex: number;
  ready: boolean;
  isHost: boolean;
}

export interface IGameOptions {
  playerCount: number;
  alienModulesEnabled: boolean[];
  undoAllowed: boolean;
  timerPerTurn: number;
}

export interface IAlienTypeOption {
  alienType: number;
  alienName: string;
  disabled: boolean;
}

export interface IRoom {
  id: string;
  name: string;
  hostId: string;
  status: ERoomStatus;
  players: IRoomPlayer[];
  options: IGameOptions;
  gameId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateRoomRequest {
  name: string;
  options: IGameOptions;
}

export interface IRoomListFilter {
  status?: ERoomStatus;
}

export interface IUpdateProfileRequest {
  name?: string;
}
