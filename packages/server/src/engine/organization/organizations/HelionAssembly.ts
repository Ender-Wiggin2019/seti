import { ETech } from '@seti/common/types/element';
import { EOrganizationId } from '@seti/common/types/organization';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { ETechId, getTechDescriptor } from '@seti/common/types/tech';
import { GameError } from '@/shared/errors/GameError.js';
import { EPriority } from '../../deferred/Priority.js';
import { SimpleDeferredAction } from '../../deferred/SimpleDeferredAction.js';
import { TuckCardForIncomeEffect } from '../../effects/income/TuckCardForIncomeEffect.js';
import { EGameRuntimeEvent } from '../../events/GameEventBus.js';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import { SelectOption } from '../../input/SelectOption.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { Organization } from '../Organization.js';

interface IHelionState {
  markedCategories?: ETech[];
  pendingCategories?: ETech[];
  disabledTechIds?: ETechId[];
}

type THelionRewardCategory = ETech.PROBE | ETech.SCAN | ETech.COMPUTER;

const HELION_REWARD_BY_CATEGORY = {
  [ETech.PROBE]: { energy: 1 },
  [ETech.SCAN]: { signalTokens: 1 },
  [ETech.COMPUTER]: { data: 1 },
} as const;

export class HelionAssembly extends Organization {
  public constructor() {
    super(EOrganizationId.HELION_ASSEMBLY);
  }

  public override hasImplementedPower(): boolean {
    return true;
  }

  public override canUsePower(player: IPlayer, _game: IGame): boolean {
    return (
      this.hasMarkedCategory(player) &&
      player.hand.length > 0 &&
      this.getDisableableTechIds(player).length > 0
    );
  }

  public override usePower(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
    if (!this.hasMarkedCategory(player)) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'Helion Assembly requires a marked tech category',
        { playerId: player.id },
      );
    }

    const techIds = this.getDisableableTechIds(player);
    if (techIds.length === 1) {
      return this.disableTechAndTuck(player, game, techIds[0]);
    }

    return new SelectOption(
      player,
      techIds.map((techId) => ({
        id: techId,
        label: techId,
        onSelect: () => this.disableTechAndTuck(player, game, techId),
      })),
      'Choose a Helion Assembly tech to disable',
    );
  }

  public getEffectiveTechIds(
    player: IPlayer,
    _game: IGame,
    techIds: ETechId[],
  ): ETechId[] {
    const disabled = new Set(this.getState(player).disabledTechIds ?? []);
    return techIds.filter((techId) => !disabled.has(techId));
  }

  protected override registerEvents(player: IPlayer, game: IGame): void {
    const owner = this.getEventOwner(player);
    game.eventBus.unsubscribeOwner(owner);
    game.eventBus.subscribe(
      EGameRuntimeEvent.TECH_ACQUIRED,
      (context) => {
        if (!player.organizationIds.includes(this.id)) return undefined;
        if ((context.player as IPlayer | undefined)?.id !== player.id) {
          return undefined;
        }

        const category = context.techCategory;
        if (!this.isRewardCategory(category)) return undefined;

        const state = this.getState(player);
        const markedCategories = state.markedCategories ?? [];
        if (markedCategories.includes(category)) return undefined;
        if ((state.pendingCategories ?? []).includes(category)) {
          return undefined;
        }

        this.setState(player, {
          ...state,
          pendingCategories: [...(state.pendingCategories ?? []), category],
        });

        game.deferredActions.push(
          new SimpleDeferredAction(
            player,
            () => this.createMarkChoiceInput(player, category),
            EPriority.DEFAULT,
          ),
        );
        return undefined;
      },
      { owner },
    );
  }

  private createMarkChoiceInput(
    player: IPlayer,
    category: THelionRewardCategory,
  ): IPlayerInput | undefined {
    return new SelectOption(
      player,
      [
        {
          id: 'mark',
          label: 'Mark reward',
          onSelect: () => {
            this.markCategory(player, category);
            return undefined;
          },
        },
        {
          id: 'skip',
          label: 'Skip',
          onSelect: () => {
            this.clearPendingCategory(player, category);
            return undefined;
          },
        },
      ],
      'Mark Helion Assembly reward?',
    );
  }

  private markCategory(player: IPlayer, category: THelionRewardCategory): void {
    const state = this.getState(player);
    const markedCategories = state.markedCategories ?? [];
    if (markedCategories.includes(category)) return;

    player.resources.gain(HELION_REWARD_BY_CATEGORY[category]);
    this.setState(player, {
      ...state,
      markedCategories: [...markedCategories, category],
      pendingCategories: (state.pendingCategories ?? []).filter(
        (candidate) => candidate !== category,
      ),
    });
  }

  private clearPendingCategory(
    player: IPlayer,
    category: THelionRewardCategory,
  ): void {
    const state = this.getState(player);
    this.setState(player, {
      ...state,
      pendingCategories: (state.pendingCategories ?? []).filter(
        (candidate) => candidate !== category,
      ),
    });
  }

  private disableTechAndTuck(
    player: IPlayer,
    game: IGame,
    techId: ETechId,
  ): IPlayerInput | undefined {
    const state = this.getState(player);
    this.setState(player, {
      ...state,
      markedCategories: [],
      pendingCategories: [],
      disabledTechIds: [...new Set([...(state.disabledTechIds ?? []), techId])],
    });
    player.oncePerRoundUsed[this.id] = true;
    return TuckCardForIncomeEffect.execute(player, game, {
      allowSkip: false,
    });
  }

  private getDisableableTechIds(player: IPlayer): ETechId[] {
    const disabled = new Set(this.getState(player).disabledTechIds ?? []);
    return player.techs.filter((techId) => {
      if (disabled.has(techId)) return false;
      const category = getTechDescriptor(techId).type;
      return category === ETech.PROBE || category === ETech.SCAN;
    });
  }

  private hasMarkedCategory(player: IPlayer): boolean {
    return (this.getState(player).markedCategories ?? []).length > 0;
  }

  private getState(player: IPlayer): IHelionState {
    return (player.organizationState[this.id] ?? {}) as IHelionState;
  }

  private setState(player: IPlayer, state: IHelionState): void {
    player.organizationState[this.id] = state as Record<string, unknown>;
  }

  private isRewardCategory(
    category: unknown,
  ): category is THelionRewardCategory {
    return (
      category === ETech.PROBE ||
      category === ETech.SCAN ||
      category === ETech.COMPUTER
    );
  }
}
