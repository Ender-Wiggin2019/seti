import { getAnomalyColumnRewardsForPlacement } from '@seti/common/constant/alienBoardConfig';
import {
  PLANETARY_BOARD_CONFIG,
  type TPlanetaryBoardConfigId,
  type TPlanetReward,
} from '@seti/common/constant/boardLayout';
import { RIVAL_TECH_CATEGORY_ORDER_BY_BOARD } from '@seti/common/constant/solo';
import { alienCards } from '@seti/common/data/alienCards';
import {
  EPlanet,
  EResource,
  ESector,
  ETech,
  ETrace,
} from '@seti/common/types/element';
import { EAlienType, EPhase } from '@seti/common/types/protocol/enums';
import type { TPublicSlotReward } from '@seti/common/types/protocol/gameState';
import {
  ERivalActionKind,
  ERivalDecisionDirection,
  ERivalProbePlacement,
  ERivalProbeTarget,
  ERivalTelescopeMode,
  type IRivalActionCandidateDefinition,
  type TRivalBoardConfigId,
} from '@seti/common/types/protocol/solo';
import {
  type ETechId,
  getTechDescriptor,
  getTechIdsForCategory,
  type TTechCategory,
} from '@seti/common/types/tech';
import {
  type AlienBoard,
  type CentauriansAlienBoard,
  type ExertiansAlienBoard,
  type ITraceSlot,
  isCentauriansAlienBoard,
  isExertiansAlienBoard,
  isMascamitesAlienBoard,
  isOumuamuaAlienBoard,
} from '@/engine/alien/AlienBoard.js';
import { AlienRegistry } from '@/engine/alien/AlienRegistry.js';
import { MascamitesAlienPlugin } from '@/engine/alien/plugins/MascamitesAlienPlugin.js';
import {
  ESolarSystemElementType,
  type ISolarSystemSpace,
} from '@/engine/board/SolarSystem.js';
import {
  extractSectorColorFromCardItem,
  RefillCardRowEffect,
} from '@/engine/effects/index.js';
import { LaunchProbeEffect } from '@/engine/effects/probe/LaunchProbeEffect.js';
import { RotateDiscEffect } from '@/engine/effects/solar/RotateDiscEffect.js';
import { createTraceMarkedEvent } from '@/engine/event/GameEvent.js';
import type { Game } from '@/engine/Game.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import type { TCardItem } from '@/engine/player/IPlayer.js';
import { EPieceType } from '@/engine/player/Pieces.js';
import { buildTechTileBonuses } from '@/engine/tech/TechBonusConfig.js';
import { getNextTriggeredAnomalyToken } from '../alien/plugins/AnomaliesResolver.js';
import type { Sector, TSectorSignal } from '../board/Sector.js';
import { RivalResourceResolver } from './RivalResourceResolver.js';
import { RivalSetup } from './RivalSetup.js';

const EXERTIAN_CARD_IDS = alienCards
  .filter((card) => card.alien === EAlienType.EXERTIANS)
  .map((card) => card.id);

type TRivalProbePlacementDecision =
  | {
      placement: ERivalProbePlacement.LANDER;
      isMoon: boolean;
      probeTechIndex?: number;
    }
  | {
      placement: ERivalProbePlacement.ORBITER;
    };

export class RivalActionResolver {
  public static resolveCandidate(
    game: Game,
    candidate: IRivalActionCandidateDefinition,
    decisionDirection: ERivalDecisionDirection,
  ): boolean {
    switch (candidate.kind) {
      case ERivalActionKind.ANALYZE_DATA:
        return this.resolveAnalyze(game, candidate, decisionDirection);
      case ERivalActionKind.LAUNCH_PROBE:
        return this.resolveLaunch(game, candidate);
      case ERivalActionKind.RESEARCH_TECH:
        return this.resolveTech(game, candidate);
      case ERivalActionKind.PROBE_PLACEMENT:
        return this.resolveProbe(game, candidate, decisionDirection);
      case ERivalActionKind.SCAN:
        return this.resolveTelescope(game, candidate, decisionDirection);
      case ERivalActionKind.MARK_TRACE:
        return this.resolveAnomaliesMarkTrace(game);
      case ERivalActionKind.PLAY_DANGER_CARD:
        return this.resolveExertiansPlayDangerCard(game);
      case ERivalActionKind.START_COUNTDOWN:
        return this.resolveCentauriansStartCountdown(game, decisionDirection);
      default:
        return false;
    }
  }

  private static resolveAnalyze(
    game: Game,
    candidate: IRivalActionCandidateDefinition,
    decisionDirection: ERivalDecisionDirection,
  ): boolean {
    const rivalState = game.rivalState;
    if (!rivalState?.computer.filledSlots.every(Boolean)) {
      return false;
    }

    rivalState.computer.filledSlots = rivalState.computer.filledSlots.map(
      () => false,
    );
    RivalResourceResolver.applyRewards(game, candidate.effects);
    this.resolveTrace(game, ETrace.BLUE, decisionDirection);
    while (
      rivalState.computer.dataPool > 0 &&
      rivalState.computer.filledSlots.some((filled) => !filled)
    ) {
      rivalState.computer.dataPool -= 1;
      RivalResourceResolver.gainData(game, 1);
    }
    this.resolveComputerTechDuringAnalyze(game);
    return true;
  }

  private static resolveComputerTechDuringAnalyze(game: Game): void {
    const computerTechIndex = this.findRivalTechIndexByCategory(
      game,
      ETech.COMPUTER,
    );
    if (computerTechIndex < 0) {
      return;
    }

    const rival = RivalSetup.getRivalPlayer(game);
    this.discardRivalTechAt(game, computerTechIndex);
    rival.score += 3;
    RivalResourceResolver.gainProgress(game, 1);
  }

  private static resolveProbe(
    game: Game,
    candidate: IRivalActionCandidateDefinition,
    decisionDirection: ERivalDecisionDirection,
  ): boolean {
    const rival = RivalSetup.getRivalPlayer(game);
    const solarSystem = game.solarSystem;
    const planetaryBoard = game.planetaryBoard;
    if (!solarSystem || !planetaryBoard) {
      return false;
    }

    const planets = this.getProbeTargetPlanets(candidate);
    if (planets.length === 0) {
      return false;
    }
    const movement = candidate.movement ?? 0;

    for (const planet of planets) {
      const location = solarSystem.getPlanetLocation(planet);
      if (!location) {
        continue;
      }

      const probeLocation = this.findReachableRivalProbe(
        game,
        location.space,
        movement,
      );
      if (!probeLocation) {
        continue;
      }

      planetaryBoard.setProbeCount(planet, rival.id, 1);

      const placement = this.chooseProbePlacement(
        game,
        planet,
        candidate.probePlacement,
        candidate.probeTarget === ERivalProbeTarget.OUMUAMUA,
      );
      if (!placement) {
        planetaryBoard.setProbeCount(planet, rival.id, 0);
        continue;
      }

      this.moveProbeAlongPath(game, probeLocation.probeId, probeLocation.path);
      if (placement.placement === ERivalProbePlacement.LANDER) {
        this.resolveProbeLanding(
          game,
          planet,
          candidate,
          placement,
          decisionDirection,
        );
        return true;
      }

      this.resolveProbeOrbit(game, planet, candidate, decisionDirection);
      return true;
    }

    return false;
  }

  private static chooseProbePlacement(
    game: Game,
    planet: EPlanet,
    printedPlacement: ERivalProbePlacement | undefined,
    allowOrbitFallback = false,
  ): TRivalProbePlacementDecision | null {
    const rival = RivalSetup.getRivalPlayer(game);
    const planetaryBoard = game.planetaryBoard;
    if (!planetaryBoard) {
      return null;
    }

    const probeTechIndex = this.findRivalTechIndexByCategory(game, ETech.PROBE);
    if (
      probeTechIndex >= 0 &&
      this.hasMoonSlot(planet) &&
      planetaryBoard.canLand(planet, rival.id, {
        isMoon: true,
        allowMoonLanding: true,
      })
    ) {
      return {
        placement: ERivalProbePlacement.LANDER,
        isMoon: true,
        probeTechIndex,
      };
    }

    const canOrbit = planetaryBoard.canOrbit(planet, rival.id);
    const canLand = planetaryBoard.canLand(planet, rival.id);
    const firstOrbitAvailable =
      canOrbit && this.isFirstOrbitBonusAvailable(game, planet);
    const firstLandAvailable =
      canLand && this.isFirstLandBonusAvailable(game, planet);

    if (firstOrbitAvailable !== firstLandAvailable) {
      return firstOrbitAvailable
        ? { placement: ERivalProbePlacement.ORBITER }
        : { placement: ERivalProbePlacement.LANDER, isMoon: false };
    }

    if (printedPlacement === ERivalProbePlacement.LANDER && canLand) {
      return { placement: ERivalProbePlacement.LANDER, isMoon: false };
    }
    if (
      allowOrbitFallback &&
      printedPlacement === ERivalProbePlacement.LANDER &&
      canOrbit
    ) {
      return { placement: ERivalProbePlacement.ORBITER };
    }
    if (printedPlacement === ERivalProbePlacement.ORBITER && canOrbit) {
      return { placement: ERivalProbePlacement.ORBITER };
    }
    return null;
  }

  private static isFirstOrbitBonusAvailable(
    game: Game,
    planet: EPlanet,
  ): boolean {
    return (
      game.planetaryBoard?.planets.get(planet)?.firstOrbitClaimed === false
    );
  }

  private static isFirstLandBonusAvailable(
    game: Game,
    planet: EPlanet,
  ): boolean {
    return (
      game.planetaryBoard?.planets
        .get(planet)
        ?.firstLandDataBonusTaken.some((taken) => !taken) ?? false
    );
  }

  private static resolveProbeLanding(
    game: Game,
    planet: EPlanet,
    candidate: IRivalActionCandidateDefinition,
    placement: Extract<
      TRivalProbePlacementDecision,
      { placement: ERivalProbePlacement.LANDER }
    >,
    decisionDirection: ERivalDecisionDirection,
  ): void {
    const rival = RivalSetup.getRivalPlayer(game);
    const result = game.planetaryBoard?.land(planet, rival.id, {
      isMoon: placement.isMoon,
      allowMoonLanding: placement.isMoon,
    });
    if (!result) {
      return;
    }

    if (placement.probeTechIndex !== undefined) {
      this.discardRivalTechAt(game, placement.probeTechIndex);
    }
    game.solarSystem?.consumeProbeByPlanet(rival.id, planet);
    rival.probesInSpace = Math.max(0, rival.probesInSpace - 1);
    game.planetaryBoard?.setProbeCount(planet, rival.id, 0);
    rival.score += result.centerReward.vpGained;
    if (result.firstLandDataGained > 0) {
      RivalResourceResolver.gainData(game, result.firstLandDataGained);
    }
    this.applyPlanetRewards(game, planet, result.rewards, decisionDirection);
    RivalResourceResolver.applyRewards(game, candidate.effects);
    if (candidate.collectMascamitesSample) {
      this.resolveMascamitesSampleConversion(game, planet);
    }
  }

  private static resolveProbeOrbit(
    game: Game,
    planet: EPlanet,
    candidate: IRivalActionCandidateDefinition,
    decisionDirection: ERivalDecisionDirection,
  ): void {
    const rival = RivalSetup.getRivalPlayer(game);
    const result = game.planetaryBoard?.orbit(planet, rival.id);
    if (!result) {
      return;
    }

    game.solarSystem?.consumeProbeByPlanet(rival.id, planet);
    rival.probesInSpace = Math.max(0, rival.probesInSpace - 1);
    game.planetaryBoard?.setProbeCount(planet, rival.id, 0);
    this.applyPlanetRewards(game, planet, result.rewards, decisionDirection);
    RivalResourceResolver.applyRewards(game, candidate.effects);
  }

  private static hasMoonSlot(planet: EPlanet): boolean {
    return (
      (PLANETARY_BOARD_CONFIG[planet as TPlanetaryBoardConfigId]?.moonSlots ??
        0) > 0
    );
  }

  private static resolveMascamitesSampleConversion(
    game: Game,
    planet: EPlanet,
  ): void {
    if (planet !== EPlanet.JUPITER && planet !== EPlanet.SATURN) {
      return;
    }

    const board = game.alienState.getBoardByType(EAlienType.MASCAMITES);
    if (!isMascamitesAlienBoard(board) || !board.discovered) {
      return;
    }

    const samplePool = board.samplePools[planet];
    if (samplePool.length === 0) {
      return;
    }

    const sampleIndex = game.random.nextInt(samplePool.length);
    const [sampleTokenId] = samplePool.splice(sampleIndex, 1);
    if (!sampleTokenId) {
      return;
    }

    const plugin = AlienRegistry.get(EAlienType.MASCAMITES);
    if (!(plugin instanceof MascamitesAlienPlugin)) {
      return;
    }
    plugin.addDeliveredSampleBlueSlot(game, {
      sampleTokenId,
      deliveredBy: RivalSetup.getRivalPlayer(game).id,
      deliveredAtRound: game.round,
    });
  }

  private static getProbeTargetPlanets(
    candidate: IRivalActionCandidateDefinition,
  ): readonly EPlanet[] {
    if (candidate.planets) {
      return candidate.planets;
    }
    if (candidate.probeTarget === ERivalProbeTarget.OUMUAMUA) {
      return [EPlanet.OUMUAMUA];
    }
    return [];
  }

  private static resolveLaunch(
    game: Game,
    candidate: IRivalActionCandidateDefinition,
  ): boolean {
    const rival = RivalSetup.getRivalPlayer(game);
    if (
      rival.probesInSpace > 0 ||
      this.hasRivalProbeInSolarSystem(game) ||
      !LaunchProbeEffect.canExecute(rival, game)
    ) {
      return false;
    }

    LaunchProbeEffect.execute(rival, game);
    RivalResourceResolver.applyRewards(game, candidate.effects);
    return true;
  }

  private static hasRivalProbeInSolarSystem(game: Game): boolean {
    const rival = RivalSetup.getRivalPlayer(game);
    return (
      game.solarSystem?.spaces.some((space) =>
        space.occupants.some((probe) => probe.playerId === rival.id),
      ) ?? false
    );
  }

  private static findReachableRivalProbe(
    game: Game,
    targetSpace: ISolarSystemSpace,
    movement: number,
  ): { probeId: string; path: string[] } | null {
    const rival = RivalSetup.getRivalPlayer(game);
    const solarSystem = game.solarSystem;
    if (!solarSystem) {
      return null;
    }

    const earth = solarSystem.getPlanetLocation(EPlanet.EARTH);
    const probe = earth?.space.occupants.find(
      (candidate) => candidate.playerId === rival.id,
    );
    if (!earth || !probe) {
      return null;
    }

    const path = this.findHighestPublicityPath(
      solarSystem,
      earth.space.id,
      targetSpace.id,
      movement,
    );
    if (path.length > 0) {
      return { probeId: probe.id, path };
    }

    return null;
  }

  private static findHighestPublicityPath(
    solarSystem: NonNullable<Game['solarSystem']>,
    fromSpaceId: string,
    toSpaceId: string,
    movement: number,
  ): string[] {
    if (fromSpaceId === toSpaceId) {
      return [fromSpaceId];
    }

    let best:
      | {
          path: string[];
          cost: number;
          publicity: number;
        }
      | undefined;

    const visit = (
      currentId: string,
      path: string[],
      cost: number,
      publicity: number,
      visited: Set<string>,
    ) => {
      if (currentId === toSpaceId) {
        if (
          best === undefined ||
          publicity > best.publicity ||
          (publicity === best.publicity && cost < best.cost)
        ) {
          best = { path: [...path], cost, publicity };
        }
        return;
      }

      for (const nextId of solarSystem.adjacency.get(currentId) ?? []) {
        if (visited.has(nextId)) {
          continue;
        }
        const stepCost = this.getMoveCost(solarSystem, currentId, nextId);
        if (!Number.isFinite(stepCost)) {
          continue;
        }
        const nextCost = cost + stepCost;
        if (nextCost > movement) {
          continue;
        }
        const nextSpace = solarSystem.spaces.find(
          (space) => space.id === nextId,
        );
        if (!nextSpace) {
          continue;
        }

        visited.add(nextId);
        path.push(nextId);
        visit(
          nextId,
          path,
          nextCost,
          publicity + this.getPublicityOnEnter(nextSpace),
          visited,
        );
        path.pop();
        visited.delete(nextId);
      }
    };

    visit(fromSpaceId, [fromSpaceId], 0, 0, new Set([fromSpaceId]));

    return best?.path ?? [];
  }

  private static getMoveCost(
    solarSystem: NonNullable<Game['solarSystem']>,
    fromSpaceId: string,
    toSpaceId: string,
  ): number {
    const fromSpace = solarSystem.spaces.find(
      (space) => space.id === fromSpaceId,
    );
    const toSpace = solarSystem.spaces.find((space) => space.id === toSpaceId);
    if (!fromSpace || !toSpace) {
      return Number.POSITIVE_INFINITY;
    }
    if (
      this.hasElement(fromSpace, ESolarSystemElementType.SUN) ||
      this.hasElement(toSpace, ESolarSystemElementType.SUN)
    ) {
      return Number.POSITIVE_INFINITY;
    }
    return this.hasElement(fromSpace, ESolarSystemElementType.ASTEROID) ? 2 : 1;
  }

  private static hasElement(
    space: ISolarSystemSpace,
    type: ESolarSystemElementType,
  ): boolean {
    return space.elements.some(
      (element) => element.type === type && element.amount > 0,
    );
  }

  private static getPublicityOnEnter(space: ISolarSystemSpace): number {
    if (!space.hasPublicityIcon) {
      return 0;
    }
    return Math.max(1, Math.trunc(space.publicityIconAmount ?? 1));
  }

  private static moveProbeAlongPath(
    game: Game,
    probeId: string,
    path: readonly string[],
  ): void {
    if (!game.solarSystem || path.length <= 1) {
      return;
    }

    let publicityGained = 0;
    for (let index = 1; index < path.length; index += 1) {
      const result = game.solarSystem.moveProbe(
        probeId,
        path[index - 1],
        path[index],
      );
      publicityGained += result.publicityGained;
    }
    if (publicityGained > 0) {
      RivalSetup.getRivalPlayer(game).resources.gain({
        publicity: publicityGained,
      });
    }
  }

  private static applyPlanetRewards(
    game: Game,
    planet: EPlanet,
    rewards: readonly TPlanetReward[],
    decisionDirection: ERivalDecisionDirection,
  ): void {
    for (const reward of rewards) {
      switch (reward.type) {
        case 'resource':
          this.applyPlanetResourceReward(game, reward.resource, reward.amount);
          break;
        case 'card':
          RivalResourceResolver.gainProgress(game, reward.amount);
          break;
        case 'trace':
          for (let index = 0; index < reward.amount; index += 1) {
            this.resolveTrace(game, reward.trace, decisionDirection);
          }
          break;
        case 'tuck':
          RivalResourceResolver.gainProgress(game, reward.amount * 4);
          break;
        case 'exofossil':
          RivalSetup.getRivalPlayer(game).gainExofossils(reward.amount);
          break;
        case 'signal':
          for (let index = 0; index < reward.amount; index += 1) {
            this.markRivalSignalByPlanet(game, planet);
          }
          break;
        default:
          break;
      }
    }
  }

  private static applyPlanetResourceReward(
    game: Game,
    resource: EResource,
    amount: number,
  ): void {
    switch (resource) {
      case EResource.SCORE:
        RivalResourceResolver.applyRewards(game, [{ type: 'VP', amount }]);
        break;
      case EResource.PUBLICITY:
        RivalResourceResolver.applyRewards(game, [
          { type: 'PUBLICITY', amount },
        ]);
        break;
      case EResource.DATA:
        RivalResourceResolver.gainData(game, amount);
        break;
      default:
        RivalResourceResolver.gainProgress(game, amount);
        break;
    }
  }

  private static resolveTech(
    game: Game,
    candidate: IRivalActionCandidateDefinition,
  ): boolean {
    const rival = RivalSetup.getRivalPlayer(game);
    if (candidate.paid && rival.resources.publicity < 6) {
      return false;
    }
    const techId = this.findPreferredTech(game);
    if (!techId) {
      return false;
    }

    if (candidate.paid) {
      rival.resources.spend({ publicity: 6 });
    }
    RotateDiscEffect.execute(game);
    this.acquireRivalTech(game, techId);
    RivalResourceResolver.applyRewards(game, candidate.effects);
    return true;
  }

  private static findPreferredTech(game: Game): ETechId | undefined {
    const rivalState = game.rivalState;
    const rival = RivalSetup.getRivalPlayer(game);
    const techBoard = game.techBoard;
    if (!rivalState || !techBoard) {
      return undefined;
    }

    const orderedTechIds = this.getRivalTechOrder(
      rivalState.boardConfigId,
      rivalState.progressSlot,
    );
    const availableTechIds = orderedTechIds.filter((techId) =>
      techBoard.canResearch(rival.id, techId),
    );

    return (
      availableTechIds.find(
        (techId) => techBoard.getStack(techId)?.firstTakeBonusAvailable,
      ) ?? availableTechIds[0]
    );
  }

  private static getRivalTechOrder(
    boardConfigId: TRivalBoardConfigId,
    progressSlot: number,
  ): ETechId[] {
    const categoryOrder =
      RIVAL_TECH_CATEGORY_ORDER_BY_BOARD[boardConfigId] ??
      RIVAL_TECH_CATEGORY_ORDER_BY_BOARD['rival-board-1'];
    const techIds = categoryOrder.flatMap((category) =>
      getTechIdsForCategory(category),
    );
    const start =
      ((progressSlot % techIds.length) + techIds.length) % techIds.length;
    return [...techIds.slice(start), ...techIds.slice(0, start)];
  }

  private static acquireRivalTech(game: Game, techId: ETechId): void {
    const rival = RivalSetup.getRivalPlayer(game);
    const techBoard = game.techBoard;
    if (!techBoard) {
      return;
    }

    const takeResult = techBoard.take(rival.id, techId);
    rival.gainTech(techId);
    rival.score += takeResult.vpBonus;
    takeResult.tile.tech.onAcquire?.(rival);

    RivalResourceResolver.applyTechBonuses(
      game,
      buildTechTileBonuses(techId, takeResult.tile.bonus),
    );

    game.missionTracker.recordEvent({
      type: EMissionEventType.TECH_RESEARCHED,
      techCategory: takeResult.tile.tech.type,
    });
  }

  private static resolveTrace(
    game: Game,
    traceColor: ETrace,
    decisionDirection: ERivalDecisionDirection,
  ): boolean {
    const candidates = this.getTraceCandidates(
      game,
      traceColor,
      decisionDirection,
    );
    const nonOverflowCandidates = candidates.filter(
      (candidate) => !candidate.slot.slotId.includes('overflow'),
    );
    const target = (
      nonOverflowCandidates.length > 0 ? nonOverflowCandidates : candidates
    )[0];
    if (!target) {
      return false;
    }

    const rival = RivalSetup.getRivalPlayer(game);
    const plugin = AlienRegistry.get(target.board.alienType);
    if (plugin?.canPlaceTraceOnSlot?.(game, rival, target.slot) === false) {
      return false;
    }
    const placed = target.board.placeTrace(
      target.slot,
      { playerId: rival.id },
      target.traceColor,
    );
    if (!placed) {
      return false;
    }

    plugin?.onPlaceTraceOnSlot?.(game, rival, target.slot);
    RivalResourceResolver.applyRewards(
      game,
      target.slot.rewards as readonly TPublicSlotReward[],
    );
    this.incrementRivalTrace(rival, target.board.alienIndex, target.traceColor);
    game.missionTracker.recordEvent({
      type: EMissionEventType.TRACE_MARKED,
      traceColor: target.traceColor,
    });
    game.eventLog.append(
      createTraceMarkedEvent(
        rival.id,
        target.traceColor,
        target.board.alienIndex,
        !target.slot.isDiscovery,
      ),
    );
    plugin?.onTraceMark?.(
      game,
      rival,
      target.traceColor,
      !target.slot.isDiscovery,
    );
    return true;
  }

  private static resolveAnomaliesMarkTrace(game: Game): boolean {
    const token = getNextTriggeredAnomalyToken(game);
    if (!token?.board.discovered) {
      return false;
    }

    const rival = RivalSetup.getRivalPlayer(game);
    const column = token.board.anomalyColumns.find(
      (slot) => slot.traceColor === token.color,
    );
    if (
      !column ||
      this.getLatestNonNeutralOccupantPlayerId(column) === rival.id
    ) {
      return false;
    }

    const placed = token.board.placeTrace(
      column,
      { playerId: rival.id },
      token.color,
    );
    if (!placed) {
      return false;
    }

    RivalResourceResolver.applyRewards(
      game,
      getAnomalyColumnRewardsForPlacement(column.occupants.length),
    );
    rival.score += 3;
    this.incrementRivalTrace(rival, token.board.alienIndex, token.color);
    game.missionTracker.recordEvent({
      type: EMissionEventType.TRACE_MARKED,
      traceColor: token.color,
    });
    game.eventLog.append(
      createTraceMarkedEvent(
        rival.id,
        token.color,
        token.board.alienIndex,
        true,
      ),
    );
    return true;
  }

  private static getLatestNonNeutralOccupantPlayerId(
    slot: ITraceSlot,
  ): string | undefined {
    for (let index = slot.occupants.length - 1; index >= 0; index -= 1) {
      const occupant = slot.occupants[index];
      if (occupant.source !== 'neutral') {
        return occupant.source.playerId;
      }
    }
    return undefined;
  }

  private static resolveExertiansPlayDangerCard(game: Game): boolean {
    const board = game.alienState.getBoardByType(EAlienType.EXERTIANS);
    if (!isExertiansAlienBoard(board) || !board.discovered) {
      return false;
    }

    const rival = RivalSetup.getRivalPlayer(game);
    if (this.getRivalExertianDangerCount(board, rival.id) >= 5) {
      return false;
    }

    const usedCardIds = new Set(board.faceDownCards.map((card) => card.cardId));
    const availableCardIds = EXERTIAN_CARD_IDS.filter(
      (cardId) => !usedCardIds.has(cardId),
    );
    if (availableCardIds.length === 0) {
      return false;
    }
    const cardId =
      availableCardIds[game.random.nextInt(availableCardIds.length)];
    if (!cardId) {
      return false;
    }

    board.playFaceDownCard(rival.id, cardId, 'discovery');
    return true;
  }

  private static getRivalExertianDangerCount(
    board: ExertiansAlienBoard,
    rivalPlayerId: string,
  ): number {
    const faceDownCount = board.faceDownCards.filter(
      (card) => card.ownerId === rivalPlayerId,
    ).length;
    const dangerTraceCount = board.speciesTraceSlots.reduce((total, slot) => {
      const match = /^exertians-danger-(\d+)-/.exec(slot.slotId);
      if (!match) return total;
      const danger = Number(match[1]);
      const ownOccupants = slot.occupants.filter(
        (occupant) =>
          occupant.source !== 'neutral' &&
          occupant.source.playerId === rivalPlayerId,
      ).length;
      return total + danger * ownOccupants;
    }, 0);
    return faceDownCount + dangerTraceCount;
  }

  private static resolveCentauriansStartCountdown(
    game: Game,
    decisionDirection: ERivalDecisionDirection,
  ): boolean {
    const board = game.alienState.getBoardByType(EAlienType.CENTAURIANS);
    if (!isCentauriansAlienBoard(board) || !board.discovered) {
      return false;
    }

    const rival = RivalSetup.getRivalPlayer(game);
    if (!this.canPlaceRivalCentauriansMilestone(board, rival.id)) {
      return false;
    }

    board.pendingMessagesByPlayer[rival.id] ??= [];
    board.messageMilestones.push({
      playerId: rival.id,
      threshold: rival.score + 15,
      sourceCardId: null,
      resolved: false,
    });
    this.resolveTelescope(
      game,
      {
        kind: ERivalActionKind.SCAN,
        telescopeMode: ERivalTelescopeMode.DEFAULT,
      },
      decisionDirection,
    );
    return true;
  }

  private static canPlaceRivalCentauriansMilestone(
    board: CentauriansAlienBoard,
    rivalPlayerId: string,
  ): boolean {
    const rivalMilestones = board.messageMilestones.filter(
      (milestone) => milestone.playerId === rivalPlayerId,
    );
    return (
      rivalMilestones.length < 3 &&
      rivalMilestones.every((milestone) => milestone.resolved)
    );
  }

  private static getTraceCandidates(
    game: Game,
    traceColor: ETrace,
    decisionDirection: ERivalDecisionDirection,
  ): Array<{ board: AlienBoard; slot: ITraceSlot; traceColor: ETrace }> {
    const traceColors =
      traceColor === ETrace.ANY
        ? [ETrace.RED, ETrace.YELLOW, ETrace.BLUE]
        : [traceColor];
    const boards =
      decisionDirection === ERivalDecisionDirection.RIGHT
        ? [...game.alienState.boards].reverse()
        : game.alienState.boards;
    const candidates: Array<{
      board: AlienBoard;
      slot: ITraceSlot;
      traceColor: ETrace;
    }> = [];

    for (const color of traceColors) {
      for (const board of boards) {
        const plugin = AlienRegistry.get(board.alienType);
        for (const slot of board.getAvailableSlots(color)) {
          const rival = RivalSetup.getRivalPlayer(game);
          if (plugin?.canPlaceTraceOnSlot?.(game, rival, slot) === false) {
            continue;
          }
          candidates.push({ board, slot, traceColor: color });
        }
      }
    }

    return candidates;
  }

  private static incrementRivalTrace(
    rival: ReturnType<typeof RivalSetup.getRivalPlayer>,
    alienIndex: number,
    traceColor: ETrace,
  ): void {
    rival.traces[traceColor] = (rival.traces[traceColor] ?? 0) + 1;
    const byAlien = rival.tracesByAlien[alienIndex] ?? {};
    byAlien[traceColor] = (byAlien[traceColor] ?? 0) + 1;
    rival.tracesByAlien[alienIndex] = byAlien;
  }

  private static resolveTelescope(
    game: Game,
    candidate: IRivalActionCandidateDefinition,
    decisionDirection: ERivalDecisionDirection,
  ): boolean {
    let resolved = false;
    const scanTechIndex = this.findRivalTechIndexByCategory(game, ETech.SCAN);
    const extraCardRowSignals = scanTechIndex >= 0 ? 1 : 0;

    switch (candidate.telescopeMode ?? ERivalTelescopeMode.DEFAULT) {
      case ERivalTelescopeMode.EARTH:
        resolved =
          this.resolveCardRowSignalsWithOptionalTech(
            game,
            decisionDirection,
            1,
            extraCardRowSignals,
            scanTechIndex,
          ) || resolved;
        resolved =
          this.markRivalSignalByPlanet(game, EPlanet.EARTH) || resolved;
        resolved =
          this.markRivalSignalByPlanet(game, EPlanet.EARTH) || resolved;
        break;
      case ERivalTelescopeMode.OUMUAMUA:
        resolved =
          this.resolveCardRowSignalsWithOptionalTech(
            game,
            decisionDirection,
            1,
            extraCardRowSignals,
            scanTechIndex,
          ) || resolved;
        resolved =
          this.markRivalSignalByPlanet(game, EPlanet.EARTH) || resolved;
        resolved =
          this.markRivalSignalByPlanet(game, EPlanet.OUMUAMUA) || resolved;
        break;
      case ERivalTelescopeMode.DEFAULT:
        resolved =
          this.resolveCardRowSignalsWithOptionalTech(
            game,
            decisionDirection,
            2,
            extraCardRowSignals,
            scanTechIndex,
          ) || resolved;
        resolved =
          this.markRivalSignalByPlanet(game, EPlanet.EARTH) || resolved;
        break;
    }

    if (!resolved) {
      return false;
    }

    RivalResourceResolver.applyRewards(game, candidate.effects);
    return true;
  }

  private static resolveCardRowSignalsWithOptionalTech(
    game: Game,
    decisionDirection: ERivalDecisionDirection,
    baseCount: number,
    extraCount: number,
    techIndex: number,
  ): boolean {
    const result = this.markRivalSignalsFromCardRow(
      game,
      decisionDirection,
      baseCount + extraCount,
    );
    if (techIndex >= 0 && result.selectedCount > baseCount) {
      this.discardRivalTechAt(game, techIndex);
    }
    return result.marked;
  }

  private static markRivalSignalsFromCardRow(
    game: Game,
    decisionDirection: ERivalDecisionDirection,
    count: number,
  ): { selectedCount: number; marked: boolean } {
    let marked = false;
    let selectedAny = false;
    let selectedCount = 0;

    for (let index = 0; index < count; index += 1) {
      const selected = this.markOneRivalSignalFromCardRow(
        game,
        decisionDirection,
      );
      selectedAny = selectedAny || selected.selected;
      if (selected.selected) {
        selectedCount += 1;
      }
      marked = marked || selected.marked;
    }

    if (selectedAny) {
      RefillCardRowEffect.execute(game);
    }
    return { selectedCount, marked };
  }

  private static findRivalTechIndexByCategory(
    game: Game,
    category: TTechCategory,
  ): number {
    const rival = RivalSetup.getRivalPlayer(game);
    return rival.techs.findIndex(
      (techId) => getTechDescriptor(techId).type === category,
    );
  }

  private static discardRivalTechAt(game: Game, techIndex: number): void {
    const rival = RivalSetup.getRivalPlayer(game);
    if (techIndex >= 0) {
      rival.techs.splice(techIndex, 1);
    }
  }

  private static markOneRivalSignalFromCardRow(
    game: Game,
    decisionDirection: ERivalDecisionDirection,
  ): { selected: boolean; marked: boolean } {
    if (game.cardRow.length === 0) {
      return { selected: false, marked: false };
    }
    const cardIndex =
      decisionDirection === ERivalDecisionDirection.RIGHT
        ? game.cardRow.length - 1
        : 0;
    const [card] = game.cardRow.splice(cardIndex, 1);
    if (card === undefined) {
      return { selected: false, marked: false };
    }

    const cardId = this.getCardItemId(card);
    if (cardId) {
      game.mainDeck.discard(cardId);
    }

    const sectorColor = extractSectorColorFromCardItem(card);
    if (sectorColor === null) {
      return { selected: true, marked: false };
    }

    return {
      selected: true,
      marked: this.markRivalSignalByColor(game, sectorColor),
    };
  }

  private static markRivalSignalByPlanet(game: Game, planet: EPlanet): boolean {
    if (planet === EPlanet.OUMUAMUA && this.markRivalOumuamuaTileSignal(game)) {
      return true;
    }

    const sectorIndex = game.solarSystem?.getSectorIndexOfPlanet(planet);
    if (sectorIndex === null || sectorIndex === undefined) {
      return false;
    }

    const sector = game.sectors[sectorIndex];
    return sector ? this.markRivalSignalOnSector(game, sector) : false;
  }

  private static markRivalOumuamuaTileSignal(game: Game): boolean {
    const board = game.alienState.getBoardByType(EAlienType.OUMUAMUA);
    const tile = isOumuamuaAlienBoard(board) ? board.oumuamuaTile : null;
    const plugin = AlienRegistry.get(EAlienType.OUMUAMUA) as
      | {
          markTileSignal?: (
            player: ReturnType<typeof RivalSetup.getRivalPlayer>,
            game: Game,
          ) => void;
        }
      | undefined;
    if (!tile || tile.dataRemaining <= 0 || !plugin?.markTileSignal) {
      return false;
    }

    const markerCountBefore = tile.markerPlayerIds.length;
    const dataRemainingBefore = tile.dataRemaining;
    plugin.markTileSignal(RivalSetup.getRivalPlayer(game), game);
    return (
      tile.markerPlayerIds.length > markerCountBefore ||
      tile.dataRemaining < dataRemainingBefore
    );
  }

  private static markRivalSignalByColor(game: Game, color: ESector): boolean {
    const targetSector = this.chooseRivalSignalSector(
      game,
      game.sectors.filter((sector) => sector.color === color),
    );
    return targetSector
      ? this.markRivalSignalOnSector(game, targetSector)
      : false;
  }

  private static markRivalSignalOnSector(game: Game, sector: Sector): boolean {
    const rival = RivalSetup.getRivalPlayer(game);
    rival.pieces.deploy(EPieceType.SECTOR_MARKER);
    const result = sector.markSignal(rival.id);

    game.missionTracker.recordEvent({
      type: EMissionEventType.SIGNAL_PLACED,
      color: sector.color,
    });
    if (result.dataGained) {
      RivalResourceResolver.gainData(game, 1);
    }
    if (result.vpAwarded > 0) {
      rival.score += result.vpAwarded;
    }
    return true;
  }

  private static chooseRivalSignalSector(
    game: Game,
    sectors: readonly Sector[],
  ): Sector | undefined {
    const rival = RivalSetup.getRivalPlayer(game);
    return [...sectors].sort((left, right) => {
      const leftPriority = this.getRivalSignalSectorPriority(left, rival.id);
      const rightPriority = this.getRivalSignalSectorPriority(right, rival.id);
      for (let index = 0; index < leftPriority.length; index += 1) {
        const diff = rightPriority[index] - leftPriority[index];
        if (diff !== 0) {
          return diff;
        }
      }
      return 0;
    })[0];
  }

  private static getRivalSignalSectorPriority(
    sector: Sector,
    rivalPlayerId: string,
  ): [number, number, number, number] {
    const nextDataIndex = sector.signals.findIndex(
      (signal) => signal.type === 'data',
    );
    return [
      this.wouldRivalWinSectorAfterSignal(sector, rivalPlayerId) ? 1 : 0,
      nextDataIndex >= 0 && (sector.positionRewards[nextDataIndex] ?? 0) > 0
        ? 1
        : 0,
      sector.getPlayerMarkerCount(rivalPlayerId),
      sector.dataSlotCapacity,
    ];
  }

  private static wouldRivalWinSectorAfterSignal(
    sector: Sector,
    rivalPlayerId: string,
  ): boolean {
    const nextDataIndex = sector.signals.findIndex(
      (signal) => signal.type === 'data',
    );
    if (nextDataIndex < 0) {
      return false;
    }

    const signals = sector.signals.map((signal, index): TSectorSignal => {
      if (index === nextDataIndex) {
        return { type: 'player', playerId: rivalPlayerId };
      }
      return signal;
    });
    if (signals.some((signal) => signal.type === 'data')) {
      return false;
    }

    const markerCounts = new Map<string, number>();
    const rightmostPositions = new Map<string, number>();
    signals.forEach((signal, index) => {
      if (signal.type !== 'player') {
        return;
      }
      markerCounts.set(
        signal.playerId,
        (markerCounts.get(signal.playerId) ?? 0) + 1,
      );
      rightmostPositions.set(signal.playerId, index);
    });

    const winner = [...markerCounts.keys()].sort((left, right) => {
      const countDiff =
        (markerCounts.get(right) ?? 0) - (markerCounts.get(left) ?? 0);
      if (countDiff !== 0) {
        return countDiff;
      }
      return (
        (rightmostPositions.get(right) ?? 0) -
        (rightmostPositions.get(left) ?? 0)
      );
    })[0];

    return winner === rivalPlayerId;
  }

  private static getCardItemId(card: TCardItem): string | undefined {
    return typeof card === 'string'
      ? card
      : ((card as { id?: string }).id ?? undefined);
  }

  public static enterResolution(game: Game): void {
    if (game.phase === EPhase.AWAIT_MAIN_ACTION) {
      game.transitionTo(EPhase.IN_RESOLUTION);
    }
  }
}
