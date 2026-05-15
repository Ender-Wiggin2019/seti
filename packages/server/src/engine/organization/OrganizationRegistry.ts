import { EOrganizationId } from '@seti/common/types/organization';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import type { ETechId } from '@seti/common/types/tech';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import type { IPlayer } from '../player/IPlayer.js';
import {
  type IOrganizationMainActionPayload,
  Organization,
} from './Organization.js';
import { CosmosStrategyGroup } from './organizations/CosmosStrategyGroup.js';
import { DeepSkySurvey } from './organizations/DeepSkySurvey.js';
import { FenwickResearchCenter } from './organizations/FenwickResearchCenter.js';
import { FuturespanInstitute } from './organizations/FuturespanInstitute.js';
import { HelionAssembly } from './organizations/HelionAssembly.js';
import { MissionRelay } from './organizations/MissionRelay.js';
import { OrbitalDynamics } from './organizations/OrbitalDynamics.js';
import { SentinelProbeNetwork } from './organizations/SentinelProbeNetwork.js';
import { StratusCore } from './organizations/StratusCore.js';
import { TuringSystems } from './organizations/TuringSystems.js';
import { Xenolab } from './organizations/Xenolab.js';

type TOrganizationFactory = () => Organization;

const ORGANIZATION_FACTORIES: Record<EOrganizationId, TOrganizationFactory> = {
  [EOrganizationId.COSMOS_STRATEGY_GROUP]: () => new CosmosStrategyGroup(),
  [EOrganizationId.DEEP_SKY_SURVEY]: () => new DeepSkySurvey(),
  [EOrganizationId.FENWICK_RESEARCH_CENTER]: () => new FenwickResearchCenter(),
  [EOrganizationId.FUTURESPAN_INSTITUTE]: () => new FuturespanInstitute(),
  [EOrganizationId.HELION_ASSEMBLY]: () => new HelionAssembly(),
  [EOrganizationId.MISSION_RELAY]: () => new MissionRelay(),
  [EOrganizationId.ORBITAL_DYNAMICS]: () => new OrbitalDynamics(),
  [EOrganizationId.SENTINEL_PROBE_NETWORK]: () => new SentinelProbeNetwork(),
  [EOrganizationId.STRATUS_CORE]: () => new StratusCore(),
  [EOrganizationId.TURING_SYSTEMS]: () => new TuringSystems(),
  [EOrganizationId.XENOLAB]: () => new Xenolab(),
};

export class OrganizationRegistry {
  public static getAllIds(): EOrganizationId[] {
    return Object.values(EOrganizationId);
  }

  public static create(id: EOrganizationId): Organization {
    const factory = ORGANIZATION_FACTORIES[id];
    if (!factory) {
      throw new Error(`Unknown organization id: ${id}`);
    }
    return factory();
  }

  public static restorePlayerOrganizations(
    game: IGame,
    player?: IPlayer,
  ): void {
    const players = player ? [player] : game.players;
    for (const currentPlayer of players) {
      for (const organizationId of currentPlayer.organizationIds) {
        this.create(organizationId).restore(currentPlayer, game);
      }
    }
  }

  public static getUsablePowerIds(
    player: IPlayer,
    game: IGame,
  ): EOrganizationId[] {
    return player.organizationIds.filter((organizationId) => {
      if (player.oncePerRoundUsed[organizationId] === true) {
        return false;
      }
      const organization = this.create(organizationId);
      return (
        organization.hasImplementedPower() &&
        organization.canUsePower(player, game)
      );
    });
  }

  public static getUsableMainActionIds(
    player: IPlayer,
    game: IGame,
  ): EOrganizationId[] {
    return player.organizationIds.filter((organizationId) => {
      const organization = this.create(organizationId);
      return (
        organization.hasImplementedMainAction() &&
        organization.canUseMainAction(player, game, { organizationId })
      );
    });
  }

  public static useMainAction(
    player: IPlayer,
    game: IGame,
    organizationId: EOrganizationId,
    payload: IOrganizationMainActionPayload = {},
  ): IPlayerInput | undefined {
    if (!player.organizationIds.includes(organizationId)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Player does not own this organization',
        { playerId: player.id, organizationId },
      );
    }

    const organization = this.create(organizationId);
    organization.restore(player, game);
    const actionPayload = { ...payload, organizationId };
    if (!organization.hasImplementedMainAction()) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Organization main actions are not implemented for this organization',
        { playerId: player.id, organizationId },
      );
    }

    if (!organization.canUseMainAction(player, game, actionPayload)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Organization main action is not currently available',
        { playerId: player.id, organizationId },
      );
    }

    return organization.useMainAction(player, game, actionPayload);
  }

  public static getEffectiveTechIds(player: IPlayer, game: IGame): ETechId[] {
    let effectiveTechIds = [...player.techs];
    for (const organizationId of player.organizationIds) {
      const organization = this.create(organizationId);
      effectiveTechIds = organization.getEffectiveTechIds(
        player,
        game,
        effectiveTechIds,
      );
    }
    return [...new Set(effectiveTechIds)];
  }
}
