import { ORGANIZATIONS_BY_ID } from '@seti/common/data/organizations';
import { EResource } from '@seti/common/types/element';
import {
  DEFAULT_PLAYER_ACTION_COSTS,
  EOrganizationId,
  type IOrganizationData,
} from '@seti/common/types/organization';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import type { ETechId } from '@seti/common/types/tech';
import { GameError } from '@/shared/errors/GameError.js';
import { LaunchProbeEffect } from '../effects/probe/LaunchProbeEffect.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import type { IPlayer } from '../player/IPlayer.js';
import type { ISetupRole } from '../setup/ISetupRole.js';

export interface IOrganizationMainActionPayload
  extends Record<string, unknown> {
  organizationId?: EOrganizationId;
  actionId?: string;
}

export abstract class Organization implements ISetupRole {
  public readonly id: IOrganizationData['id'];

  public readonly name: string;

  public readonly data: IOrganizationData;

  public constructor(id: EOrganizationId) {
    const data = ORGANIZATIONS_BY_ID[id];
    if (!data) {
      throw new Error(`Unknown organization id: ${id}`);
    }
    this.id = id;
    this.name = data.name;
    this.data = data;
  }

  public hasImplementedPower(): boolean {
    return false;
  }

  public hasImplementedMainAction(): boolean {
    return false;
  }

  public resolve(player: IPlayer, game: IGame): void {
    if (player.organizationIds.includes(this.id)) {
      this.restore(player, game);
      return;
    }

    player.organizationIds.push(this.id);
    player.organizationState[this.id] ??= {};
    player.oncePerRoundUsed[this.id] = false;
    player.actionCosts = {
      ...DEFAULT_PLAYER_ACTION_COSTS,
      ...player.actionCosts,
    };

    player.resources.gain({
      credits: this.data.setup.resources.credit,
      energy: this.data.setup.resources.energy,
      publicity: this.data.setup.resources.publicity,
      data: this.data.setup.resources.data,
    });
    player.income.addBaseIncome(EResource.CREDIT, this.data.income.credit);
    player.income.addBaseIncome(EResource.ENERGY, this.data.income.energy);
    player.income.addBaseIncome(EResource.CARD, this.data.income.card);
    player.income.addBaseIncome(
      EResource.PUBLICITY,
      this.data.income.publicity,
    );
    player.income.addBaseIncome(EResource.DATA, this.data.income.data);
    player.income.addBaseIncome(
      EResource.SIGNAL_TOKEN,
      this.data.income.signalToken,
    );
    player.hand.push(...game.mainDeck.drawN(this.data.setup.resources.card));
    player.pendingSetupTucks = this.data.setup.tuckIncome;

    for (let index = 0; index < this.data.setup.probes; index += 1) {
      LaunchProbeEffect.execute(player, game, { ignoreLimit: true });
    }

    this.afterResolve(player, game);
    this.restore(player, game);
  }

  public restore(player: IPlayer, game: IGame): void {
    player.organizationState[this.id] ??= {};
    player.oncePerRoundUsed[this.id] ??= false;
    this.applyPlayerConfig(player, game);
    this.registerEvents(player, game);
  }

  public canUsePower(_player: IPlayer, _game: IGame): boolean {
    return false;
  }

  public canUsePowerAfterOncePerRoundUsed(
    _player: IPlayer,
    _game: IGame,
  ): boolean {
    return false;
  }

  public usePower(_player: IPlayer, _game: IGame): IPlayerInput | undefined {
    throw new GameError(
      EErrorCode.INVALID_FREE_ACTION,
      'Organization free-action powers are not implemented for this organization',
      { organizationId: this.id },
    );
  }

  public canUseMainAction(
    _player: IPlayer,
    _game: IGame,
    _payload: IOrganizationMainActionPayload = {},
  ): boolean {
    return false;
  }

  public useMainAction(
    _player: IPlayer,
    _game: IGame,
    _payload: IOrganizationMainActionPayload = {},
  ): IPlayerInput | undefined {
    throw new GameError(
      EErrorCode.INVALID_ACTION,
      'Organization main actions are not implemented for this organization',
      { organizationId: this.id },
    );
  }

  public getEffectiveTechIds(
    _player: IPlayer,
    _game: IGame,
    techIds: ETechId[],
  ): ETechId[] {
    return techIds;
  }

  protected afterResolve(_player: IPlayer, _game: IGame): void {
    return undefined;
  }

  protected applyPlayerConfig(_player: IPlayer, _game: IGame): void {
    return undefined;
  }

  protected registerEvents(_player: IPlayer, _game: IGame): void {
    return undefined;
  }

  protected getEventOwner(player: IPlayer): string {
    return `organization:${player.id}:${this.id}`;
  }
}
