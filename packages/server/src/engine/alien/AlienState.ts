import { EAlienType, ETrace } from '@seti/common/types/protocol/enums';
import { createTraceMarkedEvent } from '../event/GameEvent.js';
import type { IGame } from '../IGame.js';
import type { PlayerInput } from '../input/PlayerInput.js';
import { SelectOption } from '../input/SelectOption.js';
import { SelectTrace } from '../input/SelectTrace.js';
import type { IPlayer } from '../player/IPlayer.js';
import {
  AlienBoard,
  type IAlienBoardInit,
  type ITraceSlot,
  type ITraceSlotInit,
  type TSlotReward,
} from './AlienBoard.js';
import { AlienRegistry } from './AlienRegistry.js';

// ---------------------------------------------------------------------------
//  Base-game slot factory
// ---------------------------------------------------------------------------

const OVERFLOW_VP = 3;

function createBaseSlots(alienIndex: number): ITraceSlotInit[] {
  const discoveryColors: ETrace[] = [ETrace.RED, ETrace.YELLOW, ETrace.BLUE];

  const discovery: ITraceSlotInit[] = discoveryColors.map((color) => ({
    slotId: `alien-${alienIndex}-discovery-${color}`,
    alienIndex,
    traceColor: color,
    maxOccupants: 1,
    rewards: [],
    isDiscovery: true,
  }));

  const overflow: ITraceSlotInit = {
    slotId: `alien-${alienIndex}-overflow`,
    alienIndex,
    traceColor: ETrace.ANY,
    maxOccupants: -1,
    rewards: [{ type: 'VP', amount: OVERFLOW_VP }],
    isDiscovery: false,
  };

  return [...discovery, overflow];
}

// ---------------------------------------------------------------------------
//  Trace target (for UI / SelectOption)
// ---------------------------------------------------------------------------

export interface ITraceTarget {
  slotId: string;
  alienIndex: number;
  label: string;
}

// ---------------------------------------------------------------------------
//  AlienState — manages all alien boards
// ---------------------------------------------------------------------------

export interface IAlienStateInit {
  aliens: IAlienBoardInit[];
}

export class AlienState {
  public readonly boards: AlienBoard[];

  public constructor(init: IAlienStateInit) {
    this.boards = init.aliens.map((alienInit) => new AlienBoard(alienInit));
  }

  public static createFromHiddenAliens(hiddenAliens: EAlienType[]): AlienState {
    return new AlienState({
      aliens: hiddenAliens.map((alienType, index) => ({
        alienType,
        alienIndex: index,
        slots: createBaseSlots(index),
      })),
    });
  }

  // ---- Board lookup --------------------------------------------------------

  public getBoard(alienIndex: number): AlienBoard | undefined {
    return this.boards[alienIndex];
  }

  public getBoardByType(alienType: EAlienType): AlienBoard | undefined {
    return this.boards.find((b) => b.alienType === alienType);
  }

  // ---- Available targets ---------------------------------------------------

  public getAvailableTargets(traceColor: ETrace): ITraceTarget[] {
    const targets: ITraceTarget[] = [];
    for (const board of this.boards) {
      for (const slot of board.getAvailableSlots(traceColor)) {
        targets.push({
          slotId: slot.slotId,
          alienIndex: board.alienIndex,
          label: this.buildSlotLabel(board, slot, traceColor),
        });
      }
    }
    return targets;
  }

  // ---- Trace input chain ---------------------------------------------------

  /**
   * Creates a PlayerInput chain for marking a trace.
   * If traceColor is ANY, the player first picks a color, then picks the slot.
   */
  public createTraceInput(
    player: IPlayer,
    game: IGame,
    traceColor: ETrace,
    onComplete?: () => PlayerInput | undefined,
  ): PlayerInput | undefined {
    if (traceColor === ETrace.ANY) {
      return this.createColorSelectionInput(player, game, onComplete);
    }
    return this.createSlotSelectionInput(player, game, traceColor, onComplete);
  }

  // ---- Programmatic placement ----------------------------------------------

  /**
   * Places a trace on a specific slot. Returns false if slot is full.
   */
  public applyTraceToSlot(
    player: IPlayer,
    game: IGame,
    slotId: string,
    traceColor: ETrace,
  ): boolean {
    const { board, slot } = this.findSlot(slotId);
    if (!board || !slot) return false;

    const resolvedColor = traceColor === ETrace.ANY ? ETrace.RED : traceColor;

    const placed = board.placeTrace(
      slot,
      { playerId: player.id },
      resolvedColor,
    );
    if (!placed) return false;

    this.executeRewards(player, slot.rewards);
    this.incrementPlayerTrace(player, resolvedColor, board.alienIndex);
    game.eventLog.append(
      createTraceMarkedEvent(
        player.id,
        resolvedColor,
        board.alienIndex,
        !slot.isDiscovery,
      ),
    );

    const plugin = AlienRegistry.get(board.alienType);
    plugin?.onTraceMark?.(game, player, resolvedColor, !slot.isDiscovery);

    return true;
  }

  /**
   * Legacy convenience: place on the first matching slot of a given alien.
   * Chooses the first available discovery slot, falling back to overflow.
   */
  public applyTrace(
    player: IPlayer,
    game: IGame,
    traceColor: ETrace,
    alienIndex: number,
    forceOverflow: boolean,
  ): void {
    const board = this.boards[alienIndex];
    if (!board) return;

    const resolvedColor = traceColor === ETrace.ANY ? ETrace.RED : traceColor;
    const available = board.getAvailableSlots(resolvedColor);

    let target: ITraceSlot | undefined;
    if (!forceOverflow) {
      target = available.find((s) => s.isDiscovery);
    }
    target ??= available.find((s) => !s.isDiscovery);
    if (!target) return;

    this.applyTraceToSlot(player, game, target.slotId, resolvedColor);
  }

  // ---- Neutral markers -----------------------------------------------------

  /**
   * Places a neutral marker on the leftmost empty discovery slot across all aliens.
   */
  public placeNeutralMarker(): {
    alienIndex: number;
    slotId: string;
    traceColor: ETrace;
  } | null {
    for (const board of this.boards) {
      const slot = board.getFirstEmptyDiscoverySlot();
      if (slot) {
        board.placeTrace(slot, 'neutral', slot.traceColor);
        return {
          alienIndex: board.alienIndex,
          slotId: slot.slotId,
          traceColor: slot.traceColor,
        };
      }
    }
    return null;
  }

  // ---- Discovery -----------------------------------------------------------

  public getNewlyDiscoverableAliens(): AlienBoard[] {
    return this.boards.filter(
      (board) => !board.discovered && board.isFullyMarked(),
    );
  }

  public discoverAlien(
    board: AlienBoard,
    game: IGame,
  ): PlayerInput | undefined {
    board.discovered = true;

    const plugin = AlienRegistry.get(board.alienType);
    if (plugin) {
      const discovererIds = board.getDiscoverers();
      const discoverers = game.players.filter((p) =>
        discovererIds.includes(p.id),
      );
      return plugin.onDiscover(game, discoverers);
    }

    return undefined;
  }

  // ---- Private: input builders ---------------------------------------------

  private createColorSelectionInput(
    player: IPlayer,
    game: IGame,
    onComplete?: () => PlayerInput | undefined,
  ): PlayerInput | undefined {
    return new SelectTrace(
      player,
      [ETrace.RED, ETrace.YELLOW, ETrace.BLUE],
      (selectedColor) =>
        this.createSlotSelectionInput(player, game, selectedColor, onComplete),
      'Choose trace color',
    );
  }

  private createSlotSelectionInput(
    player: IPlayer,
    game: IGame,
    traceColor: ETrace,
    onComplete?: () => PlayerInput | undefined,
  ): PlayerInput | undefined {
    const targets = this.getAvailableTargets(traceColor);
    if (targets.length === 0) {
      return onComplete?.();
    }

    if (targets.length === 1) {
      this.applyTraceToSlot(player, game, targets[0].slotId, traceColor);
      return onComplete?.();
    }

    return new SelectOption(
      player,
      targets.map((target) => ({
        id: target.slotId,
        label: target.label,
        onSelect: () => {
          this.applyTraceToSlot(player, game, target.slotId, traceColor);
          return onComplete?.();
        },
      })),
      `Place ${formatTraceColor(traceColor)} trace`,
    );
  }

  // ---- Private: helpers ----------------------------------------------------

  private findSlot(slotId: string): {
    board: AlienBoard | undefined;
    slot: ITraceSlot | undefined;
  } {
    for (const board of this.boards) {
      const slot = board.getSlot(slotId);
      if (slot) return { board, slot };
    }
    return { board: undefined, slot: undefined };
  }

  private executeRewards(player: IPlayer, rewards: TSlotReward[]): void {
    for (const reward of rewards) {
      switch (reward.type) {
        case 'VP':
          player.score += reward.amount;
          break;
        case 'CUSTOM':
          break;
      }
    }
  }

  private buildSlotLabel(
    board: AlienBoard,
    slot: ITraceSlot,
    traceColor: ETrace,
  ): string {
    const alienLabel = `Alien ${board.alienIndex + 1}`;
    if (slot.isDiscovery) {
      return `${alienLabel} — Discovery (${formatTraceColor(traceColor)})`;
    }
    const vpReward = slot.rewards.find((r) => r.type === 'VP');
    if (vpReward) {
      return `${alienLabel} — Overflow (+${vpReward.amount} VP)`;
    }
    return `${alienLabel} — ${slot.slotId}`;
  }

  private incrementPlayerTrace(
    player: IPlayer,
    traceColor: ETrace,
    alienIndex: number,
  ): void {
    player.traces[traceColor] = (player.traces[traceColor] ?? 0) + 1;

    if (!player.tracesByAlien[alienIndex]) {
      player.tracesByAlien[alienIndex] = {};
    }
    player.tracesByAlien[alienIndex][traceColor] =
      (player.tracesByAlien[alienIndex][traceColor] ?? 0) + 1;
  }
}

function formatTraceColor(traceColor: ETrace): string {
  switch (traceColor) {
    case ETrace.RED:
      return 'Red';
    case ETrace.YELLOW:
      return 'Yellow';
    case ETrace.BLUE:
      return 'Blue';
    default:
      return 'Any';
  }
}
