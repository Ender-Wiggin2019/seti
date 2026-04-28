import type { IComputerSlotReward } from '@seti/common/types/computer';
import type { EResource, ETrace } from '@seti/common/types/element';
import type { ETechId } from '@seti/common/types/tech';
import type { TIncomeBundle } from '@/engine/player/Income.js';
import type { TCardItem } from '@/engine/player/IPlayer.js';
import type { EPieceType } from '@/engine/player/Pieces.js';

export interface IPlayerPiecesStateDto {
  totalInventory: Record<EPieceType, number>;
  deployedInventory: Record<EPieceType, number>;
}

export interface IPlayerStateDto {
  id: string;
  name: string;
  color: string;
  seatIndex: number;
  score: number;
  passed: boolean;
  probesInSpace: number;
  probeSpaceLimit: number;
  handLimitAfterPass: number;
  pendingSetupTucks: number;
  exofossils?: number;
  resources: {
    credits: number;
    energy: number;
    publicity: number;
    data: number;
  };
  income: {
    base: TIncomeBundle;
    tucked: TIncomeBundle;
  };
  traces: Partial<Record<ETrace, number>>;
  tracesByAlien: Record<number, Partial<Record<ETrace, number>>>;
  techs: ETechId[];
  hand: TCardItem[];
  playedMissions: TCardItem[];
  completedMissions: TCardItem[];
  endGameCards: TCardItem[];
  tuckedIncomeCards: TCardItem[];
  moveStashCount: number;
  pendingCardDrawCount: number;
  pendingAnyCardDrawCount: number;
  dataState: {
    pool: number;
    stash: number;
    poolMax: number;
    computerColumns: Array<{
      topFilled: boolean;
      bottomFilled: boolean;
      techId: ETechId | null;
      bottomReward?: IComputerSlotReward;
    }>;
  };
  pieces: IPlayerPiecesStateDto;
  waitingFor: null;
  resourceByType: Partial<Record<EResource, number>>;
}
