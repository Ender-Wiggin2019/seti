import type { IBaseEffect, ICustomizedEffect } from '@seti/common/types/effect';
import type { EPlanet } from '@seti/common/types/element';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

export enum EMissionType {
  FULL = 'FULL',
  QUICK = 'QUICK',
}

export interface IMissionBranchDef {
  readonly req: ReadonlyArray<IBaseEffect | ICustomizedEffect>;
  readonly rewards: ReadonlyArray<IBaseEffect | ICustomizedEffect>;
  readonly checkCondition?: (player: IPlayer, game: IGame) => boolean;
}

export interface IMissionDef {
  readonly cardId: string;
  readonly cardName: string;
  readonly type: EMissionType;
  readonly branches: ReadonlyArray<IMissionBranchDef>;
}

export interface IMissionBranchRuntimeState {
  completed: boolean;
  completedAtRound?: number;
}

export interface IMissionRuntimeState {
  readonly def: IMissionDef;
  readonly playerId: string;
  readonly branchStates: IMissionBranchRuntimeState[];
}

export enum EMissionEventType {
  CARD_PLAYED = 'CARD_PLAYED',
  PROBE_LAUNCHED = 'PROBE_LAUNCHED',
  PROBE_ORBITED = 'PROBE_ORBITED',
  PROBE_LANDED = 'PROBE_LANDED',
  TECH_RESEARCHED = 'TECH_RESEARCHED',
}

export type IMissionEvent =
  | {
      readonly type: EMissionEventType.CARD_PLAYED;
      readonly cost: number;
      readonly costType: string;
    }
  | { readonly type: EMissionEventType.PROBE_LAUNCHED }
  | {
      readonly type: EMissionEventType.PROBE_ORBITED;
      readonly planet: EPlanet;
    }
  | {
      readonly type: EMissionEventType.PROBE_LANDED;
      readonly planet: EPlanet;
      readonly isMoon: boolean;
    }
  | {
      readonly type: EMissionEventType.TECH_RESEARCHED;
      readonly techCategory: string;
    };

export interface ICompletableMission {
  readonly cardId: string;
  readonly cardName: string;
  readonly branchIndex: number;
  readonly rewards: ReadonlyArray<IBaseEffect | ICustomizedEffect>;
}
