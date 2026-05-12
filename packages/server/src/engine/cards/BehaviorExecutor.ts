import {
  EResource,
  type ESector,
  ETech,
  type ETrace,
} from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import type { TTechCategory } from '@seti/common/types/tech';
import { ResearchTechAction } from '../actions/ResearchTech.js';
import { EPriority } from '../deferred/Priority.js';
import { SimpleDeferredAction } from '../deferred/SimpleDeferredAction.js';
import { AnyCardChoiceEffect } from '../effects/card/AnyCardChoiceEffect.js';
import { TuckCardForIncomeEffect } from '../effects/income/TuckCardForIncomeEffect.js';
import {
  buildLandPlanetSelection,
  LaunchProbeEffect,
  MarkSectorSignalEffect,
  OrbitProbeEffect,
  RefillCardRowEffect,
  ResearchTechEffect,
  RotateDiscEffect,
  ScanEffect,
} from '../effects/index.js';
import { createActionEvent } from '../event/GameEvent.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import { SelectOption } from '../input/SelectOption.js';
import type { IPlayer } from '../player/IPlayer.js';
import type { IBehavior } from './Behavior.js';
import type { ICard } from './ICard.js';
import { EMarkSource } from './utils/Mark.js';

const ORBITABLE_PLANETS: readonly EPlanet[] = [
  EPlanet.MERCURY,
  EPlanet.VENUS,
  EPlanet.MARS,
  EPlanet.JUPITER,
  EPlanet.SATURN,
  EPlanet.URANUS,
  EPlanet.NEPTUNE,
  EPlanet.OUMUAMUA,
];

type TCustomBehaviorHandler = (
  player: IPlayer,
  game: IGame,
  card: ICard,
) => IPlayerInput | undefined;

interface IBuildActionOptions {
  preserveEffectOrder?: boolean;
}

function buildCoreEffectAction(
  player: IPlayer,
  callback: (game: IGame) => IPlayerInput | undefined,
): SimpleDeferredAction {
  return new SimpleDeferredAction(player, callback, EPriority.CORE_EFFECT);
}

function toResearchCategories(tech: ETech): TTechCategory[] {
  if (tech === ETech.ANY) {
    return [ETech.PROBE, ETech.SCAN, ETech.COMPUTER];
  }
  return [tech as TTechCategory];
}

function toIncomeBundle(income: EResource) {
  if (income === EResource.CREDIT) {
    return EResource.CREDIT;
  }
  if (income === EResource.ENERGY) {
    return EResource.ENERGY;
  }
  if (income === EResource.CARD) {
    return EResource.CARD;
  }
  return undefined;
}

export class BehaviorExecutor {
  private readonly customHandlers = new Map<string, TCustomBehaviorHandler>();

  public registerCustomHandler(
    customId: string,
    handler: TCustomBehaviorHandler,
  ): void {
    this.customHandlers.set(customId, handler);
  }

  public canExecute(
    behavior: IBehavior,
    player: IPlayer,
    game: IGame,
  ): boolean {
    if (
      behavior.spendResources &&
      !player.resources.has(behavior.spendResources)
    ) {
      return false;
    }
    return true;
  }

  public execute(
    behavior: IBehavior,
    player: IPlayer,
    game: IGame,
    card: ICard,
  ): IPlayerInput | undefined {
    const behaviorSequence = this.getBehaviorSequence(behavior);
    const preserveEffectOrder = behavior.effectSequence !== undefined;
    const deferredActions = behaviorSequence.flatMap((step) =>
      this.buildDeferredActions(step, player, card, {
        preserveEffectOrder,
      }),
    );

    game.deferredActions.pushMultiple(deferredActions);
    return undefined;
  }

  private getBehaviorSequence(behavior: IBehavior): IBehavior[] {
    const sequence = behavior.effectSequence;
    if (!sequence || sequence.length === 0) return [behavior];

    return sequence
      .map((step) => this.filterSequenceStep(step, behavior))
      .filter((step) => this.hasExecutableBehavior(step));
  }

  private filterSequenceStep(step: IBehavior, behavior: IBehavior): IBehavior {
    const next: IBehavior = {};
    if (step.spendResources && behavior.spendResources) {
      next.spendResources = step.spendResources;
    }
    if (step.gainResources && behavior.gainResources) {
      next.gainResources = step.gainResources;
    }
    if (step.gainScore !== undefined && behavior.gainScore !== undefined) {
      next.gainScore = step.gainScore;
    }
    if (
      step.gainMovement !== undefined &&
      behavior.gainMovement !== undefined
    ) {
      next.gainMovement = step.gainMovement;
    }
    if (step.gainIncome !== undefined && behavior.gainIncome !== undefined) {
      next.gainIncome = step.gainIncome;
    }
    if (step.drawCards !== undefined && behavior.drawCards !== undefined) {
      next.drawCards = step.drawCards;
    }
    if (
      step.drawAnyCards !== undefined &&
      behavior.drawAnyCards !== undefined
    ) {
      next.drawAnyCards = step.drawAnyCards;
    }
    if (step.launchProbe && behavior.launchProbe) {
      next.launchProbe = true;
    }
    if (step.orbit && behavior.orbit) {
      next.orbit = true;
    }
    if (step.land && behavior.land) {
      next.land = true;
    }
    if (step.tuckForIncome && behavior.tuckForIncome) {
      next.tuckForIncome = true;
    }
    if (step.scan && behavior.scan) {
      next.scan = step.scan;
    }
    if (
      step.researchTech !== undefined &&
      behavior.researchTech !== undefined
    ) {
      next.researchTech = step.researchTech;
    }
    if (step.markTrace !== undefined && behavior.markTrace !== undefined) {
      next.markTrace = step.markTrace;
    }
    if (
      step.markAnySignal !== undefined &&
      behavior.markAnySignal !== undefined
    ) {
      next.markAnySignal = step.markAnySignal;
    }
    if (
      step.markDisplayCardSignal !== undefined &&
      behavior.markDisplayCardSignal !== undefined
    ) {
      next.markDisplayCardSignal = step.markDisplayCardSignal;
    }
    if (step.rotateSolarSystem && behavior.rotateSolarSystem) {
      next.rotateSolarSystem = true;
    }
    if (
      step.gainExofossils !== undefined &&
      behavior.gainExofossils !== undefined
    ) {
      next.gainExofossils = step.gainExofossils;
    }
    const allowedCustom = new Set(behavior.custom ?? []);
    const custom = step.custom?.filter((id) => allowedCustom.has(id));
    if (custom && custom.length > 0) {
      next.custom = custom;
    }
    return next;
  }

  private hasExecutableBehavior(behavior: IBehavior): boolean {
    return Object.entries(behavior).some(
      ([key, value]) =>
        key !== 'effectSequence' &&
        value !== undefined &&
        (!Array.isArray(value) || value.length > 0),
    );
  }

  private buildDeferredActions(
    behavior: IBehavior,
    player: IPlayer,
    card: ICard,
    options: IBuildActionOptions = {},
  ): SimpleDeferredAction[] {
    return [
      this.buildSpendResourcesAction(behavior, player),
      this.buildGainResourcesAction(behavior, player),
      this.buildGainScoreAction(behavior, player),
      this.buildGainMovementAction(behavior, player),
      this.buildGainIncomeAction(behavior, player),
      this.buildTuckForIncomeAction(behavior, player),
      this.buildDrawCardsAction(behavior, player),
      this.buildDrawAnyCardsAction(behavior, player),
      this.buildLaunchProbeAction(behavior, player),
      this.buildOrbitAction(behavior, player),
      this.buildLandAction(behavior, player, card),
      this.buildScanAction(behavior, player, card),
      this.buildResearchTechAction(behavior, player),
      this.buildMarkTraceAction(behavior, player),
      this.buildMarkAnySignalAction(behavior, player),
      this.buildMarkDisplayCardSignalAction(behavior, player),
      this.buildRotateAction(behavior, player, options),
      this.buildGainExofossilsAction(behavior, player),
      ...this.buildCustomActions(behavior, player, card),
    ].filter((action): action is SimpleDeferredAction => action !== undefined);
  }

  private buildSpendResourcesAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    const spendResources = behavior.spendResources;
    if (!spendResources) return undefined;
    return new SimpleDeferredAction(
      player,
      () => {
        player.resources.spend(spendResources);
        return undefined;
      },
      EPriority.COST,
    );
  }

  private buildGainResourcesAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    const gainResources = behavior.gainResources;
    if (!gainResources) return undefined;
    return buildCoreEffectAction(player, () => {
      player.resources.gain(gainResources);
      return undefined;
    });
  }

  private buildGainScoreAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    const gainScore = behavior.gainScore;
    if (!gainScore) return undefined;
    return buildCoreEffectAction(player, () => {
      player.score += gainScore;
      return undefined;
    });
  }

  private buildGainMovementAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    const gainMovement = behavior.gainMovement;
    if (!gainMovement) return undefined;
    return buildCoreEffectAction(player, () => {
      player.gainMove(gainMovement);
      return undefined;
    });
  }

  private buildGainIncomeAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    const gainIncome = behavior.gainIncome;
    if (!gainIncome) return undefined;
    return buildCoreEffectAction(player, () => {
      const incomeResource = toIncomeBundle(gainIncome);
      if (incomeResource !== undefined) {
        player.income.addTuckedIncome(incomeResource);
      }
      return undefined;
    });
  }

  private buildTuckForIncomeAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    if (!behavior.tuckForIncome) return undefined;
    return buildCoreEffectAction(player, (game) => {
      return TuckCardForIncomeEffect.execute(player, game);
    });
  }

  private buildDrawCardsAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    const drawCards = behavior.drawCards;
    if (!drawCards || drawCards <= 0) return undefined;
    return buildCoreEffectAction(player, (game) => {
      const drawnCards: string[] = [];
      for (let i = 0; i < drawCards; i += 1) {
        const drawn = game.mainDeck.drawWithReshuffle(game.random);
        if (drawn === undefined) {
          break;
        }
        drawnCards.push(drawn);
      }
      if (drawnCards.length > 0) {
        player.hand.push(...drawnCards);
        game.lockCurrentTurn();
      }
      RefillCardRowEffect.execute(game);
      return undefined;
    });
  }

  private buildDrawAnyCardsAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    const drawAnyCards = behavior.drawAnyCards;
    if (!drawAnyCards || drawAnyCards <= 0) return undefined;
    return buildCoreEffectAction(player, (game) =>
      AnyCardChoiceEffect.execute(player, game, drawAnyCards),
    );
  }

  private buildLaunchProbeAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    if (!behavior.launchProbe) return undefined;
    return buildCoreEffectAction(player, (game) => {
      if (!LaunchProbeEffect.canExecute(player, game)) return undefined;
      LaunchProbeEffect.execute(player, game);
      return undefined;
    });
  }

  private buildOrbitAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    if (!behavior.orbit) return undefined;
    return buildCoreEffectAction(player, (game) => {
      const orbitablePlanets = ORBITABLE_PLANETS.filter((planet) =>
        OrbitProbeEffect.canExecute(player, game, planet),
      );
      if (orbitablePlanets.length === 0) return undefined;

      const options = orbitablePlanets.map((planet) => ({
        id: `orbit-${planet}`,
        label: `Orbit ${planet}`,
        onSelect: () => {
          return OrbitProbeEffect.execute(player, game, planet).pendingInput;
        },
      }));
      return new SelectOption(player, options, 'Select a planet to orbit');
    });
  }

  private buildLandAction(
    behavior: IBehavior,
    player: IPlayer,
    _card: ICard,
  ): SimpleDeferredAction | undefined {
    if (!behavior.land) return undefined;
    return buildCoreEffectAction(player, (game) =>
      buildLandPlanetSelection(player, game, {
        prompt: 'Select a planet to land on',
        includeSkipOption: false,
        payCost: false,
      }),
    );
  }

  private buildScanAction(
    behavior: IBehavior,
    player: IPlayer,
    _card: ICard,
  ): SimpleDeferredAction | undefined {
    if (!behavior.scan) return undefined;
    return buildCoreEffectAction(player, (game) => {
      const colorMarks: ESector[] = behavior.scan?.markSectors ?? [];
      const hasScanAction =
        behavior.scan?.markEarthSectorIndex !== undefined ||
        behavior.scan?.markCardSector === true;
      const continueWithColorMarks = () =>
        MarkSectorSignalEffect.markByColorChain(player, game, colorMarks);

      if (hasScanAction) {
        return ScanEffect.execute(player, game, {
          onComplete: () => continueWithColorMarks(),
        });
      }

      return continueWithColorMarks();
    });
  }

  private buildResearchTechAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    const researchTech = behavior.researchTech;
    if (!researchTech) return undefined;
    return buildCoreEffectAction(player, (game) => {
      const filter = {
        mode: 'category' as const,
        categories: toResearchCategories(researchTech),
      };
      if (!ResearchTechEffect.canExecute(player, game, filter)) {
        return undefined;
      }
      return ResearchTechAction.execute(player, game, true, filter, {
        // Card-granted tech only rotates when the card has an explicit
        // ROTATE effect. Main RESEARCH_TECH action keeps its own rotation.
        skipRotation: true,
      });
    });
  }

  private buildMarkTraceAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    if (!behavior.markTrace) return undefined;
    return buildCoreEffectAction(player, (game) => {
      const trace = behavior.markTrace as ETrace;
      if (!game.alienState) {
        player.traces[trace] = (player.traces[trace] ?? 0) + 1;
        game.eventLog.append(
          createActionEvent(player.id, 'CARD_MARK_TRACE', {
            trace,
          }),
        );
        return undefined;
      }
      return game.alienState.createTraceInput(player, game, trace);
    });
  }

  private buildRotateAction(
    behavior: IBehavior,
    player: IPlayer,
    options: IBuildActionOptions,
  ): SimpleDeferredAction | undefined {
    if (!behavior.rotateSolarSystem) return undefined;
    return new SimpleDeferredAction(
      player,
      (game) => {
        RotateDiscEffect.execute(game);
        return undefined;
      },
      options.preserveEffectOrder ? EPriority.CORE_EFFECT : EPriority.ROTATION,
    );
  }

  private buildMarkAnySignalAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    const count = behavior.markAnySignal ?? 0;
    if (count <= 0) return undefined;
    return buildCoreEffectAction(player, (game) =>
      game.mark(EMarkSource.ANY, count, player.id),
    );
  }

  private buildMarkDisplayCardSignalAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    const count = behavior.markDisplayCardSignal ?? 0;
    if (count <= 0) return undefined;
    return buildCoreEffectAction(player, (game) =>
      game.mark(EMarkSource.CARD_ROW, count, player.id),
    );
  }

  private buildGainExofossilsAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    const gainExofossils = behavior.gainExofossils;
    if (!gainExofossils || gainExofossils <= 0) return undefined;
    return buildCoreEffectAction(player, () => {
      player.gainExofossils(gainExofossils);
      return undefined;
    });
  }

  private buildCustomActions(
    behavior: IBehavior,
    player: IPlayer,
    card: ICard,
  ): Array<SimpleDeferredAction | undefined> {
    const customIds = behavior.custom ?? [];
    return customIds.map((customId) => {
      const handler = this.customHandlers.get(customId);
      if (!handler) {
        return buildCoreEffectAction(player, (game) => {
          game.eventLog.append(
            createActionEvent(player.id, 'CARD_CUSTOM_EFFECT_UNHANDLED', {
              cardId: card.id,
              customId,
            }),
          );
          return undefined;
        });
      }
      return buildCoreEffectAction(player, (game) =>
        handler(player, game, card),
      );
    });
  }
}

const defaultBehaviorExecutor = new BehaviorExecutor();

export function getBehaviorExecutor(): BehaviorExecutor {
  return defaultBehaviorExecutor;
}
