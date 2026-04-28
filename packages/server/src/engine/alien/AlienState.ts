import { getAlienRewardsForIndex } from '@seti/common/constant/alienBoardConfig';
import { alienCards } from '@seti/common/data/alienCards';
import { EAlienType, ETrace } from '@seti/common/types/protocol/enums';
import {
  createActionEvent,
  createTraceMarkedEvent,
} from '../event/GameEvent.js';
import type { IGame } from '../IGame.js';
import type { PlayerInput } from '../input/PlayerInput.js';
import { SelectOption } from '../input/SelectOption.js';
import type { IPlayer } from '../player/IPlayer.js';
import {
  AlienBoard,
  createAlienBoard,
  type ITraceSlot,
  type ITraceSlotInit,
  type TAlienBoardInit,
  type TSlotReward,
  type TTracePlayerRef,
} from './AlienBoard.js';
import { AlienRegistry } from './AlienRegistry.js';
import { executeSimpleSlotReward } from './AlienRewards.js';

// ---------------------------------------------------------------------------
//  Base-game slot factory
// ---------------------------------------------------------------------------

function createBaseSlotGroups(alienIndex: number): {
  discoverySlots: ITraceSlotInit[];
  overflowSlots: ITraceSlotInit[];
} {
  const discoveryColors: ETrace[] = [ETrace.RED, ETrace.YELLOW, ETrace.BLUE];
  const rewardConfig = getAlienRewardsForIndex(alienIndex);

  const discovery: ITraceSlotInit[] = discoveryColors.map((color) => ({
    slotId: `alien-${alienIndex}-discovery-${color}`,
    alienIndex,
    traceColor: color,
    maxOccupants: 1,
    rewards: rewardConfig.discoveryRewards.map((r) => ({ ...r })),
    isDiscovery: true,
  }));

  const overflow: ITraceSlotInit[] = discoveryColors.map((color) => ({
    slotId: `alien-${alienIndex}-overflow-${color}`,
    alienIndex,
    traceColor: color,
    maxOccupants: -1,
    rewards: rewardConfig.overflowRewards.map((r) => ({ ...r })),
    isDiscovery: false,
  }));

  return {
    discoverySlots: discovery,
    overflowSlots: overflow,
  };
}

// ---------------------------------------------------------------------------
//  Trace target (for UI / SelectOption)
// ---------------------------------------------------------------------------

export interface ITraceTarget {
  optionId: string;
  slotId: string;
  alienIndex: number;
  traceColor: ETrace;
  label: string;
}

export type TSingleAlienTraceScope =
  | AlienBoard
  | number
  | { alienIndex: number }
  | { alienType: EAlienType };

export type TAlienTraceScope =
  | TSingleAlienTraceScope
  | 'both'
  | 'all'
  | readonly TSingleAlienTraceScope[];

export interface ICreateTraceInputOptions {
  alien?: TAlienTraceScope;
  onComplete?: () => PlayerInput | undefined;
}

// ---------------------------------------------------------------------------
//  AlienState — manages all alien boards
// ---------------------------------------------------------------------------

export interface IAlienStateInit {
  aliens: TAlienBoardInit[];
}

export class AlienState {
  public readonly boards: AlienBoard[];

  public constructor(init: IAlienStateInit) {
    this.boards = init.aliens.map((alienInit) => createAlienBoard(alienInit));
  }

  public static createFromHiddenAliens(hiddenAliens: EAlienType[]): AlienState {
    return new AlienState({
      aliens: hiddenAliens.map((alienType, index) => ({
        alienType,
        alienIndex: index,
        ...createBaseSlotGroups(index),
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

  // ---- Trace counts --------------------------------------------------------

  public getPlayerTraceCount(
    player: TTracePlayerRef,
    traceColor: ETrace = ETrace.ANY,
    alien: TAlienTraceScope = 'both',
  ): number {
    return this.resolveTraceBoards(alien).reduce(
      (total, board) => total + board.getPlayerTraceCount(player, traceColor),
      0,
    );
  }

  // ---- Available targets ---------------------------------------------------

  public getAvailableTargets(
    traceColor: ETrace,
    alien: TAlienTraceScope = 'both',
  ): ITraceTarget[] {
    if (traceColor === ETrace.ANY) {
      return [ETrace.RED, ETrace.YELLOW, ETrace.BLUE].flatMap((color) =>
        this.getAvailableTargets(color, alien),
      );
    }

    const targets: ITraceTarget[] = [];
    for (const board of this.resolveTraceBoards(alien)) {
      for (const slot of board.getAvailableSlots(traceColor)) {
        targets.push({
          optionId: slot.slotId,
          slotId: slot.slotId,
          alienIndex: board.alienIndex,
          traceColor,
          label: this.buildSlotLabel(board, slot, traceColor),
        });
      }
    }
    return targets;
  }

  // ---- Trace input chain ---------------------------------------------------

  /**
   * Creates a PlayerInput chain for marking a trace.
   * If traceColor is ANY, the slot options include every legal concrete color.
   */
  public createTraceInput(
    player: IPlayer,
    game: IGame,
    traceColor: ETrace,
    options: ICreateTraceInputOptions = {},
  ): PlayerInput | undefined {
    return this.createSlotSelectionInput(
      player,
      game,
      traceColor,
      options.onComplete,
      options.alien,
    );
  }

  public promptForTraceChoice(
    player: IPlayer,
    game: IGame,
    traceColor: ETrace,
    onComplete?: () => PlayerInput | undefined,
  ): void {
    const input = this.createTraceInput(player, game, traceColor, {
      onComplete,
    });
    if (input) {
      player.waitingFor = input;
    }
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
    const result = this.applyTraceToSlotInternal(
      player,
      game,
      slotId,
      traceColor,
    );
    return result !== false;
  }

  public createDrawAlienCardInput(
    player: IPlayer,
    game: IGame,
    options?: {
      alienType?: EAlienType;
      defaultAlienType?: EAlienType;
    },
    onComplete?: () => PlayerInput | undefined,
  ): PlayerInput | undefined {
    const targetBoard =
      options?.alienType !== undefined
        ? this.getBoardByType(options.alienType)
        : undefined;

    if (targetBoard) {
      return this.createDrawAlienSourceInput(
        player,
        game,
        targetBoard,
        onComplete,
      );
    }

    const drawableBoards = this.getDrawableAlienBoards();
    if (drawableBoards.length === 0) {
      return undefined;
    }

    if (options?.defaultAlienType !== undefined) {
      const preferred = drawableBoards.find(
        (board) => board.alienType === options.defaultAlienType,
      );
      if (preferred) {
        return this.createDrawAlienSourceInput(
          player,
          game,
          preferred,
          onComplete,
        );
      }
    }

    if (drawableBoards.length === 1) {
      return this.createDrawAlienSourceInput(
        player,
        game,
        drawableBoards[0],
        onComplete,
      );
    }

    return new SelectOption(
      player,
      drawableBoards.map((board) => ({
        id: `alien:${board.alienType}`,
        label: `${formatAlienType(board.alienType)} (Alien ${board.alienIndex + 1})`,
        onSelect: () =>
          this.createDrawAlienSourceInput(player, game, board, onComplete),
      })),
      'Choose alien board to draw from',
    );
  }

  private applyTraceToSlotInternal(
    player: IPlayer,
    game: IGame,
    slotId: string,
    traceColor: ETrace,
    onComplete?: () => PlayerInput | undefined,
  ): PlayerInput | false | undefined {
    const { board, slot } = this.findSlot(slotId);
    if (!board || !slot) return false;
    const plugin = AlienRegistry.get(board.alienType);

    if (traceColor === ETrace.ANY) {
      return false;
    }
    if (
      !board
        .getAvailableSlots(traceColor)
        .some((candidate) => candidate.slotId === slot.slotId)
    ) {
      return false;
    }
    const resolvedColor = traceColor;
    if (plugin?.canPlaceTraceOnSlot?.(game, player, slot) === false) {
      return false;
    }

    const placed = board.placeTrace(
      slot,
      { playerId: player.id },
      resolvedColor,
    );
    if (!placed) return false;
    plugin?.onPlaceTraceOnSlot?.(game, player, slot);

    const rewardInput = this.executeRewards(
      player,
      game,
      board,
      slot.rewards,
      onComplete,
    );
    this.incrementPlayerTrace(player, resolvedColor, board.alienIndex);
    game.eventLog.append(
      createTraceMarkedEvent(
        player.id,
        resolvedColor,
        board.alienIndex,
        !slot.isDiscovery,
      ),
    );

    plugin?.onTraceMark?.(game, player, resolvedColor, !slot.isDiscovery);

    if (rewardInput !== undefined) {
      return rewardInput;
    }

    return onComplete?.();
  }

  // ---- Neutral markers -----------------------------------------------------

  /**
   * True if at least one discovery slot (non-overflow) is empty on any alien board.
   */
  public hasEmptyDiscoverySlot(): boolean {
    for (const board of this.boards) {
      if (board.getFirstEmptyDiscoverySlot()) {
        return true;
      }
    }
    return false;
  }

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
    this.initializeAlienDeck(board, game, plugin);
    this.resolveDiscoverySlots(board, game, plugin);
    board.revealNextFaceUpAlienCard(game.random);

    if (plugin) {
      const discovererIds = board.getDiscoverers();
      const discoverers = game.players.filter((p) =>
        discovererIds.includes(p.id),
      );
      return plugin.onDiscover(game, discoverers);
    }

    return undefined;
  }

  public drawAlienCard(
    player: IPlayer,
    board: AlienBoard,
    source: 'face-up' | 'deck',
    game?: IGame,
  ): string | undefined {
    const drawnCardId =
      source === 'face-up'
        ? board.drawFaceUpAlienCard(game?.random)
        : board.drawAlienCardFromDeck(game?.random);

    if (!drawnCardId) {
      return undefined;
    }

    player.hand.push(drawnCardId);
    if (game) {
      game.lockCurrentTurn();
      game.eventLog.append(
        createActionEvent(player.id, 'DRAW_ALIEN_CARD', {
          alienType: board.alienType,
          source,
          cardId: drawnCardId,
          alienIndex: board.alienIndex,
        }),
      );
    }
    return drawnCardId;
  }

  // ---- Plugin event dispatch ----------------------------------------------

  public onSolarSystemRotated(game: IGame): void {
    for (const board of this.boards) {
      if (!board.discovered) continue;
      const plugin = AlienRegistry.get(board.alienType);
      plugin?.onSolarSystemRotated?.(game);
    }
  }

  // ---- Private: input builders ---------------------------------------------

  private createSlotSelectionInput(
    player: IPlayer,
    game: IGame,
    traceColor: ETrace,
    onComplete?: () => PlayerInput | undefined,
    alien: TAlienTraceScope = 'both',
  ): PlayerInput | undefined {
    const targets = this.getAvailableTargets(traceColor, alien).filter(
      (target) => {
        const { board, slot } = this.findSlot(target.slotId);
        if (!board || !slot) return false;
        const plugin = AlienRegistry.get(board.alienType);
        return plugin?.canPlaceTraceOnSlot?.(game, player, slot) !== false;
      },
    );
    if (targets.length === 0) {
      return onComplete?.();
    }

    if (targets.length === 1) {
      const nextInput = this.applyTraceToSlotInternal(
        player,
        game,
        targets[0].slotId,
        targets[0].traceColor,
        onComplete,
      );
      if (nextInput === false) {
        return onComplete?.();
      }
      return nextInput;
    }

    return new SelectOption(
      player,
      targets.map((target) => ({
        id: target.optionId,
        label: target.label,
        onSelect: () => {
          const nextInput = this.applyTraceToSlotInternal(
            player,
            game,
            target.slotId,
            target.traceColor,
            onComplete,
          );
          if (nextInput === false) {
            return onComplete?.();
          }
          return nextInput;
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

  private executeRewards(
    player: IPlayer,
    game: IGame,
    board: AlienBoard,
    rewards: TSlotReward[],
    onComplete?: () => PlayerInput | undefined,
  ): PlayerInput | undefined {
    for (const reward of rewards) {
      if (executeSimpleSlotReward(player, game, reward)) {
        continue;
      }

      switch (reward.type) {
        case 'CUSTOM':
          if (reward.effectId === 'DRAW_ALIEN_CARD') {
            return this.createDrawAlienCardInput(
              player,
              game,
              {
                alienType: board.alienType,
              },
              onComplete,
            );
          }
          if (reward.effectId === 'GAIN_EXOFOSSIL') {
            player.gainExofossils(1);
          }
          break;
      }
    }
    return undefined;
  }

  private getDrawableAlienBoards(): AlienBoard[] {
    return this.boards.filter(
      (board) =>
        board.discovered &&
        (board.faceUpAlienCardId !== null ||
          board.alienDeckDrawPile.length > 0 ||
          board.alienDeckDiscardPile.length > 0),
    );
  }

  private createDrawAlienSourceInput(
    player: IPlayer,
    game: IGame,
    board: AlienBoard,
    onComplete?: () => PlayerInput | undefined,
  ): PlayerInput | undefined {
    const hasFaceUp = board.faceUpAlienCardId !== null;
    const hasDeck =
      board.alienDeckDrawPile.length > 0 ||
      board.alienDeckDiscardPile.length > 0;
    if (!hasFaceUp && !hasDeck) {
      return undefined;
    }

    if (hasFaceUp && !hasDeck) {
      this.drawAlienCard(player, board, 'face-up', game);
      return onComplete?.();
    }

    if (!hasFaceUp && hasDeck) {
      this.drawAlienCard(player, board, 'deck', game);
      return onComplete?.();
    }

    return new SelectOption(
      player,
      [
        {
          id: 'draw-face-up',
          label: 'Draw face-up alien card',
          onSelect: () => {
            this.drawAlienCard(player, board, 'face-up', game);
            return onComplete?.();
          },
        },
        {
          id: 'draw-random',
          label: 'Draw random alien card',
          onSelect: () => {
            this.drawAlienCard(player, board, 'deck', game);
            return onComplete?.();
          },
        },
      ],
      `Choose how to draw from ${formatAlienType(board.alienType)}`,
    );
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
    if (vpReward && 'amount' in vpReward) {
      return `${alienLabel} — Overflow (${formatTraceColor(traceColor)}, +${vpReward.amount} VP)`;
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

  private resolveTraceBoards(alien: TAlienTraceScope): AlienBoard[] {
    if (alien === 'both' || alien === 'all') {
      return this.boards;
    }

    if (isAlienTraceScopeList(alien)) {
      const boards = alien.flatMap((scope) => this.resolveTraceBoards(scope));
      return [...new Set(boards)];
    }

    if (alien instanceof AlienBoard) {
      return this.boards.includes(alien) ? [alien] : [];
    }

    if (typeof alien === 'number') {
      const board = this.getBoard(alien);
      return board ? [board] : [];
    }

    if ('alienIndex' in alien) {
      const board = this.getBoard(alien.alienIndex);
      return board ? [board] : [];
    }

    return this.boards.filter((board) => board.alienType === alien.alienType);
  }

  private initializeAlienDeck(
    board: AlienBoard,
    game: IGame,
    plugin: ReturnType<typeof AlienRegistry.get>,
  ): void {
    if (
      board.alienDeckDrawPile.length > 0 ||
      board.faceUpAlienCardId !== null
    ) {
      return;
    }

    const pluginDeck = plugin?.getAlienDeckCardIds?.(game, board) ?? [];
    const candidateDeck =
      pluginDeck.length > 0
        ? pluginDeck
        : alienCards
            .filter((card) => card.alien === board.alienType)
            .map((card) => card.id);
    const shuffled = game.random.shuffle([...candidateDeck]);
    board.initializeAlienDeck(shuffled);
  }

  private resolveDiscoverySlots(
    board: AlienBoard,
    game: IGame,
    plugin: ReturnType<typeof AlienRegistry.get>,
  ): void {
    for (const slot of board.getDiscoverySlots()) {
      for (const occ of slot.occupants) {
        const source = occ.source;
        if (source === 'neutral') {
          continue;
        }

        const player = game.players.find((p) => p.id === source.playerId);
        if (!player) {
          continue;
        }

        if (plugin?.resolveDiscoverySlot) {
          plugin.resolveDiscoverySlot(game, board, slot, player);
          continue;
        }

        this.drawAlienCard(player, board, 'deck');
      }
    }
  }
}

function formatAlienType(alienType: EAlienType): string {
  switch (alienType) {
    case EAlienType.ANOMALIES:
      return 'Anomalies';
    case EAlienType.CENTAURIANS:
      return 'Centaurians';
    case EAlienType.EXERTIANS:
      return 'Exertians';
    case EAlienType.MASCAMITES:
      return 'Mascamites';
    case EAlienType.OUMUAMUA:
      return 'Oumuamua';
    case EAlienType.AMOEBA:
      return 'Amoeba';
    case EAlienType.GLYPHIDS:
      return 'Glyphids';
    case EAlienType.DUMMY:
      return 'Dummy';
    default:
      return String(alienType);
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

function isAlienTraceScopeList(
  alien: TAlienTraceScope,
): alien is readonly TSingleAlienTraceScope[] {
  return Array.isArray(alien);
}
