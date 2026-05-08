import type {
  TRivalActionCardId,
  TRivalBoardConfigId,
  TRivalObjectiveId,
  TRivalObjectiveTaskMarkers,
  TSoloDifficulty,
} from '@seti/common/types/protocol/solo';
import { Deck } from '@/engine/deck/Deck.js';

export interface IRivalComputerState {
  filledSlots: boolean[];
  dataPool: number;
}

export interface IRivalStateInit {
  rivalPlayerId: string;
  difficulty: TSoloDifficulty;
  progress: number;
  progressSlot: number;
  boardConfigId: TRivalBoardConfigId;
  actionDeck: readonly TRivalActionCardId[];
  actionDiscardPile?: readonly TRivalActionCardId[];
  advancedReserve: readonly TRivalActionCardId[];
  removedActionCardIds?: readonly TRivalActionCardId[];
  usedActionCardIdsThisRound?: readonly TRivalActionCardId[];
  computer?: IRivalComputerState;
  objectiveDrawPile?: readonly TRivalObjectiveId[];
  revealedObjectiveIds?: readonly TRivalObjectiveId[];
  completedObjectiveIds?: readonly TRivalObjectiveId[];
  objectiveTaskMarkers?: TRivalObjectiveTaskMarkers;
  currentActionCardId?: TRivalActionCardId | null;
}

export class RivalState {
  public readonly rivalPlayerId: string;

  public readonly difficulty: TSoloDifficulty;

  public progress: number;

  public progressSlot: number;

  public readonly boardConfigId: TRivalBoardConfigId;

  public actionDeck: Deck<TRivalActionCardId>;

  public advancedReserve: Deck<TRivalActionCardId>;

  public removedActionCardIds: TRivalActionCardId[];

  public usedActionCardIdsThisRound: TRivalActionCardId[];

  public computer: IRivalComputerState;

  public objectiveDrawPile: TRivalObjectiveId[];

  public revealedObjectiveIds: TRivalObjectiveId[];

  public completedObjectiveIds: TRivalObjectiveId[];

  public objectiveTaskMarkers: TRivalObjectiveTaskMarkers;

  public currentActionCardId: TRivalActionCardId | null;

  public constructor(init: IRivalStateInit) {
    this.rivalPlayerId = init.rivalPlayerId;
    this.difficulty = init.difficulty;
    this.progress = init.progress;
    this.progressSlot = init.progressSlot;
    this.boardConfigId = init.boardConfigId;
    this.actionDeck = new Deck(init.actionDeck, init.actionDiscardPile ?? []);
    this.advancedReserve = new Deck(init.advancedReserve);
    this.removedActionCardIds = [...(init.removedActionCardIds ?? [])];
    this.usedActionCardIdsThisRound = [
      ...(init.usedActionCardIdsThisRound ?? []),
    ];
    this.computer = init.computer ?? {
      filledSlots: [false, false, false, false, false, false],
      dataPool: 0,
    };
    this.objectiveDrawPile = [...(init.objectiveDrawPile ?? [])];
    this.revealedObjectiveIds = [...(init.revealedObjectiveIds ?? [])];
    this.completedObjectiveIds = [...(init.completedObjectiveIds ?? [])];
    this.objectiveTaskMarkers = Object.fromEntries(
      Object.entries(init.objectiveTaskMarkers ?? {}).map(([id, markers]) => [
        id,
        [...(markers ?? [])],
      ]),
    ) as TRivalObjectiveTaskMarkers;
    this.currentActionCardId = init.currentActionCardId ?? null;
  }
}
