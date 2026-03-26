import { EResource, ETech, type ETrace } from '@seti/common/types/element';
import type { TTechCategory } from '@seti/common/types/tech';
import { EPriority } from '../deferred/Priority.js';
import { SimpleDeferredAction } from '../deferred/SimpleDeferredAction.js';
import {
  LaunchProbeEffect,
  MarkSectorSignalEffect,
  RefillCardRowEffect,
  ResearchTechEffect,
  RotateDiscEffect,
} from '../effects/index.js';
import { createActionEvent } from '../event/GameEvent.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import type { IPlayer } from '../player/IPlayer.js';
import type { IBehavior } from './Behavior.js';
import type { ICard } from './ICard.js';

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
      this.buildDrawCardsAction(behavior, player),
      this.buildLaunchProbeAction(behavior, player),
      this.buildScanAction(behavior, player, card),
      this.buildResearchTechAction(behavior, player),
      this.buildMarkTraceAction(behavior, player),
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
    if (!behavior.spendResources) return undefined;
    return new SimpleDeferredAction(
      player,
      () => {
        player.resources.spend(behavior.spendResources!);
        return undefined;
      },
      EPriority.COST,
    );
  }

  private buildGainResourcesAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    if (!behavior.gainResources) return undefined;
    return new SimpleDeferredAction(player, () => {
      player.resources.gain(behavior.gainResources!);
      return undefined;
    });
  }

  private buildGainScoreAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    if (!behavior.gainScore) return undefined;
    return new SimpleDeferredAction(player, () => {
      player.score += behavior.gainScore!;
      return undefined;
    });
  }

  private buildGainMovementAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    if (!behavior.gainMovement) return undefined;
    return new SimpleDeferredAction(player, () => {
      player.gainMove(behavior.gainMovement!);
      return undefined;
    });
  }

  private buildGainIncomeAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    if (!behavior.gainIncome) return undefined;
    return new SimpleDeferredAction(player, () => {
      const incomeResource = toIncomeBundle(behavior.gainIncome!);
      if (incomeResource !== undefined) {
        player.income.addTuckedIncome(incomeResource);
      }
      return undefined;
    });
  }

  private buildDrawCardsAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    if (!behavior.drawCards || behavior.drawCards <= 0) return undefined;
    return new SimpleDeferredAction(player, (game) => {
      const drawnCards: unknown[] = [];
      for (let i = 0; i < behavior.drawCards!; i += 1) {
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
      if (behavior.scan?.markCardSector && card.sector) {
        MarkSectorSignalEffect.markByColor(player, game, card.sector);
      }
      for (const sectorColor of behavior.scan?.markSectors ?? []) {
        MarkSectorSignalEffect.markByColor(player, game, sectorColor);
      }
      return undefined;
    });
  }

  private buildResearchTechAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    if (!behavior.researchTech) return undefined;
    return new SimpleDeferredAction(player, (game) => {
      return ResearchTechEffect.execute(player, game, {
        filter: {
          mode: 'category',
          categories: toResearchCategories(behavior.researchTech!),
        },
      });
    });
  }

  private buildMarkTraceAction(
    behavior: IBehavior,
    player: IPlayer,
  ): SimpleDeferredAction | undefined {
    if (!behavior.markTrace) return undefined;
    return new SimpleDeferredAction(player, (game) => {
      game.eventLog.append(
        createActionEvent(player.id, 'CARD_MARK_TRACE', {
          trace: behavior.markTrace as ETrace,
        }),
      );
      return undefined;
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
