import {
  EEffectType,
  type IBaseEffect,
  type ICustomizedEffect,
} from '@seti/common/types/effect';
import {
  EMiscIcon,
  EPlanet,
  EResource,
  EScanAction,
  ESector,
  ESpecialAction,
  ETech,
} from '@seti/common/types/element';
import { EAlienType } from '@seti/common/types/protocol/enums';
import { getTechDescriptor } from '@seti/common/types/tech';
import { isOumuamuaAlienBoard } from '../alien/AlienBoard.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';
import {
  EMissionEventType,
  type IMissionBranchDef,
  type IMissionEvent,
} from './IMission.js';

/**
 * FULL_MISSION: check whether a game event satisfies a branch's req.
 *
 * Each req effect is matched against the event independently;
 * ALL req items must match for the branch to trigger.
 */
export function matchesFullMissionTrigger(
  branch: IMissionBranchDef,
  event: IMissionEvent,
): boolean {
  if (branch.req.length === 0) return false;
  return branch.req.every((req) => matchesSingleEventReq(req, event));
}

function matchesSingleEventReq(
  req: IBaseEffect | ICustomizedEffect,
  event: IMissionEvent,
): boolean {
  if (req.effectType === EEffectType.CUSTOMIZED) {
    const planet = parsePlanetFromDesc(req.desc);
    if (!planet) return false;
    return (
      event.type === EMissionEventType.PROBE_VISITED_PLANET &&
      event.planet === planet
    );
  }

  const baseReq = req as IBaseEffect;
  const value = baseReq.value ?? 1;

  switch (baseReq.type) {
    case EResource.CREDIT:
      return (
        event.type === EMissionEventType.CARD_PLAYED &&
        event.cost === value &&
        event.costType === EResource.CREDIT
      );

    case EResource.ENERGY:
      return (
        event.type === EMissionEventType.CARD_PLAYED &&
        event.cost === value &&
        event.costType === EResource.ENERGY
      );

    case ESpecialAction.LAUNCH:
      return event.type === EMissionEventType.PROBE_LAUNCHED;

    case ESpecialAction.ORBIT:
      return event.type === EMissionEventType.PROBE_ORBITED;

    case ESpecialAction.LAND:
      return event.type === EMissionEventType.PROBE_LANDED;

    case ESpecialAction.ORBIT_OR_LAND:
      return (
        event.type === EMissionEventType.PROBE_ORBITED ||
        event.type === EMissionEventType.PROBE_LANDED
      );
    case ESpecialAction.SCAN:
      return event.type === EMissionEventType.SCAN_PERFORMED;

    case EScanAction.YELLOW:
      return (
        event.type === EMissionEventType.SIGNAL_PLACED &&
        event.color === ESector.YELLOW
      );
    case EScanAction.RED:
      return (
        event.type === EMissionEventType.SIGNAL_PLACED &&
        event.color === ESector.RED
      );
    case EScanAction.BLUE:
      return (
        event.type === EMissionEventType.SIGNAL_PLACED &&
        event.color === ESector.BLUE
      );

    case ETech.PROBE:
    case ETech.SCAN:
    case ETech.COMPUTER:
      return (
        event.type === EMissionEventType.TECH_RESEARCHED &&
        event.techCategory === baseReq.type
      );

    case ETech.ANY:
      return event.type === EMissionEventType.TECH_RESEARCHED;

    default:
      return false;
  }
}

/**
 * QUICK_MISSION: check whether the current game state satisfies a branch's req.
 * If the branch provides a custom `checkCondition`, it takes precedence.
 */
export function checkQuickMissionCondition(
  branch: IMissionBranchDef,
  player: IPlayer,
  game: IGame,
): boolean {
  if (branch.checkCondition) {
    return branch.checkCondition(player, game);
  }
  if (branch.req.length === 0) return false;
  return branch.req.every((req) => {
    if (req.effectType === EEffectType.CUSTOMIZED) {
      return checkCustomQuickMissionCondition(req.desc, player, game);
    }
    return checkBaseStateCondition(req as IBaseEffect, player, game);
  });
}

function checkCustomQuickMissionCondition(
  desc: string,
  player: IPlayer,
  game: IGame,
): boolean {
  if (desc === 'desc.et-23-req') {
    return player.exofossils >= 3;
  }
  if (desc === 'desc.et-21-req') {
    const board = game.alienState?.getBoardByType(EAlienType.OUMUAMUA);
    if (!board) return false;
    return board.slots.some((slot) => {
      if (!slot.slotId.includes('oumuamua-trace|')) return false;
      const parts = slot.slotId.split('|');
      if (parts.length !== 4) return false;
      const exofossilCost = Number(parts[3]);
      if (!Number.isInteger(exofossilCost) || exofossilCost <= 0) return false;
      return slot.occupants.some(
        (occ) => occ.source !== 'neutral' && occ.source.playerId === player.id,
      );
    });
  }
  if (desc === 'desc.et-22-req') {
    if (!game.planetaryBoard) return false;
    const state = game.planetaryBoard.planets.get(EPlanet.OUMUAMUA);
    if (!state) return false;
    const landCount = state.landingSlots.filter(
      (slot) => slot.playerId === player.id,
    ).length;
    return landCount >= 1;
  }
  if (desc === 'desc.et-27-req') {
    const board = game.alienState?.getBoardByType(EAlienType.OUMUAMUA);
    if (!isOumuamuaAlienBoard(board)) return false;
    return (board.oumuamuaTile?.markerPlayerIds ?? []).includes(player.id);
  }
  return false;
}

function checkBaseStateCondition(
  req: IBaseEffect,
  player: IPlayer,
  game: IGame,
): boolean {
  const value = req.value ?? 1;

  switch (req.type) {
    case EMiscIcon.ORBIT_OR_LAND_COUNT:
      return checkOrbitOrLandAtPlanet(req.desc, value, player, game);
    case EMiscIcon.ORBIT_COUNT:
      return checkOrbitAtPlanet(req.desc, value, player, game);
    case EMiscIcon.LAND_COUNT:
      return checkLandAtPlanet(req.desc, value, player, game);
    case EMiscIcon.FULFILL_SECTOR_ANY:
    case EMiscIcon.FULFILL_ICON:
      return countSectorFulfills(player, game) >= value;
    case EMiscIcon.FULFILL_SECTOR_RED:
      return countSectorFulfills(player, game, ESector.RED) >= value;
    case EMiscIcon.FULFILL_SECTOR_YELLOW:
      return countSectorFulfills(player, game, ESector.YELLOW) >= value;
    case EMiscIcon.FULFILL_SECTOR_BLUE:
      return countSectorFulfills(player, game, ESector.BLUE) >= value;
    case EMiscIcon.FULFILL_SECTOR_BLACK:
      return countSectorFulfills(player, game, ESector.BLACK) >= value;
    case ETech.PROBE:
    case ETech.SCAN:
    case ETech.COMPUTER:
      return countTechsInCategory(player, req.type) >= value;
    case ETech.ANY:
      return player.techs.length >= value;
    default:
      return false;
  }
}

function countTechsInCategory(player: IPlayer, category: ETech): number {
  return player.techs.filter(
    (techId) => getTechDescriptor(techId).type === category,
  ).length;
}

function countSectorFulfills(
  player: IPlayer,
  game: IGame,
  color?: ESector,
): number {
  return game.sectors.reduce((total, sectorLike) => {
    const sector = sectorLike as {
      color?: ESector;
      sectorWinners?: string[];
    };

    if (color && sector.color !== color) {
      return total;
    }

    return (
      total +
      (sector.sectorWinners?.filter((id) => id === player.id).length ?? 0)
    );
  }, 0);
}

function parsePlanetFromDesc(desc?: string): EPlanet | undefined {
  if (!desc) return undefined;
  const lower = desc.toLowerCase();
  if (lower.includes('mercury')) return EPlanet.MERCURY;
  if (lower.includes('venus')) return EPlanet.VENUS;
  if (lower.includes('mars')) return EPlanet.MARS;
  if (lower.includes('jupiter')) return EPlanet.JUPITER;
  if (lower.includes('saturn')) return EPlanet.SATURN;
  if (lower.includes('uranus')) return EPlanet.URANUS;
  if (lower.includes('neptune')) return EPlanet.NEPTUNE;
  if (lower.includes('oumuamua')) return EPlanet.OUMUAMUA;
  return undefined;
}

function checkOrbitOrLandAtPlanet(
  desc: string | undefined,
  requiredCount: number,
  player: IPlayer,
  game: IGame,
): boolean {
  const planet = parsePlanetFromDesc(desc);
  if (!planet || !game.planetaryBoard) return false;

  const planetState = game.planetaryBoard.planets.get(planet);
  if (!planetState) return false;

  const orbitCount = planetState.orbitSlots.filter(
    (s) => s.playerId === player.id,
  ).length;
  const landCount = planetState.landingSlots.filter(
    (s) => s.playerId === player.id,
  ).length;
  const moonCount = planetState.moonOccupant?.playerId === player.id ? 1 : 0;

  return orbitCount + landCount + moonCount >= requiredCount;
}

function checkOrbitAtPlanet(
  desc: string | undefined,
  requiredCount: number,
  player: IPlayer,
  game: IGame,
): boolean {
  const planet = parsePlanetFromDesc(desc);
  if (!planet || !game.planetaryBoard) return false;

  const planetState = game.planetaryBoard.planets.get(planet);
  if (!planetState) return false;

  return (
    planetState.orbitSlots.filter((s) => s.playerId === player.id).length >=
    requiredCount
  );
}

function checkLandAtPlanet(
  desc: string | undefined,
  requiredCount: number,
  player: IPlayer,
  game: IGame,
): boolean {
  const planet = parsePlanetFromDesc(desc);
  if (!planet || !game.planetaryBoard) return false;

  const planetState = game.planetaryBoard.planets.get(planet);
  if (!planetState) return false;

  const landCount = planetState.landingSlots.filter(
    (s) => s.playerId === player.id,
  ).length;
  const moonCount = planetState.moonOccupant?.playerId === player.id ? 1 : 0;

  return landCount + moonCount >= requiredCount;
}
