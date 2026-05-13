import {
  PLANETARY_BOARD_CONFIG,
  type TPlanetaryBoardConfigId,
} from '@seti/common/constant/boardLayout';
import { EPlanet } from '@seti/common/types/protocol/enums';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import type { IGame } from '../../IGame.js';
import type { IPlayer } from '../../player/IPlayer.js';
import {
  type ILandOptions,
  type ILandResult,
  LandProbeEffect,
} from './LandProbeEffect.js';

export interface ILandSelectionOptions extends ILandOptions {
  prompt: string;
  includeSkipOption?: boolean;
  skipLabel?: string;
  payCost?: boolean;
  onLanded?: (result: ILandResult) => void;
}

const ALL_LANDABLE_PLANETS: readonly EPlanet[] = [
  EPlanet.MERCURY,
  EPlanet.VENUS,
  EPlanet.MARS,
  EPlanet.JUPITER,
  EPlanet.SATURN,
  EPlanet.URANUS,
  EPlanet.NEPTUNE,
  EPlanet.OUMUAMUA,
];

interface ILandTarget {
  planet: EPlanet;
  isMoon: boolean;
  moonId?: string;
  moonName?: string;
}

function collectLandTargets(
  player: IPlayer,
  game: IGame,
  options: ILandOptions,
  payCost: boolean,
): ILandTarget[] {
  const targets: ILandTarget[] = [];

  for (const planet of ALL_LANDABLE_PLANETS) {
    if (
      planet === EPlanet.OUMUAMUA &&
      !game.solarSystem?.getPlanetLocation(planet)
    ) {
      continue;
    }
    if (
      canLandTarget(
        player,
        game,
        planet,
        { ...options, isMoon: false },
        payCost,
      )
    ) {
      targets.push({ planet, isMoon: false });
    }
    const config = PLANETARY_BOARD_CONFIG[planet as TPlanetaryBoardConfigId];
    const candidateMoonIds =
      options.moonId !== undefined ? [options.moonId] : (config?.moonIds ?? []);
    for (const moonId of candidateMoonIds) {
      if (
        canLandTarget(
          player,
          game,
          planet,
          { ...options, isMoon: true, moonId },
          payCost,
        )
      ) {
        const moonOrdinal = config?.moonIds.indexOf(moonId) ?? -1;
        targets.push({
          planet,
          isMoon: true,
          moonId,
          moonName: config?.moonNames[moonOrdinal],
        });
      }
    }
  }

  return targets;
}

function canLandTarget(
  player: IPlayer,
  game: IGame,
  planet: EPlanet,
  options: ILandOptions,
  payCost: boolean,
): boolean {
  if (payCost) {
    return player.canLand(planet, options);
  }
  return LandProbeEffect.canExecute(player, game, planet, options);
}

export function buildLandPlanetSelection(
  player: IPlayer,
  game: IGame,
  options: ILandSelectionOptions,
): IPlayerInput | undefined {
  const {
    prompt,
    includeSkipOption,
    skipLabel,
    payCost = false,
    onLanded,
    ...landOptions
  } = options;
  const targets = collectLandTargets(player, game, landOptions, payCost);

  if (targets.length === 0) return undefined;

  const optionItems = targets.map((target) => ({
    id: target.isMoon
      ? `land-${target.planet}-moon-${target.moonId}`
      : `land-${target.planet}`,
    label: target.isMoon
      ? `Land on ${target.planet} (${target.moonName ?? 'moon'})`
      : `Land on ${target.planet}`,
    onSelect: () => {
      const result = payCost
        ? player.land(target.planet, {
            ...landOptions,
            isMoon: target.isMoon,
            moonId: target.moonId,
          })
        : LandProbeEffect.executeCardContainedAction(
            player,
            game,
            target.planet,
            {
              ...landOptions,
              isMoon: target.isMoon,
              moonId: target.moonId,
            },
          );
      onLanded?.(result);
      return result?.pendingInput;
    },
  }));

  if (includeSkipOption ?? false) {
    optionItems.push({
      id: 'skip-land',
      label: skipLabel ?? 'Skip landing',
      onSelect: () => undefined,
    });
  }

  return new SelectOption(player, optionItems, prompt);
}
