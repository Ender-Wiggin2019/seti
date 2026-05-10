import { alienCards } from '@seti/common/data/alienCards';
import {
  EXERTIAN_SCORING_RULES,
  type TExertianScoringRule,
} from '@seti/common/rules/exertians';
import type { ESector } from '@seti/common/types/element';
import { EAlienType, ETrace } from '@seti/common/types/protocol/enums';
import { getTechDescriptor } from '@seti/common/types/tech';
import { isSoloMode } from '../../GameOptions.js';
import type { IGame } from '../../IGame.js';
import type { PlayerInput } from '../../input/PlayerInput.js';
import { SelectOption } from '../../input/SelectOption.js';
import { getMoonOccupants } from '../../board/PlanetaryBoard.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { EPieceType } from '../../player/Pieces.js';
import { RivalSetup } from '../../solo/RivalSetup.js';
import {
  type AlienBoard,
  type ExertiansAlienBoard,
  type ITraceSlot,
  isExertiansAlienBoard,
  type TExertianFaceDownSource,
} from '../AlienBoard.js';
import type { IAlienPlugin } from '../IAlienPlugin.js';

const BASE_DISCOVERY_DEAL_COUNT = 3;
const EXERTIAN_TRACE_COLORS = [ETrace.RED, ETrace.YELLOW, ETrace.BLUE] as const;
const EXERTIAN_BOARD_DANGER_TIERS = [3, 2, 1] as const;
const EXERTIAN_CARD_IDS = alienCards
  .filter((card) => card.alien === EAlienType.EXERTIANS)
  .map((card) => card.id);
const EXERTIAN_CARD_DANGER = new Map(
  alienCards
    .filter((card) => card.alien === EAlienType.EXERTIANS)
    .map((card) => [card.id, card.special?.danger ?? 0]),
);

export class ExertiansAlienPlugin implements IAlienPlugin {
  public readonly alienType = EAlienType.EXERTIANS;

  public onDiscover(
    game: IGame,
    _discoverers: IPlayer[],
  ): PlayerInput | undefined {
    const board = game.alienState.getBoardByType(EAlienType.EXERTIANS);
    if (!board) {
      return undefined;
    }

    const deck = game.random.shuffle([...EXERTIAN_CARD_IDS]);
    let cursor = 0;

    const discoveryPlays: Array<{ player: IPlayer; count: number }> = [];
    for (const player of game.players) {
      const extraCards = this.countDiscoveryMarkersForPlayer(board, player.id);
      const drawCount = BASE_DISCOVERY_DEAL_COUNT + extraCards;
      const drawn = deck.slice(cursor, cursor + drawCount);
      cursor += drawn.length;
      player.hand.push(...drawn);
      if (extraCards > 0) {
        discoveryPlays.push({ player, count: extraCards });
      }
    }

    board.alienDeckDrawPile = [];
    board.alienDeckDiscardPile = [];
    board.faceUpAlienCardId = null;
    if (isExertiansAlienBoard(board)) {
      this.createDangerTraceSlots(board);
    }
    if (isExertiansAlienBoard(board) && board.milestones.length === 0) {
      const leadingScore = Math.max(
        ...game.players.map((player) => player.score),
      );
      board.milestones = [
        { threshold: leadingScore + 20, claimedByPlayerIds: [], creditCost: 0 },
        { threshold: leadingScore + 40, claimedByPlayerIds: [], creditCost: 1 },
      ];
    }
    return this.createDiscoveryPlayChain(game, discoveryPlays, 0);
  }

  public getAlienDeckCardIds(_game: IGame, _board: AlienBoard): string[] {
    return [...EXERTIAN_CARD_IDS];
  }

  public onMilestoneCheck(
    game: IGame,
    orderedPlayers: readonly IPlayer[],
    onComplete: () => PlayerInput | undefined,
  ): PlayerInput | undefined {
    const board = game.alienState.getBoardByType(EAlienType.EXERTIANS);
    if (!isExertiansAlienBoard(board)) {
      return onComplete();
    }

    return this.resolveMilestoneChain(
      game,
      board,
      orderedPlayers,
      0,
      onComplete,
    );
  }

  public resolveDiscoverySlot(
    _game: IGame,
    _board: AlienBoard,
    _slot: ITraceSlot,
    _player: IPlayer,
  ): void {
    // Exertians distribute from a sealed batch on discovery instead of the
    // default "one discovery marker draws one card from the alien deck" flow.
  }

  public onGameEndScoring(game: IGame, player: IPlayer): number {
    const board = game.alienState.getBoardByType(EAlienType.EXERTIANS);
    if (!isExertiansAlienBoard(board)) {
      return 0;
    }

    let score = 0;
    for (const card of board.faceDownCards) {
      if (card.ownerId !== player.id) {
        continue;
      }
      card.revealed = true;
      score += this.shouldScoreRivalExertianCardAsFulfilled(game, player)
        ? (EXERTIAN_SCORING_RULES[card.cardId]?.score ?? 0)
        : this.scoreExertianCard(card.cardId, player, game, board);
    }
    return score;
  }

  private shouldScoreRivalExertianCardAsFulfilled(
    game: IGame,
    player: IPlayer,
  ): boolean {
    return isSoloMode(game.options) && RivalSetup.isRivalPlayer(player);
  }

  public onGameEndPenalty(
    game: IGame,
    scoresAfterPositiveScoring: Readonly<Record<string, number>>,
  ): Record<string, number> {
    const board = game.alienState.getBoardByType(EAlienType.EXERTIANS);
    if (!isExertiansAlienBoard(board)) {
      return {};
    }

    const dangerByPlayer = new Map<string, number>();
    for (const player of game.players) {
      dangerByPlayer.set(player.id, 0);
    }

    for (const card of board.faceDownCards) {
      card.revealed = true;
      dangerByPlayer.set(
        card.ownerId,
        (dangerByPlayer.get(card.ownerId) ?? 0) +
          (EXERTIAN_CARD_DANGER.get(card.cardId) ?? 0),
      );
    }
    for (const slot of board.speciesTraceSlots) {
      const danger = this.getDangerFromBoardSlot(slot);
      for (const occupant of slot.occupants) {
        if (occupant.source === 'neutral') {
          continue;
        }
        dangerByPlayer.set(
          occupant.source.playerId,
          (dangerByPlayer.get(occupant.source.playerId) ?? 0) + danger,
        );
      }
    }

    const highestDanger = Math.max(...dangerByPlayer.values());
    if (highestDanger <= 0) {
      return {};
    }

    const penalties: Record<string, number> = {};
    for (const [playerId, danger] of dangerByPlayer.entries()) {
      if (danger !== highestDanger) {
        continue;
      }
      penalties[playerId] = -Math.floor(
        (scoresAfterPositiveScoring[playerId] ?? 0) / 10,
      );
    }
    return penalties;
  }

  public playFaceDownCard(
    player: IPlayer,
    game: IGame,
    cardId: string,
    source: TExertianFaceDownSource,
  ): void {
    const board = game.alienState.getBoardByType(EAlienType.EXERTIANS);
    if (!isExertiansAlienBoard(board)) {
      throw new Error('Exertians board is not available');
    }

    const removed = player.removeCardById(cardId);
    if (removed === undefined) {
      throw new Error(`Exertian card ${cardId} is not in hand`);
    }

    board.playFaceDownCard(player.id, cardId, source);
    game.lockCurrentTurn();
  }

  private createDiscoveryPlayChain(
    game: IGame,
    plays: ReadonlyArray<{ player: IPlayer; count: number }>,
    index: number,
  ): PlayerInput | undefined {
    if (index >= plays.length) {
      return undefined;
    }

    const current = plays[index];
    return this.createDiscoveryPlayInput(
      current.player,
      game,
      current.count,
      () => this.createDiscoveryPlayChain(game, plays, index + 1),
    );
  }

  private createDangerTraceSlots(board: ExertiansAlienBoard): void {
    for (const danger of EXERTIAN_BOARD_DANGER_TIERS) {
      for (const traceColor of EXERTIAN_TRACE_COLORS) {
        const slotId = `exertians-danger-${danger}-${traceColor}`;
        if (board.getSlot(slotId)) {
          continue;
        }
        board.addTraceSlot({
          slotId,
          alienIndex: board.alienIndex,
          traceColor,
          maxOccupants: 1,
          rewards: [{ type: 'VP', amount: danger }],
          isDiscovery: false,
        });
      }
    }
  }

  private getDangerFromBoardSlot(slot: ITraceSlot): number {
    const reward = slot.rewards.find((candidate) => candidate.type === 'VP');
    if (!reward || reward.type !== 'VP') {
      return 0;
    }
    return reward.amount;
  }

  private createDiscoveryPlayInput(
    player: IPlayer,
    game: IGame,
    remainingCount: number,
    onComplete: () => PlayerInput | undefined,
  ): PlayerInput | undefined {
    if (remainingCount <= 0) {
      return onComplete();
    }

    const playableCardIds = this.getExertianCardIdsInHand(player);
    if (playableCardIds.length === 0) {
      return onComplete();
    }

    return new SelectOption(
      player,
      [
        ...playableCardIds.map((cardId) => ({
          id: `play-facedown:${cardId}`,
          label: `Play ${cardId} face down`,
          onSelect: () => {
            this.playFaceDownCard(player, game, cardId, 'discovery');
            return this.createDiscoveryPlayInput(
              player,
              game,
              remainingCount - 1,
              onComplete,
            );
          },
        })),
        {
          id: 'skip-exertian-facedown',
          label: 'Skip Exertian face-down play',
          onSelect: onComplete,
        },
      ],
      'Play Exertian card face down',
    );
  }

  private resolveMilestoneChain(
    game: IGame,
    board: ExertiansAlienBoard,
    orderedPlayers: readonly IPlayer[],
    milestoneIndex: number,
    onComplete: () => PlayerInput | undefined,
  ): PlayerInput | undefined {
    if (milestoneIndex >= board.milestones.length) {
      return onComplete();
    }

    const milestone = board.milestones[milestoneIndex];
    for (const player of orderedPlayers) {
      if (
        player.score < milestone.threshold ||
        milestone.claimedByPlayerIds.includes(player.id)
      ) {
        continue;
      }

      milestone.claimedByPlayerIds.push(player.id);
      return this.resolveSingleMilestone(
        player,
        game,
        milestone.creditCost,
        milestone.creditCost === 0 ? 'milestone-20' : 'milestone-40',
        milestone.threshold,
        () =>
          this.resolveMilestoneChain(
            game,
            board,
            orderedPlayers,
            milestoneIndex,
            onComplete,
          ),
      );
    }

    return this.resolveMilestoneChain(
      game,
      board,
      orderedPlayers,
      milestoneIndex + 1,
      onComplete,
    );
  }

  private resolveSingleMilestone(
    player: IPlayer,
    game: IGame,
    creditCost: number,
    source: TExertianFaceDownSource,
    threshold: number,
    onComplete: () => PlayerInput | undefined,
  ): PlayerInput | undefined {
    if (
      creditCost > 0 &&
      !player.resources.canAfford({ credits: creditCost })
    ) {
      return onComplete();
    }

    const playableCardIds = this.getExertianCardIdsInHand(player);
    if (playableCardIds.length === 0) {
      return onComplete();
    }

    return new SelectOption(
      player,
      [
        ...playableCardIds.map((cardId) => ({
          id: `play-facedown:${cardId}`,
          label: `Play ${cardId} face down`,
          onSelect: () => {
            if (creditCost > 0) {
              player.resources.spend({ credits: creditCost });
            }
            this.playFaceDownCard(player, game, cardId, source);
            return onComplete();
          },
        })),
        {
          id: 'skip-exertian-facedown',
          label: 'Skip Exertian face-down play',
          onSelect: onComplete,
        },
      ],
      `Resolve Exertians ${threshold} VP milestone`,
    );
  }

  private getExertiansBoard(game: IGame) {
    const board = game.alienState.getBoardByType(EAlienType.EXERTIANS);
    if (!isExertiansAlienBoard(board)) {
      throw new Error('Exertians board is not available');
    }
    return board;
  }

  private getExertianCardIdsInHand(player: IPlayer): string[] {
    const exertianCardIds = new Set(EXERTIAN_CARD_IDS);
    return player.hand
      .map((card) => (typeof card === 'string' ? card : card.id))
      .filter(
        (cardId): cardId is string =>
          typeof cardId === 'string' && exertianCardIds.has(cardId),
      );
  }

  private scoreExertianCard(
    cardId: string,
    player: IPlayer,
    game: IGame,
    board: ExertiansAlienBoard,
  ): number {
    const rule = EXERTIAN_SCORING_RULES[cardId];
    if (!rule) {
      return 0;
    }

    return this.isScoringRuleFulfilled(rule, player, game, board)
      ? rule.score
      : 0;
  }

  private isScoringRuleFulfilled(
    rule: TExertianScoringRule,
    player: IPlayer,
    game: IGame,
    board: ExertiansAlienBoard,
  ): boolean {
    switch (rule.type) {
      case 'MIN_TRACES_ON_ALIEN':
        return (
          this.countTracesForAlienRule(rule, player, game, board) >= rule.count
        );
      case 'MIN_TRACES_SAME_COLOR':
        return this.getMaxTraceCountByColor(player, game) >= rule.count;
      case 'MIN_ORBIT_OR_LAND_AT_SINGLE_PLANET':
        return this.getMaxOrbitOrLandAtSinglePlanet(player, game) >= rule.count;
      case 'MIN_SECTOR_FULFILLS':
        return (
          this.countSectorFulfills(player, game, rule.sector) >= rule.count
        );
      case 'MIN_TECHS':
        return (
          player.techs.filter(
            (techId) => getTechDescriptor(techId).type === rule.techType,
          ).length >= rule.count
        );
      case 'MIN_TUCKED_INCOME_CARDS':
        return player.tuckedIncomeCards.length >= rule.count;
      case 'MIN_ORBIT_OR_LAND_TOTAL':
        return this.countOrbitersAndLanders(player) >= rule.count;
      case 'MIN_COMPLETED_MISSIONS':
        return player.completedMissions.length >= rule.count;
    }
  }

  private countTracesForAlienRule(
    rule: Extract<TExertianScoringRule, { type: 'MIN_TRACES_ON_ALIEN' }>,
    player: IPlayer,
    game: IGame,
    board: ExertiansAlienBoard,
  ): number {
    if (rule.alienType === 'self') {
      return board.getPlayerTraceCount(player);
    }
    if (rule.alienType === 'other') {
      return game.alienState.boards
        .filter((candidate) => candidate.alienType !== EAlienType.EXERTIANS)
        .reduce(
          (total, candidate) => total + candidate.getPlayerTraceCount(player),
          0,
        );
    }
    return game.alienState.getPlayerTraceCount(player, undefined, {
      alienType: rule.alienType,
    });
  }

  private getMaxTraceCountByColor(player: IPlayer, game: IGame): number {
    return Math.max(
      ...Object.values(ETrace)
        .filter((traceColor) => traceColor !== ETrace.ANY)
        .map((traceColor) =>
          game.alienState.getPlayerTraceCount(player, traceColor),
        ),
    );
  }

  private getMaxOrbitOrLandAtSinglePlanet(
    player: IPlayer,
    game: IGame,
  ): number {
    if (!game.planetaryBoard) {
      return 0;
    }
    return Math.max(
      0,
      ...[...game.planetaryBoard.planets.values()].map((planet) => {
        const orbiters = planet.orbitSlots.filter(
          (slot) => slot.playerId === player.id,
        ).length;
        const landers = planet.landingSlots.filter(
          (slot) => slot.playerId === player.id,
        ).length;
        const moon = getMoonOccupants(planet).filter(
          (slot) => slot.playerId === player.id,
        ).length;
        return orbiters + landers + moon;
      }),
    );
  }

  private countSectorFulfills(
    player: IPlayer,
    game: IGame,
    sectorColor?: ESector,
  ): number {
    return game.sectors.reduce((total, sector) => {
      if (sectorColor !== undefined && sector.color !== sectorColor) {
        return total;
      }
      return (
        total +
        sector.sectorWinners.filter((playerId) => playerId === player.id).length
      );
    }, 0);
  }

  private countOrbitersAndLanders(player: IPlayer): number {
    return (
      player.pieces.deployed(EPieceType.ORBITER) +
      player.pieces.deployed(EPieceType.LANDER)
    );
  }

  private countDiscoveryMarkersForPlayer(
    board: AlienBoard,
    playerId: string,
  ): number {
    return board
      .getDiscoverySlots()
      .flatMap((slot) => slot.occupants)
      .filter(
        (occupant) =>
          occupant.source !== 'neutral' &&
          occupant.source.playerId === playerId,
      ).length;
  }
}
