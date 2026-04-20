import {
  EResource,
  type ESector,
  ETech,
  type ETrace,
} from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import type { TTechCategory } from '@seti/common/types/tech';
import { EPriority } from '../deferred/Priority.js';
import { SimpleDeferredAction } from '../deferred/SimpleDeferredAction.js';
import { TuckCardForIncomeEffect } from '../effects/income/TuckCardForIncomeEffect.js';
import {
  buildLandPlanetSelection,
  LaunchProbeEffect,
  MarkSectorSignalEffect,
  OrbitProbeEffect,
  RefillCardRowEffect,
  ResearchTechEffect,
  RotateDiscEffect,
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
];

type TCustomBehaviorHandler = (
  player: IPlayer,
  game: IGame,
  card: ICard,
) => IPlayerInput | undefined;

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
    if (behavior.launchProbe && !LaunchProbeEffect.canExecute(player, game)) {
      return false;
    }
    if (
      behavior.researchTech &&
      !ResearchTechEffect.canExecute(player, game, {
        mode: 'category',
        categories: toResearchCategories(behavior.researchTech),
      })
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
    const deferredActions = [
      this.buildSpendResourcesAction(behavior, player),
      this.buildGainResourcesAction(behavior, player),
      this.buildGainScoreAction(behavior, player),
      this.buildGainMovementAction(behavior, player),
      this.buildGainIncomeAction(behavior, player),
      this.buildTuckForIncomeAction(behavior, player),
      this.buildDrawCardsAction(behavior, player),
      this.buildLaunchProbeAction(behavior, player),
      this.buildOrbitAction(behavior, player),
      this.buildLandAction(behavior, player, card),
      this.buildScanAction(behavior, player, card),
      this.buildResearchTechAction(behavior, player),
      this.buildMarkTraceAction(behavior, player),
      this.buildMarkAnySignalAction(behavior, player),
      this.buildMarkDisplayCardSignalAction(behavior, player),
      this.buildMarkSignalTokenAction(behavior, player),
      this.buildRotateAction(behavior, player),
      ...this.buildCustomActions(behavior, player, card),
    ].filter((action): action is SimpleDeferredAction => action !== undefined);

    game.deferredActions.pushMultiple(deferredActions);
    return undefined;
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
    return new SimpleDeferredAction(player, () => {
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
    return new SimpleDeferredAction(player, () => {
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
    return new SimpleDeferredAction(player, () => {
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
    return new SimpleDeferredAction(player, () => {
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
    return new SimpleDeferredAction(player, (game) => {
      return TuckCardForIncomeEffect.execute(player, game);
    });
  }

  private buildDrawCardsAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    const drawCards = behavior.drawCards;
    if (!drawCards || drawCards <= 0) return undefined;
    return new SimpleDeferredAction(player, (game) => {
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
      }
      RefillCardRowEffect.execute(game);
      return undefined;
    });
  }

  private buildLaunchProbeAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    if (!behavior.launchProbe) return undefined;
    return new SimpleDeferredAction(player, (game) => {
      LaunchProbeEffect.execute(player, game);
      return undefined;
    });
  }

  private buildOrbitAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    if (!behavior.orbit) return undefined;
    return new SimpleDeferredAction(player, (game) => {
      const orbitablePlanets = ORBITABLE_PLANETS.filter((planet) =>
        OrbitProbeEffect.canExecute(player, game, planet),
      );
      if (orbitablePlanets.length === 0) return undefined;

      const options = orbitablePlanets.map((planet) => ({
        id: `orbit-${planet}`,
        label: `Orbit ${planet}`,
        onSelect: () => {
          OrbitProbeEffect.execute(player, game, planet);
          return undefined;
        },
      }));
      options.push({
        id: 'skip-orbit',
        label: 'Skip orbit',
        onSelect: () => undefined,
      });
      return new SelectOption(player, options, 'Select a planet to orbit');
    });
  }

  private buildLandAction(
    behavior: IBehavior,
    player: IPlayer,
    _card: ICard,
  ): SimpleDeferredAction | undefined {
    if (!behavior.land) return undefined;
    return new SimpleDeferredAction(player, (game) =>
      buildLandPlanetSelection(player, game, {
        prompt: 'Select a planet to land on',
      }),
    );
  }

  private buildScanAction(
    behavior: IBehavior,
    player: IPlayer,
    card: ICard,
  ): SimpleDeferredAction | undefined {
    if (!behavior.scan) return undefined;
    return new SimpleDeferredAction(player, (game) => {
      if (behavior.scan?.markEarthSectorIndex !== undefined) {
        MarkSectorSignalEffect.markByIndex(
          player,
          game,
          behavior.scan.markEarthSectorIndex,
        );
      }

      const colorMarks: ESector[] = [];
      if (behavior.scan?.markCardSector && card.sector) {
        colorMarks.push(card.sector);
      }
      colorMarks.push(...(behavior.scan?.markSectors ?? []));

      return MarkSectorSignalEffect.markByColorChain(player, game, colorMarks);
    });
  }

  private buildResearchTechAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    const researchTech = behavior.researchTech;
    if (!researchTech) return undefined;
    // Rotation is decoupled from the tech-grant at the card layer: a card
    // with a printed ROTATE icon produces its rotation via
    // `buildRotateAction`, so the research effect itself must not rotate
    // (otherwise cards like 71/109 would rotate twice).
    return new SimpleDeferredAction(player, (game) =>
      ResearchTechEffect.execute(player, game, {
        filter: {
          mode: 'category',
          categories: toResearchCategories(researchTech),
        },
      }),
    );
  }

  private buildMarkTraceAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    if (!behavior.markTrace) return undefined;
    return new SimpleDeferredAction(player, (game) => {
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
  ): SimpleDeferredAction | undefined {
    if (!behavior.rotateSolarSystem) return undefined;
    return new SimpleDeferredAction(
      player,
      (game) => {
        RotateDiscEffect.execute(game);
        return undefined;
      },
      EPriority.ROTATION,
    );
  }

  private buildMarkAnySignalAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    const count = behavior.markAnySignal ?? 0;
    if (count <= 0) return undefined;
    return new SimpleDeferredAction(player, (game) =>
      game.mark(EMarkSource.ANY, count, player.id),
    );
  }

  private buildMarkDisplayCardSignalAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    const count = behavior.markDisplayCardSignal ?? 0;
    if (count <= 0) return undefined;
    return new SimpleDeferredAction(player, (game) =>
      game.mark(EMarkSource.CARD_ROW, count, player.id),
    );
  }

  private buildMarkSignalTokenAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    const count = behavior.markSignalToken ?? 0;
    if (count <= 0) return undefined;
    return new SimpleDeferredAction(player, (game) =>
      game.mark(EMarkSource.ANY, count, player.id),
    );
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
        return new SimpleDeferredAction(player, (game) => {
          game.eventLog.append(
            createActionEvent(player.id, 'CARD_CUSTOM_EFFECT_UNHANDLED', {
              cardId: card.id,
              customId,
            }),
          );
          return undefined;
        });
      }
      return new SimpleDeferredAction(player, (game) =>
        handler(player, game, card),
      );
    });
  }
}

const defaultBehaviorExecutor = new BehaviorExecutor();

export function getBehaviorExecutor(): BehaviorExecutor {
  return defaultBehaviorExecutor;
}
