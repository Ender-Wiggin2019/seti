import { IBaseCard } from '@seti/common/types/BaseCard';
import { EResource, ESector } from '@seti/common/types/element';
import { EPlanet, ETech, ETrace } from '@seti/common/types/protocol/enums';

export enum EPlayerInputType {
  OPTION = 'option',
  CARD = 'card',
  SECTOR = 'sector',
  PLANET = 'planet',
  TECH = 'tech',
  GOLD_TILE = 'goldTile',
  RESOURCE = 'resource',
  TRACE = 'trace',
  END_OF_ROUND = 'endOfRound',
  OR = 'or',
  AND = 'and',
}

export interface IPlayerInputModelBase {
  inputId: string;
  type: EPlayerInputType;
  title?: string;
  description?: string;
}

export interface ISelectOptionInputModel extends IPlayerInputModelBase {
  type: EPlayerInputType.OPTION;
  options: Array<{ id: string; label: string }>;
}

export interface ISelectCardInputModel extends IPlayerInputModelBase {
  type: EPlayerInputType.CARD;
  cards: IBaseCard[];
  minSelections: number;
  maxSelections: number;
}

export interface ISelectSectorInputModel extends IPlayerInputModelBase {
  type: EPlayerInputType.SECTOR;
  options: ESector[];
}

export interface ISelectPlanetInputModel extends IPlayerInputModelBase {
  type: EPlayerInputType.PLANET;
  options: EPlanet[];
}

export interface ISelectTechInputModel extends IPlayerInputModelBase {
  type: EPlayerInputType.TECH;
  options: ETech[];
}

export interface ISelectGoldTileInputModel extends IPlayerInputModelBase {
  type: EPlayerInputType.GOLD_TILE;
  options: string[];
}

export interface ISelectResourceInputModel extends IPlayerInputModelBase {
  type: EPlayerInputType.RESOURCE;
  options: EResource[];
}

export interface ISelectTraceInputModel extends IPlayerInputModelBase {
  type: EPlayerInputType.TRACE;
  options: ETrace[];
}

export interface ISelectEndOfRoundCardInputModel extends IPlayerInputModelBase {
  type: EPlayerInputType.END_OF_ROUND;
  cards: IBaseCard[];
}

export interface IOrOptionsInputModel extends IPlayerInputModelBase {
  type: EPlayerInputType.OR;
  options: IPlayerInputModel[];
}

export interface IAndOptionsInputModel extends IPlayerInputModelBase {
  type: EPlayerInputType.AND;
  options: IPlayerInputModel[];
}

export type IPlayerInputModel =
  | ISelectOptionInputModel
  | ISelectCardInputModel
  | ISelectSectorInputModel
  | ISelectPlanetInputModel
  | ISelectTechInputModel
  | ISelectGoldTileInputModel
  | ISelectResourceInputModel
  | ISelectTraceInputModel
  | ISelectEndOfRoundCardInputModel
  | IOrOptionsInputModel
  | IAndOptionsInputModel;
