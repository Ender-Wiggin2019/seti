import { ETech } from '@seti/common/types/element';
import { EOrganizationId } from '@seti/common/types/organization';
import {
  ETechId,
  getTechDescriptor,
  getTechIdsForCategory,
} from '@seti/common/types/tech';
import { EGameRuntimeEvent } from '../../events/GameEventBus.js';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import { SelectOption } from '../../input/SelectOption.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { Organization } from '../Organization.js';

interface ITuringState {
  temporaryTechId?: ETechId;
}

const TURING_TEMPORARY_TECH_IDS = [
  ...getTechIdsForCategory(ETech.PROBE),
  ...getTechIdsForCategory(ETech.SCAN),
];

export class TuringSystems extends Organization {
  public constructor() {
    super(EOrganizationId.TURING_SYSTEMS);
  }

  public override hasImplementedPower(): boolean {
    return true;
  }

  public override canUsePower(_player: IPlayer, _game: IGame): boolean {
    return true;
  }

  public override usePower(
    player: IPlayer,
    _game: IGame,
  ): IPlayerInput | undefined {
    return new SelectOption(
      player,
      TURING_TEMPORARY_TECH_IDS.map((techId) => ({
        id: techId,
        label: techId,
        onSelect: () => {
          this.setState(player, { temporaryTechId: techId });
          player.oncePerRoundUsed[this.id] = true;
          return undefined;
        },
      })),
      'Choose a temporary Turing Systems tech',
    );
  }

  public getEffectiveTechIds(
    player: IPlayer,
    _game: IGame,
    techIds: ETechId[],
  ): ETechId[] {
    const temporaryTechId = this.getState(player).temporaryTechId;
    if (!temporaryTechId || techIds.includes(temporaryTechId)) {
      return techIds;
    }
    return [...techIds, temporaryTechId];
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

        const techId = context.techId as ETechId | undefined;
        const category =
          context.techCategory ??
          (techId ? getTechDescriptor(techId).type : undefined);
        if (category === ETech.COMPUTER) {
          player.resources.gain({ publicity: 1 });
        }
        return undefined;
      },
      { owner },
    );
    game.eventBus.subscribe(
      EGameRuntimeEvent.TURN_END,
      (context) => {
        if (context.playerId === player.id) {
          this.setState(player, {});
        }
        return undefined;
      },
      { owner },
    );
  }

  private getState(player: IPlayer): ITuringState {
    return (player.organizationState[this.id] ?? {}) as ITuringState;
  }

  private setState(player: IPlayer, state: ITuringState): void {
    player.organizationState[this.id] = state as Record<string, unknown>;
  }
}
