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
    if (
      canLandTarget(player, game, planet, { ...options, isMoon: true }, payCost)
    ) {
      targets.push({ planet, isMoon: true });
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
    id: target.isMoon ? `land-${target.planet}-moon` : `land-${target.planet}`,
    label: target.isMoon
      ? `Land on ${target.planet} (moon)`
      : `Land on ${target.planet}`,
    onSelect: () => {
      const result = payCost
        ? player.land(target.planet, {
            ...landOptions,
            isMoon: target.isMoon,
          })
        : LandProbeEffect.executeCardContainedAction(
            player,
            game,
            target.planet,
            {
              ...landOptions,
              isMoon: target.isMoon,
            },
          );
      onLanded?.(result);
      return undefined;
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
