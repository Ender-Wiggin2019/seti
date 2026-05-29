import {
  ORBIT_CREDIT_COST,
  ORBIT_ENERGY_COST,
} from '@seti/common/constant/actionCosts';
import {
  PLANETARY_BOARD_CONFIG,
  PLANETARY_PLANETS,
  type TPlanetaryBoardConfigId,
  type TPlanetReward,
} from '@seti/common/constant/boardLayout';
import { EResource, ESector } from '@seti/common/types/element';
import { EMainAction, EPlanet } from '@seti/common/types/protocol/enums';
import { LandProbeEffect } from '../effects/probe/LandProbeEffect.js';
import { createActionEvent } from '../event/GameEvent.js';
import type { IGame } from '../IGame.js';
import type { PlayerInput } from '../input/PlayerInput.js';
import { SelectOption } from '../input/SelectOption.js';
import { EMissionEventType } from '../missions/IMission.js';
import type { IPlayer } from '../player/IPlayer.js';
import { OrbitAction } from './Orbit.js';

const ALL_ORBIT_LAND_PLANETS: readonly EPlanet[] = [
  ...PLANETARY_PLANETS,
  EPlanet.OUMUAMUA,
];

function getPlanetLabel(planet: EPlanet): string {
  return (
    PLANETARY_BOARD_CONFIG[planet as TPlanetaryBoardConfigId]?.label ?? planet
  );
}

function eligibleLandPlanets(player: IPlayer, game: IGame): EPlanet[] {
  return ALL_ORBIT_LAND_PLANETS.filter((planet) => {
    if (
      planet === EPlanet.OUMUAMUA &&
      !game.solarSystem?.getPlanetLocation(planet)
    ) {
      return false;
    }
    return player.canLand(planet);
  });
}

function eligibleOrbitPlanets(player: IPlayer, game: IGame): EPlanet[] {
  return ALL_ORBIT_LAND_PLANETS.filter((planet) => {
    if (
      planet === EPlanet.OUMUAMUA &&
      !game.solarSystem?.getPlanetLocation(planet)
    ) {
      return false;
    }
    return OrbitAction.canExecute(player, game, planet);
  });
}

/**
 * Build the planet-picker SelectOption for the LAND main action. Only
 * planets where the player can land (probe in space, energy sufficient)
 * become options. After the planet is picked, the chained slot picker
 * fires to confirm planet-vs-moon.
 *
 * Returns `undefined` when there are no legal targets — caller should
 * gate at the action level.
 */
export function buildLandActionPlanetPicker(
  player: IPlayer,
  game: IGame,
): PlayerInput | undefined {
  const planets = eligibleLandPlanets(player, game);
  if (planets.length === 0) return undefined;

  return new SelectOption(
    player,
    planets.map((planet) => {
      const cost = LandProbeEffect.getLandingCost(player, game, planet);
      const label = `Land on ${getPlanetLabel(planet)} (${cost} ⚡)`;
      return {
        id: `main-action-land-planet-${planet}`,
        label,
        onSelect: () => buildLandActionSlotPicker(player, game, planet),
      };
    }),
    'Choose planet to land on',
  );
}

/**
 * Slot picker shown after the user picked a planet. Always returns at
 * least one option (planet-side land); adds moon options when the
 * player has the moon-landing tech and the planet has eligible moons.
 */
export function buildLandActionSlotPicker(
  player: IPlayer,
  game: IGame,
  planet: EPlanet,
): PlayerInput | undefined {
  const config = PLANETARY_BOARD_CONFIG[planet as TPlanetaryBoardConfigId];
  const planetSurfaceLabel = `Land on ${getPlanetLabel(planet)} surface`;
  const surfaceRewardSummary = formatRewardSummary(
    config?.land.rewards ?? [],
    config?.land.firstData ?? [],
    { planet },
  );

  const options: Array<{
    id: string;
    label: string;
    onSelect: () => PlayerInput | undefined;
  }> = [
    {
      id: `main-action-land-slot-${planet}-planet`,
      label: surfaceRewardSummary
        ? `${planetSurfaceLabel} (${surfaceRewardSummary})`
        : planetSurfaceLabel,
      onSelect: () => {
        emitLandOrbitActionEvent(game, player, EMainAction.LAND, planet);
        const result = player.land(planet, { isMoon: false });
        return result.pendingInput;
      },
    },
  ];

  // Only surface moon options when the player can actually land on a
  // moon (Probe Tech 3 / equivalent). The base check is per-planet —
  // each available moon becomes its own option with its own rewards.
  const moonIds = config?.moonIds ?? [];
  for (let i = 0; i < moonIds.length; i += 1) {
    const moonId = moonIds[i];
    if (!player.canLand(planet, { isMoon: true, moonId })) continue;
    const moonName = config?.moonNames[i] ?? moonId;
    const moonRewards = config?.land.moonRewards[i] ?? [];
    const moonRewardSummary = formatRewardSummary(moonRewards, [], { planet });
    const baseLabel = `Land on ${moonName} (${getPlanetLabel(planet)} moon)`;
    options.push({
      id: `main-action-land-slot-${planet}-moon-${moonId}`,
      label: moonRewardSummary
        ? `${baseLabel} — ${moonRewardSummary}`
        : baseLabel,
      onSelect: () => {
        emitLandOrbitActionEvent(
          game,
          player,
          EMainAction.LAND,
          planet,
          moonName,
        );
        const result = player.land(planet, { isMoon: true, moonId });
        return result.pendingInput;
      },
    });
  }

  return new SelectOption(player, options, 'Choose landing position');
}

/**
 * Build the planet-picker SelectOption for the ORBIT main action. The
 * eligibility check (`OrbitAction.canExecute`) already covers the
 * 1 credit + 1 energy cost. Each option label includes the cost.
 */
export function buildOrbitActionPlanetPicker(
  player: IPlayer,
  game: IGame,
): PlayerInput | undefined {
  const planets = eligibleOrbitPlanets(player, game);
  if (planets.length === 0) return undefined;

  return new SelectOption(
    player,
    planets.map((planet) => ({
      id: `main-action-orbit-planet-${planet}`,
      label: `Orbit ${getPlanetLabel(planet)} (${ORBIT_ENERGY_COST} ⚡ + ${ORBIT_CREDIT_COST} 💰)`,
      onSelect: () => buildOrbitActionSlotPicker(player, game, planet),
    })),
    'Choose planet to orbit',
  );
}

/**
 * Slot picker for ORBIT. The first-orbit slot (with bonus VP) is
 * opt-in per rulebook — surface it as a separate option so the player
 * can decline. When the slot is already claimed, only the regular
 * orbit option appears.
 */
export function buildOrbitActionSlotPicker(
  player: IPlayer,
  game: IGame,
  planet: EPlanet,
): PlayerInput | undefined {
  const planetaryBoard = game.planetaryBoard;
  const canClaimFirst = planetaryBoard?.canClaimFirstOrbit(planet) ?? false;
  const config = PLANETARY_BOARD_CONFIG[planet as TPlanetaryBoardConfigId];
  const regularRewardSummary = formatRewardSummary(
    config?.orbit.rewards ?? [],
    [],
    { planet },
  );
  // First-orbit option shows the *total* rewards with the bonus
  // listed first — that mirrors the resolution order
  // (`PlanetaryBoard.orbit` prepends `firstRewards` to the chain
  // when the bonus slot is claimed) and matches how the printed
  // board reads: bonus first, then the standard payout.
  const firstSlotRewardSummary = formatRewardSummary(
    [...(config?.orbit.firstRewards ?? []), ...(config?.orbit.rewards ?? [])],
    [],
    { planet },
  );

  const options: Array<{
    id: string;
    label: string;
    onSelect: () => PlayerInput | undefined;
  }> = [];

  if (canClaimFirst) {
    options.push({
      id: `main-action-orbit-slot-${planet}-first`,
      label: firstSlotRewardSummary
        ? `Take first-orbit slot (${firstSlotRewardSummary})`
        : 'Take first-orbit slot',
      onSelect: () => {
        emitLandOrbitActionEvent(game, player, EMainAction.ORBIT, planet);
        const result = OrbitAction.execute(player, game, planet, {
          claimFirstSlot: true,
        });
        game.missionTracker.recordEvent({
          type: EMissionEventType.PROBE_ORBITED,
          planet,
        });
        return result.pendingInput;
      },
    });
  }

  options.push({
    id: `main-action-orbit-slot-${planet}-regular`,
    label: regularRewardSummary
      ? `Take regular orbit slot (${regularRewardSummary})`
      : 'Take regular orbit slot',
    onSelect: () => {
      emitLandOrbitActionEvent(game, player, EMainAction.ORBIT, planet);
      const result = OrbitAction.execute(player, game, planet, {
        claimFirstSlot: false,
      });
      game.missionTracker.recordEvent({
        type: EMissionEventType.PROBE_ORBITED,
        planet,
      });
      return result.pendingInput;
    },
  });

  return new SelectOption(player, options, 'Choose orbit slot');
}

function formatRewardSummary(
  rewards: readonly TPlanetReward[],
  firstData: readonly number[],
  context: { planet?: EPlanet } = {},
): string {
  const planetLabel =
    context.planet !== undefined ? getPlanetLabel(context.planet) : null;
  const parts: string[] = [];
  for (const reward of rewards) {
    if (reward.type === 'resource' && reward.resource === EResource.SCORE) {
      parts.push(`${reward.amount} VP`);
    } else if (reward.type === 'resource') {
      parts.push(`${reward.amount} ${formatResource(reward.resource)}`);
    } else if (reward.type === 'trace') {
      parts.push(`${reward.amount} ${reward.trace}`);
    } else if (reward.type === 'tuck') {
      // Rulebook calls this "tuck a card for income" — surface as
      // "N income" so the orbit/land picker matches the income tracker
      // on the personal board instead of using the literal "tuck"
      // verb.
      parts.push(`${reward.amount} income`);
    } else if (reward.type === 'card') {
      // 'random' = blind draw from deck top; 'any' = snap from card
      // row OR draw from deck (player picks). The rulebook calls
      // these "deck draw" and "snap card" respectively — match that
      // wording so the picker labels read like the printed planet
      // bonuses.
      const source = reward.source === 'random' ? 'deck card' : 'snap card';
      parts.push(`${reward.amount} ${source}`);
    } else if (reward.type === 'signal') {
      // 'planet-sector' = the sector that currently holds the planet
      // we're orbiting/landing on. Surface the planet name when
      // available so the option is unambiguous. Specific-sector
      // signals (e.g. Uranus / Neptune's black-sector bonus) get
      // their sector name humanised — `ESector.BLACK` is stored as
      // 'black-signal' which would otherwise leak into the label.
      const sectorPart =
        'sector' in reward
          ? `${humanizeSector(reward.sector)} sector`
          : planetLabel
            ? `${planetLabel} sector`
            : 'planet sector';
      parts.push(`${reward.amount} signal on ${sectorPart}`);
    } else if (reward.type === 'exofossil') {
      parts.push(`${reward.amount} exofossil`);
    } else if (reward.type === 'alien-card') {
      parts.push(`${reward.amount} alien card`);
    }
  }
  if (firstData.length > 0) {
    const firstDataTotal = firstData.reduce((sum, d) => sum + d, 0);
    parts.push(`first-land bonus up to ${firstDataTotal} data`);
  }
  return parts.join(', ');
}

function humanizeSector(sector: ESector): string {
  switch (sector) {
    case ESector.RED:
      return 'red';
    case ESector.YELLOW:
      return 'yellow';
    case ESector.BLUE:
      return 'blue';
    case ESector.BLACK:
      return 'black';
    default:
      return String(sector);
  }
}

/**
 * Emit the ACTION event for ORBIT/LAND from the slot picker so the
 * line carries the chosen planet (and optionally moon) — keeps the
 * log readable as "Alice orbited Mars" / "Alice landed on Titan".
 *
 * `Game.processMainAction` skips the default ACTION emission for
 * ORBIT/LAND (sets `actionEventLogged = true`) so this helper is the
 * sole emitter for those two actions.
 */
function emitLandOrbitActionEvent(
  game: IGame,
  player: IPlayer,
  action: EMainAction,
  planet: EPlanet,
  moon?: string,
): void {
  game.eventLog.append(
    createActionEvent(player.id, action, {
      planet,
      planetLabel: getPlanetLabel(planet),
      ...(moon ? { moon } : {}),
    }),
  );
}

function formatResource(resource: EResource): string {
  switch (resource) {
    case EResource.CREDIT:
      return 'credits';
    case EResource.ENERGY:
      return 'energy';
    case EResource.PUBLICITY:
      return 'publicity';
    case EResource.DATA:
      return 'data';
    case EResource.SIGNAL_TOKEN:
      return 'signal';
    case EResource.SCORE:
      return 'VP';
    case EResource.MOVE:
      return 'move';
    default:
      return String(resource);
  }
}
