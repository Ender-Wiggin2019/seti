import { EPlanet } from '@seti/common/types/protocol/enums';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import type { IGame } from '../../IGame.js';
import type { IPlayer } from '../../player/IPlayer.js';
import type { ILandOptions } from './LandProbeEffect.js';

export interface ILandSelectionOptions extends ILandOptions {
  prompt: string;
  includeSkipOption?: boolean;
  skipLabel?: string;
}

const ALL_LANDABLE_PLANETS: readonly EPlanet[] = [
  EPlanet.MERCURY,
  EPlanet.VENUS,
  EPlanet.MARS,
  EPlanet.JUPITER,
  EPlanet.SATURN,
  EPlanet.URANUS,
  EPlanet.NEPTUNE,
];

interface ILandTarget {
  planet: EPlanet;
  isMoon: boolean;
}

function collectLandTargets(
  player: IPlayer,
  options: ILandOptions,
): ILandTarget[] {
  const targets: ILandTarget[] = [];

  for (const planet of ALL_LANDABLE_PLANETS) {
    if (player.canLand(planet, { ...options, isMoon: false })) {
      targets.push({ planet, isMoon: false });
    }
    if (
      options.allowMoons &&
      player.canLand(planet, { ...options, isMoon: true })
    ) {
      targets.push({ planet, isMoon: true });
    }
  }

  return targets;
}

export function buildLandPlanetSelection(
  player: IPlayer,
  _game: IGame,
  options: ILandSelectionOptions,
): IPlayerInput | undefined {
  const { prompt, includeSkipOption, skipLabel, ...landOptions } = options;
  const targets = collectLandTargets(player, landOptions);

  if (targets.length === 0) return undefined;

  const optionItems = targets.map((target) => ({
    id: target.isMoon ? `land-${target.planet}-moon` : `land-${target.planet}`,
    label: target.isMoon
      ? `Land on ${target.planet} (moon)`
      : `Land on ${target.planet}`,
    onSelect: () => {
      player.land(target.planet, {
        ...landOptions,
        isMoon: target.isMoon,
      });
      return undefined;
    },
  }));

  if (includeSkipOption ?? true) {
    optionItems.push({
      id: 'skip-land',
      label: skipLabel ?? 'Skip landing',
      onSelect: () => undefined,
    });
  }

  return new SelectOption(player, optionItems, prompt);
}
