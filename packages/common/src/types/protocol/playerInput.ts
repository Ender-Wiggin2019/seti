import type { TMascamitesSampleTokenId } from '@seti/common/constant/mascamites';
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

export enum EPlayerInputPresentationMode {
  DIALOG_ONLY = 'dialogOnly',
  IN_GAME_INTERACTIVE = 'inGameInteractive',
  DIALOG_AND_IN_GAME = 'dialogAndInGame',
}

export enum ESetupChoiceStepKind {
  ORGANIZATION = 'organization',
  QUICK_START_CARDS = 'quickStartCards',
  MAIN_DECK_PREVIEW = 'mainDeckPreview',
}

export interface ISetupChoiceCandidate {
  id: string;
  label: string;
  canChoose: boolean;
  disabledReason?: string;
}

export interface ISetupChoiceStepContext {
  kind: ESetupChoiceStepKind;
  title: string;
  minSelections: number;
  maxSelections: number;
  candidates: ISetupChoiceCandidate[];
  selectedIds: string[];
  completed: boolean;
}

export interface ISetupChoiceContext {
  currentStepIndex: number;
  steps: ISetupChoiceStepContext[];
  completed: boolean;
}

export interface ISetupChoiceInputMetadata {
  kind: ESetupChoiceStepKind;
  stepIndex: number;
  totalSteps: number;
  minSelections: number;
  maxSelections: number;
}

export interface ISetupTuckProgressMetadata {
  current: number;
  total: number;
}

export interface IPlayerInputModelBase {
  inputId: string;
  type: EPlayerInputType;
  title?: string;
  description?: string;
  presentationMode?: EPlayerInputPresentationMode;
  setupChoice?: ISetupChoiceInputMetadata;
  setupTuckProgress?: ISetupTuckProgressMetadata;
}

export interface ISelectOptionInputModel extends IPlayerInputModelBase {
  type: EPlayerInputType.OPTION;
  options: Array<{
    id: string;
    label: string;
    cardId?: string;
    sampleTokenId?: TMascamitesSampleTokenId;
    sampleFaceDown?: boolean;
  }>;
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
