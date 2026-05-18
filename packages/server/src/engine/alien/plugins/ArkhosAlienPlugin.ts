import {
  ARKHOS_ALIEN_CARD_IDS,
  ARKHOS_EXPLORATION_CARDS,
  ARKHOS_TRACE_SLOTS,
  getArkhosSecurityCardsByTrace,
  type IArkhosSecurityCardState,
  type TArkhosExplorationRewardSize,
} from '@seti/common/constant/spaceAgencyAliens';
import { EAlienType, ETrace } from '@seti/common/types/protocol/enums';
import { createActionEvent } from '@/engine/event/GameEvent.js';
import type { IGame } from '@/engine/IGame.js';
import type { PlayerInput } from '@/engine/input/PlayerInput.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { isSoloMode } from '../../GameOptions.js';
import { RivalResourceResolver } from '../../solo/RivalResourceResolver.js';
import { RivalSetup } from '../../solo/RivalSetup.js';
import type {
  AlienBoard,
  ArkhosAlienBoard,
  ITraceSlot,
} from '../AlienBoard.js';
import { isArkhosAlienBoard } from '../AlienBoard.js';
import type { IAlienPlugin } from '../IAlienPlugin.js';

const ARKHOS_SECURITY_TRACES = [
  ETrace.RED,
  ETrace.YELLOW,
  ETrace.BLUE,
] as const;

export class ArkhosAlienPlugin implements IAlienPlugin {
  public readonly alienType = EAlienType.ARKHOS;

  public getAlienDeckCardIds(_game: IGame, _board: AlienBoard): string[] {
    return [...ARKHOS_ALIEN_CARD_IDS];
  }

  public onDiscover(
    game: IGame,
    discoverers: IPlayer[],
  ): PlayerInput | undefined {
    const board = game.alienState.getBoardByType(EAlienType.ARKHOS);
    if (!isArkhosAlienBoard(board)) {
      return undefined;
    }

    if (board.explorationDrawPile.length === 0) {
      const shuffledExploration = game.random.shuffle(
        ARKHOS_EXPLORATION_CARDS.map((card) => card.cardId),
      );
      board.initializeExplorationCards(shuffledExploration);
    }

    if (Object.keys(board.securityCardsByPlayer).length === 0) {
      this.dealSecurityCards(game, board);
    }

    for (const player of this.getDiscoveryMarkerOwners(game, board)) {
      this.resolveExplorationReward(game, board, player, 'minor');
    }

    this.createTraceSlots(board);
    board.alienDeckDrawPile = [];
    board.alienDeckDiscardPile = [];
    board.faceUpAlienCardId = null;
    return undefined;
  }

  public canPlaceTraceOnSlot(
    game: IGame,
    player: IPlayer,
    slot: ITraceSlot,
  ): boolean {
    if (slot.isDiscovery || slot.slotId.includes('overflow')) {
      return true;
    }

    const board = this.getArkhosBoardForSlot(game, slot);
    if (!board) {
      return true;
    }

    const level = this.getTraceSlotLevel(slot);
    if (level === undefined) {
      return true;
    }

    return board.ensurePlayerAccess(player.id).accessLevel >= level;
  }

  public onPlaceTraceOnSlot(
    game: IGame,
    player: IPlayer,
    slot: ITraceSlot,
  ): void {
    if (!slot.slotId.includes('overflow')) {
      return;
    }

    const board = game.alienState.getBoardByType(EAlienType.ARKHOS);
    if (!isArkhosAlienBoard(board)) {
      return;
    }
    if (this.isSoloRival(game, player)) {
      return;
    }

    const securityCard = board.securityCardsByPlayer[player.id]?.find(
      (card) => card.traceColor === slot.traceColor && card.zone === 'front',
    );
    if (!securityCard) {
      return;
    }

    this.breachSecurityCard(game, board, player, securityCard, 'hand');
  }

  public onAlienCardPlayed(
    game: IGame,
    player: IPlayer,
    cardId: string,
  ): boolean {
    return this.useSecurityCard(game, player, cardId, 'major');
  }

  public onAlienCardDiscardedForFreeAction(
    game: IGame,
    player: IPlayer,
    cardId: string,
  ): boolean {
    return this.useSecurityCard(game, player, cardId, 'minor');
  }

  public unlockRivalSecurityCard(
    game: IGame,
    player: IPlayer,
  ): ETrace | undefined {
    const board = game.alienState.getBoardByType(EAlienType.ARKHOS);
    if (!isArkhosAlienBoard(board) || !board.discovered) {
      return undefined;
    }
    const securityCard = board.securityCardsByPlayer[player.id]?.find(
      (card) => card.zone === 'front',
    );
    if (!securityCard) {
      return undefined;
    }

    this.breachSecurityCard(game, board, player, securityCard, 'used');
    this.resolveExplorationReward(game, board, player, 'minor');
    this.resolveExplorationReward(game, board, player, 'minor');
    return securityCard.traceColor;
  }

  private dealSecurityCards(game: IGame, board: AlienBoard): void {
    if (!isArkhosAlienBoard(board)) {
      return;
    }

    const pools = new Map(
      ARKHOS_SECURITY_TRACES.map((traceColor) => [
        traceColor,
        game.random.shuffle(
          getArkhosSecurityCardsByTrace(traceColor).map((card) => card.cardId),
        ),
      ]),
    );

    for (const player of game.players) {
      const cards = ARKHOS_SECURITY_TRACES.map((traceColor) => ({
        cardId: pools.get(traceColor)?.shift() ?? '',
        traceColor,
        zone: 'front' as const,
      })).filter((card) => card.cardId.length > 0);
      board.setPlayerSecurityCards(player.id, cards);
    }
  }

  private createTraceSlots(board: AlienBoard): void {
    if (!isArkhosAlienBoard(board) || board.speciesTraceSlots.length > 0) {
      return;
    }

    for (const slot of ARKHOS_TRACE_SLOTS) {
      board.addTraceSlot({
        slotId: `alien-${board.alienIndex}-arkhos-level-${slot.level}-${slot.position}-${slot.traceColor}`,
        alienIndex: board.alienIndex,
        traceColor: slot.traceColor,
        maxOccupants: 1,
        rewards: [
          {
            type: 'CUSTOM',
            effectId: `ARKHOS_LEVEL_${slot.level}_EXPLORATION`,
          },
        ],
        isDiscovery: false,
      });
    }
  }

  private resolveExplorationReward(
    game: IGame,
    board: AlienBoard,
    player: IPlayer,
    size: TArkhosExplorationRewardSize,
  ): void {
    if (!isArkhosAlienBoard(board)) {
      return;
    }

    const cardId = board.revealExplorationCard(game.random);
    if (!cardId) {
      return;
    }

    const card = ARKHOS_EXPLORATION_CARDS.find(
      (candidate) => candidate.cardId === cardId,
    );
    const effectId =
      size === 'major' ? card?.majorEffectId : card?.minorEffectId;
    const record = {
      playerId: player.id,
      cardId,
      size,
      effectId: effectId ?? 'ARKHOS_EXPLORATION_REVEAL_UNMAPPED',
    };
    board.resolvedExplorationRewards.push(record);
    if (this.isSoloRival(game, player)) {
      RivalResourceResolver.gainProgress(game, 1);
    }
    game.eventLog.append(
      createActionEvent(player.id, 'ARKHOS_EXPLORATION_REWARD_REVEALED', {
        alienType: EAlienType.ARKHOS,
        ...record,
      }),
    );
  }

  private useSecurityCard(
    game: IGame,
    player: IPlayer,
    cardId: string,
    rewardSize: TArkhosExplorationRewardSize,
  ): boolean {
    const board = game.alienState.getBoardByType(EAlienType.ARKHOS);
    if (!isArkhosAlienBoard(board)) {
      return false;
    }
    const securityCard = board.securityCardsByPlayer[player.id]?.find(
      (card) => card.cardId === cardId && card.zone === 'hand',
    );
    if (!securityCard) {
      return false;
    }

    securityCard.zone = 'used';
    this.resolveExplorationReward(game, board, player, rewardSize);
    game.eventLog.append(
      createActionEvent(player.id, 'ARKHOS_SECURITY_CARD_USED', {
        alienType: EAlienType.ARKHOS,
        cardId,
        rewardSize,
      }),
    );
    return true;
  }

  private breachSecurityCard(
    game: IGame,
    board: ArkhosAlienBoard,
    player: IPlayer,
    securityCard: IArkhosSecurityCardState,
    targetZone: IArkhosSecurityCardState['zone'],
  ): void {
    securityCard.zone = targetZone;
    if (targetZone === 'hand' && !player.hand.includes(securityCard.cardId)) {
      player.hand.push(securityCard.cardId);
    }
    const access = board.ensurePlayerAccess(player.id);
    access.breachedCount += 1;
    access.accessLevel = Math.min(3, access.breachedCount);
    game.eventLog.append(
      createActionEvent(player.id, 'ARKHOS_SECURITY_BREACHED', {
        alienType: EAlienType.ARKHOS,
        traceColor: securityCard.traceColor,
        cardId: securityCard.cardId,
        accessLevel: access.accessLevel,
      }),
    );
  }

  private getArkhosBoardForSlot(
    game: IGame,
    slot: ITraceSlot,
  ): ArkhosAlienBoard | undefined {
    const board = game.alienState.getBoardByType(EAlienType.ARKHOS);
    if (!isArkhosAlienBoard(board)) {
      return undefined;
    }
    return board.speciesTraceSlots.some(
      (candidate) => candidate.slotId === slot.slotId,
    )
      ? board
      : undefined;
  }

  private getDiscoveryMarkerOwners(game: IGame, board: AlienBoard): IPlayer[] {
    return board
      .getDiscoverySlots()
      .flatMap((slot) => slot.occupants)
      .map((occupant) => occupant.source)
      .flatMap((source) => {
        if (source === 'neutral') {
          return [];
        }
        const player = game.players.find(
          (candidate) => candidate.id === source.playerId,
        );
        return player ? [player] : [];
      });
  }

  private getTraceSlotLevel(slot: ITraceSlot): number | undefined {
    const match = slot.slotId.match(/arkhos-level-(\d+)/);
    if (!match) {
      return undefined;
    }
    const level = Number(match[1]);
    return Number.isInteger(level) ? level : undefined;
  }

  private isSoloRival(game: IGame, player: IPlayer): boolean {
    return isSoloMode(game.options) && RivalSetup.isRivalPlayer(player);
  }
}
