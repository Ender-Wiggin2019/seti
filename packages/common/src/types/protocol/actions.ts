import { EResource, ESector } from '@seti/common/types/element';
import {
  EFreeAction,
  EMainAction,
  EPlanet,
  ETech,
  ETrace,
} from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';

export interface IMainActionRequest {
  type: EMainAction;
  payload?: Record<string, unknown>;
}

export type TMovementTarget =
  | { type: 'probe'; id: string }
  | { type: 'mascamites-capsule'; id: string };

export interface IMovementFreeActionRequest {
  type: EFreeAction.MOVEMENT;
  /** Ordered space IDs: [probeCurrentSpace, step1, step2, ...]. At least 2 elements. */
  path: string[];
  /** Explicit board piece to move. Omitted keeps the legacy "probe at path[0]" behavior. */
  target?: TMovementTarget;
  /** @deprecated Use target: { type: 'mascamites-capsule', id } instead. */
  capsuleId?: string;
}

export interface IConvertEnergyToMovementFreeActionRequest {
  type: EFreeAction.CONVERT_ENERGY_TO_MOVEMENT;
  amount: number;
}

export interface IPlaceDataFreeActionRequest {
  type: EFreeAction.PLACE_DATA;
  slotIndex: number;
}

export interface ICompleteMissionFreeActionRequest {
  type: EFreeAction.COMPLETE_MISSION;
  cardId: string;
  branchIndex?: number;
}

export interface IDeliverSampleFreeActionRequest {
  type: EFreeAction.DELIVER_SAMPLE;
  capsuleId: string;
  cardId: string;
  branchIndex?: number;
}

export interface IUseCardCornerFreeActionRequest {
  type: EFreeAction.USE_CARD_CORNER;
  cardId: string;
}

export interface IBuyCardFreeActionRequest {
  type: EFreeAction.BUY_CARD;
  cardId?: string;
  fromDeck?: boolean;
}

export interface IExchangeResourcesFreeActionRequest {
  type: EFreeAction.EXCHANGE_RESOURCES;
  from: EResource;
  to: EResource;
  /**
   * When exchanging into a card: `true` = draw from deck (after reshuffle if needed);
   * `false` / omitted with a non-empty card row = take from card row (leftmost, or
   * `cardId` if set), then refill from deck like Buy Card.
   */
  fromDeck?: boolean;
  /** When taking from the card row, optional specific card id. */
  cardId?: string;
}

export interface ISpendSignalTokenFreeActionRequest {
  type: EFreeAction.SPEND_SIGNAL_TOKEN;
}

export type IFreeActionRequest =
  | IMovementFreeActionRequest
  | IConvertEnergyToMovementFreeActionRequest
  | IPlaceDataFreeActionRequest
  | ICompleteMissionFreeActionRequest
  | IDeliverSampleFreeActionRequest
  | IUseCardCornerFreeActionRequest
  | IBuyCardFreeActionRequest
  | IExchangeResourcesFreeActionRequest
  | ISpendSignalTokenFreeActionRequest;

export interface IOptionInputResponse {
  type: EPlayerInputType.OPTION;
  optionId: string;
}

export interface ICardInputResponse {
  type: EPlayerInputType.CARD;
  cardIds: string[];
}

export interface ISectorInputResponse {
  type: EPlayerInputType.SECTOR;
  sector: ESector;
}

export interface IPlanetInputResponse {
  type: EPlayerInputType.PLANET;
  planet: EPlanet;
}

export interface ITechInputResponse {
  type: EPlayerInputType.TECH;
  tech: ETech;
}

export interface IGoldTileInputResponse {
  type: EPlayerInputType.GOLD_TILE;
  tileId: string;
}

export interface IResourceInputResponse {
  type: EPlayerInputType.RESOURCE;
  resource: EResource;
}

export interface ITraceInputResponse {
  type: EPlayerInputType.TRACE;
  trace: ETrace;
}

export interface IEndOfRoundInputResponse {
  type: EPlayerInputType.END_OF_ROUND;
  cardId: string;
}

export interface IOrInputResponse {
  type: EPlayerInputType.OR;
  index: number;
  response: IInputResponse;
}

export interface IAndInputResponse {
  type: EPlayerInputType.AND;
  responses: IInputResponse[];
}

export type IInputResponse =
  | IOptionInputResponse
  | ICardInputResponse
  | ISectorInputResponse
  | IPlanetInputResponse
  | ITechInputResponse
  | IGoldTileInputResponse
  | IResourceInputResponse
  | ITraceInputResponse
  | IEndOfRoundInputResponse
  | IOrInputResponse
  | IAndInputResponse;
