import {
  getAlienRewardsForIndex,
  OUMUAMUA_TRACE_SLOT_PREFIX,
} from '@seti/common/constant/alienBoardConfig';
import { alienCards } from '@seti/common/data/alienCards';
import {
  EAlienType,
  type EPlanet,
  ETrace,
} from '@seti/common/types/protocol/enums';
import type { ETechId } from '@seti/common/types/tech';
import { AnyCardChoiceEffect } from '../effects/card/AnyCardChoiceEffect.js';
import {
  createActionEvent,
  createTraceMarkedEvent,
} from '../event/GameEvent.js';
import { EGameRuntimeEvent } from '../events/GameEventBus.js';
import type { IGame } from '../IGame.js';
import type { PlayerInput } from '../input/PlayerInput.js';
import { SelectOption } from '../input/SelectOption.js';
import { EMissionEventType } from '../missions/IMission.js';
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
  const discoveryColors: ETrace[] = [ETrace.PINK, ETrace.YELLOW, ETrace.BLUE];
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
      return [ETrace.PINK, ETrace.YELLOW, ETrace.BLUE].flatMap((color) =>
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
   * Places a trace on a specific slot.
   *
   * Returns `false` if the placement was rejected (slot full, illegal color,
   * etc). Returns a `PlayerInput` when the placement triggered a follow-up
   * choice (e.g. a CUSTOM `DRAW_ALIEN_CARD` reward needs the player to pick
   * face-up vs deck). Returns `true` for a placement that completed without
   * any pending input.
   *
   * Production callers (gateway, debug controller) should hand the returned
   * input to `player.waitingFor` so the choice round-trips to the client.
   * Tests that only care about the "did it land" outcome can keep using a
   * truthy check (`!== false`).
   */
  public applyTraceToSlot(
    player: IPlayer,
    game: IGame,
    slotId: string,
    traceColor: ETrace,
  ): PlayerInput | boolean {
    const result = this.applyTraceToSlotInternal(
      player,
      game,
      slotId,
      traceColor,
    );
    if (result === false) return false;
    if (result === undefined) return true;
    return result;
  }

  public placeSetupTrace(
    player: IPlayer,
    traceColor: ETrace,
    alienIndex: number,
  ): boolean {
    const board = this.getBoard(alienIndex);
    const slot = board?.getAvailableSlots(traceColor)[0];
    if (!board || !slot) return false;
    const placed = board.placeTrace(slot, { playerId: player.id }, traceColor);
    if (!placed) return false;
    this.incrementPlayerTrace(player, traceColor, board.alienIndex);
    return true;
  }

  public placeNeutralSetupTrace(
    traceColor: ETrace,
    alienIndex: number,
  ): boolean {
    const board = this.getBoard(alienIndex);
    const slot = board?.getAvailableSlots(traceColor)[0];
    if (!board || !slot) return false;
    return board.placeTrace(slot, 'neutral', traceColor);
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
    game.missionTracker?.recordEvent({
      type: EMissionEventType.TRACE_MARKED,
      traceColor: resolvedColor,
    });
    game.eventLog.append(
      createTraceMarkedEvent(
        player.id,
        resolvedColor,
        board.alienIndex,
        !slot.isDiscovery,
      ),
    );

    game.eventBus?.emit({
      type: EGameRuntimeEvent.TRACE_PLACED,
      game,
      player,
      traceColor: resolvedColor,
      alienIndex: board.alienIndex,
      alienType: board.alienType,
      slotId: slot.slotId,
      isOverflow: !slot.isDiscovery,
    });

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

  public onRoundEnd(game: IGame): void {
    for (const board of this.boards) {
      if (!board.discovered) continue;
      const plugin = AlienRegistry.get(board.alienType);
      plugin?.onRoundEnd?.(game);
    }
  }

  public onPlanetVisited(game: IGame, player: IPlayer, planet: EPlanet): void {
    for (const board of this.boards) {
      if (!board.discovered) continue;
      const plugin = AlienRegistry.get(board.alienType);
      plugin?.onPlanetVisited?.(game, player, planet);
    }
  }

  public onSectorWon(game: IGame, player: IPlayer, sectorId: string): void {
    for (const board of this.boards) {
      if (!board.discovered) continue;
      const plugin = AlienRegistry.get(board.alienType);
      plugin?.onSectorWon?.(game, player, sectorId);
    }
  }

  public onTechAcquired(game: IGame, player: IPlayer, techId: ETechId): void {
    for (const board of this.boards) {
      if (!board.discovered) continue;
      const plugin = AlienRegistry.get(board.alienType);
      plugin?.onTechAcquired?.(game, player, techId);
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

  /**
   * Apply a slot's rewards to a player. Simple rewards (VP, credits, etc.)
   * settle inline; the first `CUSTOM:DRAW_ALIEN_CARD` becomes a deferred
   * `PlayerInput` that the caller can either return up the call stack
   * (for action-pipeline contexts) or push onto the deferred queue (for
   * lifecycle-hook contexts like `onSolarSystemRotated`).
   *
   * Public so plugin lifecycle hooks (`onSolarSystemRotated`,
   * `onPassRotation`, etc.) can route their reward delivery through the
   * same code path as `applyTraceToSlotInternal` instead of the
   * fire-and-forget `executeSimpleSlotRewards` helper that silently
   * skips CUSTOM rewards.
   */
  public executeRewards(
    player: IPlayer,
    game: IGame,
    board: AlienBoard,
    rewards: TSlotReward[],
    onComplete?: () => PlayerInput | undefined,
  ): PlayerInput | undefined {
    // Two passes:
    //   1) apply every synchronous reward (simple effects + synchronous
    //      CUSTOMs like GAIN_EXOFOSSIL) so order-of-rewards in the slot
    //      data doesn't determine whether VPs survive.
    //   2) at most one async CUSTOM (DRAW_ALIEN_CARD) becomes the
    //      returned PlayerInput. Earlier this method returned on the
    //      first such reward, silently dropping any reward listed after
    //      it — a footgun if future ladder data lists the draw before
    //      a VP entry.
    let hasPendingDrawAlienCard = false;
    let pendingCardAnyCount = 0;
    for (const reward of rewards) {
      // CARD_ANY surfaces a row-or-deck SelectOption via
      // AnyCardChoiceEffect. Intercept here so it doesn't fall through
      // to executeSimpleSlotReward's deck-only draw.
      if (reward.type === 'CARD_ANY') {
        pendingCardAnyCount += reward.amount;
        continue;
      }

      if (executeSimpleSlotReward(player, game, reward)) {
        continue;
      }

      switch (reward.type) {
        case 'CUSTOM':
          if (reward.effectId === 'DRAW_ALIEN_CARD') {
            // Defer the prompt so any later simple rewards in the same
            // array still get applied. Only the first such entry is
            // honoured (a slot with two draws is treated as one prompt).
            hasPendingDrawAlienCard = true;
            break;
          }
          if (reward.effectId === 'GAIN_EXOFOSSIL') {
            player.gainExofossils(1);
          }
          break;
      }
    }

    // Chain async prompts: CARD_ANY choices first, then alien-card draw,
    // then the caller's onComplete. Each step returns its successor as
    // its onComplete so the action pipeline resumes once the player
    // finishes choosing.
    const drawAlienCardStep =
      onComplete ?? ((): PlayerInput | undefined => undefined);
    const alienCardThenComplete = hasPendingDrawAlienCard
      ? () =>
          this.createDrawAlienCardInput(
            player,
            game,
            { alienType: board.alienType },
            drawAlienCardStep,
          )
      : drawAlienCardStep;

    if (pendingCardAnyCount > 0) {
      return AnyCardChoiceEffect.execute(
        player,
        game,
        pendingCardAnyCount,
        alienCardThenComplete,
      );
    }

    if (hasPendingDrawAlienCard) {
      return alienCardThenComplete();
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
    const faceUpCardId = board.faceUpAlienCardId;
    const hasDeck =
      board.alienDeckDrawPile.length > 0 ||
      board.alienDeckDiscardPile.length > 0;

    if (faceUpCardId === null) {
      if (!hasDeck) {
        return undefined;
      }

      this.drawAlienCard(player, board, 'deck', game);
      return onComplete?.();
    }

    if (!hasDeck) {
      this.drawAlienCard(player, board, 'face-up', game);
      return onComplete?.();
    }

    return new SelectOption(
      player,
      [
        {
          id: 'draw-face-up',
          label: 'Draw face-up alien card',
          cardId: faceUpCardId,
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
    // Once an alien is discovered, refer to it by its species name; before
    // discovery fall back to the index so the player can still tell the two
    // boards apart.
    const alienLabel = board.discovered
      ? formatAlienType(board.alienType)
      : `Alien ${board.alienIndex + 1}`;
    const colorLabel = formatTraceColor(traceColor);
    const rewardSummary = formatSlotRewards(slot.rewards);
    const rewardSuffix = rewardSummary ? ` — ${rewardSummary}` : '';

    if (slot.isDiscovery) {
      return `${alienLabel} — Discovery (${colorLabel})${rewardSuffix}`;
    }
    if (slot.slotId.includes('anomaly-column')) {
      const tier = parseSlotIdTier(slot.slotId);
      const isOverflow = slot.maxOccupants === -1;
      const tierLabel = isOverflow
        ? 'Overflow'
        : tier !== null
          ? `tier ${tier}`
          : 'tier';
      return `${alienLabel} — ${colorLabel} ${tierLabel}${rewardSuffix}`;
    }
    if (slot.slotId.includes(OUMUAMUA_TRACE_SLOT_PREFIX)) {
      const tier = parseSlotIdTier(slot.slotId);
      const tierLabel = tier !== null ? `tier ${tier}` : 'tier';
      return `${alienLabel} — ${colorLabel} ${tierLabel}${rewardSuffix}`;
    }
    if (slot.maxOccupants === -1) {
      return `${alienLabel} — Overflow (${colorLabel})${rewardSuffix}`;
    }
    return `${alienLabel} — ${colorLabel} slot${rewardSuffix}`;
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
    case EAlienType.ARKHOS:
      return 'Arkhos';
    case EAlienType.DUMMY:
      return 'Dummy';
    default:
      return String(alienType);
  }
}

/**
 * Render a slot's reward list as a short, human-readable summary that fits in
 * an option label, e.g. `4 VP + alien card` or `2 VP + 1 publicity`.
 */
function formatSlotRewards(rewards: readonly TSlotReward[]): string {
  if (rewards.length === 0) return '';
  const parts: string[] = [];
  for (const reward of rewards) {
    if (reward.type === 'CUSTOM') {
      parts.push(formatCustomRewardLabel(reward.effectId));
      continue;
    }
    if (!('amount' in reward)) continue;
    const amount = reward.amount;
    switch (reward.type) {
      case 'VP':
        parts.push(`${amount} VP`);
        break;
      case 'PUBLICITY':
        parts.push(`${amount} publicity`);
        break;
      case 'CREDIT':
        parts.push(`${amount} credit${amount === 1 ? '' : 's'}`);
        break;
      case 'ENERGY':
        parts.push(`${amount} energy`);
        break;
      case 'DATA':
        parts.push(`${amount} data`);
        break;
      case 'CARD':
        parts.push(`${amount} card${amount === 1 ? '' : 's'}`);
        break;
      case 'CARD_ANY':
        parts.push(`${amount} any card`);
        break;
      default:
        break;
    }
  }
  return parts.join(' + ');
}

function formatCustomRewardLabel(effectId: string): string {
  switch (effectId) {
    case 'DRAW_ALIEN_CARD':
      return 'alien card';
    case 'GAIN_EXOFOSSIL':
      return 'exofossil';
    case 'CENTAURIANS_DRAW_ALIEN_CARD':
      return 'Centaurians card';
    case 'CENTAURIANS_ANY_TRACE':
      return 'any trace';
    default:
      return effectId.toLowerCase().replace(/_/g, ' ');
  }
}

function formatTraceColor(traceColor: ETrace): string {
  switch (traceColor) {
    case ETrace.PINK:
      return 'Pink';
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

/**
 * Parse the tier number out of a slotId like
 * `alien-0-oumuamua-trace|red-trace|3|0`. Returns null if the tier segment is
 * absent or non-numeric — used purely for human-readable labels.
 */
function parseSlotIdTier(slotId: string): number | null {
  const parts = slotId.split('|');
  for (const part of parts) {
    const value = Number.parseInt(part, 10);
    if (!Number.isNaN(value) && String(value) === part) {
      return value;
    }
  }
  return null;
}
