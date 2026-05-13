import {
  ANALYZE_ENERGY_COST,
  LAUNCH_PROBE_CREDIT_COST,
  ORBIT_CREDIT_COST,
  ORBIT_ENERGY_COST,
  SCAN_CREDIT_COST,
  SCAN_ENERGY_COST,
} from '../constant/actionCosts';
import { PLANETARY_BOARD_CONFIG } from '../constant/boardLayout';
import { EAlienType, type IBaseCard } from '../types/BaseCard';
import { EResource } from '../types/element';
import { EMainAction, EPlanet } from '../types/protocol/enums';
import type {
  IPublicGameState,
  IPublicPlanetState,
  IPublicPlayerState,
  IPublicResourceState,
} from '../types/protocol/gameState';
import { RESEARCH_PUBLICITY_COST } from '../types/tech';
import { isStandardPlayProhibitedCard } from './handLimit';
import { canLandOnPlanet, canOrbitPlanet } from './planet';
import { findPlanetSpaceId } from './solarSystem';
import { getAvailableTechs } from './tech';

export function canLaunchProbe(player: IPublicPlayerState): boolean {
  return (
    player.resources[EResource.CREDIT] >= LAUNCH_PROBE_CREDIT_COST &&
    player.probesInSpace < player.probeSpaceLimit
  );
}

function getPlanetEntriesInGame(
  gameState: IPublicGameState,
): Array<[EPlanet, IPublicPlanetState]> {
  const entries = Object.entries(gameState.planetaryBoard.planets).filter(
    (entry): entry is [EPlanet, IPublicPlanetState] => entry[1] !== undefined,
  );

  if (
    !gameState.planetaryBoard.planets[EPlanet.OUMUAMUA] &&
    findPlanetSpaceId(gameState.solarSystem, EPlanet.OUMUAMUA)
  ) {
    const config = PLANETARY_BOARD_CONFIG[EPlanet.OUMUAMUA];
    entries.push([
      EPlanet.OUMUAMUA,
      {
        orbitSlots: [],
        landingSlots: [],
        firstOrbitClaimed: false,
        firstLandDataBonusTaken: Array.from(
          { length: config.land.firstData.length },
          () => false,
        ),
        moonOccupants: [],
      },
    ]);
  }

  return entries;
}

export function canOrbit(
  player: IPublicPlayerState,
  gameState: IPublicGameState,
): boolean {
  if (
    player.resources[EResource.CREDIT] >= ORBIT_CREDIT_COST &&
    player.resources[EResource.ENERGY] >= ORBIT_ENERGY_COST
  ) {
    return getPlanetEntriesInGame(gameState).some(([planetId, planet]) =>
      canOrbitPlanet(planetId, planet, player, gameState),
    );
  }
  return false;
}

export function canLand(
  player: IPublicPlayerState,
  gameState: IPublicGameState,
): boolean {
  return getPlanetEntriesInGame(gameState).some(([planetId, planet]) => {
    return canLandOnPlanet(planetId, planet, player, gameState);
  });
}

export function canScan(player: IPublicPlayerState): boolean {
  return (
    player.resources[EResource.CREDIT] >= SCAN_CREDIT_COST &&
    player.resources[EResource.ENERGY] >= SCAN_ENERGY_COST
  );
}

export function canAnalyzeData(player: IPublicPlayerState): boolean {
  if (player.resources[EResource.ENERGY] < ANALYZE_ENERGY_COST) {
    return false;
  }
  return player.computer.columns.every((col) => col.topFilled);
}

function getCardPriceType(card: IBaseCard): EResource {
  return (
    card.priceType ??
    (card.alien === EAlienType.CENTAURIANS
      ? EResource.ENERGY
      : EResource.CREDIT)
  );
}

function getResourceAmount(
  resources: IPublicResourceState,
  resource: EResource,
): number {
  switch (resource) {
    case EResource.CREDIT:
      return resources[EResource.CREDIT];
    case EResource.ENERGY:
      return resources[EResource.ENERGY];
    case EResource.DATA:
      return resources[EResource.DATA];
    case EResource.PUBLICITY:
      return resources[EResource.PUBLICITY];
    case EResource.SIGNAL_TOKEN:
      return resources[EResource.SIGNAL_TOKEN] ?? 0;
    default:
      return 0;
  }
}

export function canPlaySpecificCard(
  player: IPublicPlayerState,
  card: IBaseCard,
): boolean {
  if (isStandardPlayProhibitedCard(card)) {
    return false;
  }

  const priceType = getCardPriceType(card);
  return getResourceAmount(player.resources, priceType) >= card.price;
}

export function canPlayCard(player: IPublicPlayerState): boolean {
  if (player.hand !== undefined) {
    return player.hand.some((card) => canPlaySpecificCard(player, card));
  }
  return player.handSize > 0;
}

export function canResearchTechAction(
  player: IPublicPlayerState,
  gameState: IPublicGameState,
): boolean {
  if (player.resources[EResource.PUBLICITY] < RESEARCH_PUBLICITY_COST) {
    return false;
  }
  return getAvailableTechs(player, gameState.techBoard).length > 0;
}

export function getAvailableMainActions(
  player: IPublicPlayerState,
  gameState: IPublicGameState,
): EMainAction[] {
  if (isAnySetupTuckPending(gameState)) {
    return [];
  }

  const actions: EMainAction[] = [];

  if (canLaunchProbe(player)) actions.push(EMainAction.LAUNCH_PROBE);
  if (canOrbit(player, gameState)) actions.push(EMainAction.ORBIT);
  if (canLand(player, gameState)) actions.push(EMainAction.LAND);
  if (canScan(player)) actions.push(EMainAction.SCAN);
  if (canAnalyzeData(player)) actions.push(EMainAction.ANALYZE_DATA);
  if (canPlayCard(player)) actions.push(EMainAction.PLAY_CARD);
  if (canResearchTechAction(player, gameState))
    actions.push(EMainAction.RESEARCH_TECH);
  actions.push(EMainAction.PASS);

  return actions;
}

/**
 * True while any player in the game still owes setup-tuck inputs. The
 * server blocks turn actions until every player's setup tucks are
 * resolved; mirror that on the client so PASS and other main-action
 * buttons stay disabled instead of hitting an error path.
 */
export function isAnySetupTuckPending(gameState: IPublicGameState): boolean {
  return gameState.players.some((player) => player.pendingSetupTucks > 0);
}
