import type { IBaseCard, IFreeAction } from '@seti/common/types/BaseCard';
import type { EResource, ESector } from '@seti/common/types/element';
import type { ETechId } from '@seti/common/types/tech';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import type { EMissionType, IMissionDef } from '../missions/IMission.js';
import type { IPlayer } from '../player/IPlayer.js';
import type { IBehavior } from './Behavior.js';
import type { ICardRequirements } from './Requirements.js';

export enum EServerCardKind {
  IMMEDIATE = 'IMMEDIATE',
  MISSION = 'MISSION',
  END_GAME = 'END_GAME',
  ALIEN = 'ALIEN',
}

export interface ICardRuntimeContext {
  game: IGame;
  player: IPlayer;
}

export interface ICard extends IBaseCard {
  readonly kind: EServerCardKind;
  readonly behavior: IBehavior;
  readonly requirements: ICardRequirements;

  canPlay(context: ICardRuntimeContext): boolean;
  play(context: ICardRuntimeContext): IPlayerInput | undefined;
  getMissionDef?(): IMissionDef | undefined;
  getMissionType(): EMissionType | undefined;
}

export interface IBaseGameCard extends ICard {
  readonly kind: EServerCardKind.IMMEDIATE;
}

export interface IMissionCard extends ICard {
  readonly kind: EServerCardKind.MISSION;
}

export interface IEndGameScoringCard extends ICard {
  readonly kind: EServerCardKind.END_GAME;
}

export interface IAlienCard extends ICard {
  readonly kind: EServerCardKind.ALIEN;
}

export interface ICardDataProjection {
  id: string;
  name: string;
  freeAction?: IFreeAction[];
  sector?: ESector;
  price: number;
  priceType?: EResource;
  income: EResource;
}

export interface ICardOwnershipState {
  ownerId: string;
  playedAtRound: number;
  completedAtRound?: number;
  triggerSlots?: number[];
  endGameScore?: number;
  grantedTechIds?: ETechId[];
}
