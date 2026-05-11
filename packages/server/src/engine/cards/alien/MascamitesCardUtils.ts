import { getMascamitesSampleToken } from '@seti/common/constant/mascamites';
import { EAlienType } from '@seti/common/types/BaseCard';
import { EPlanet, ETrace } from '@seti/common/types/protocol/enums';
import { isMascamitesAlienBoard } from '@/engine/alien/AlienBoard.js';
import { AlienRegistry } from '@/engine/alien/AlienRegistry.js';
import { executeSimpleSlotRewards } from '@/engine/alien/AlienRewards.js';
import { MascamitesAlienPlugin } from '@/engine/alien/plugins/MascamitesAlienPlugin.js';
import { LandProbeEffect } from '@/engine/effects/probe/LandProbeEffect.js';
import { OrbitProbeEffect } from '@/engine/effects/probe/OrbitProbeEffect.js';
import type { IGame } from '@/engine/IGame.js';
import type { PlayerInput } from '@/engine/input/PlayerInput.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { behaviorFromEffects, type IBehavior } from '../Behavior.js';
import type { ICard } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const SAMPLE_PLANETS = [EPlanet.JUPITER, EPlanet.SATURN] as const;

const LANDABLE_PLANETS = [
  EPlanet.MERCURY,
  EPlanet.VENUS,
  EPlanet.MARS,
  EPlanet.JUPITER,
  EPlanet.SATURN,
  EPlanet.URANUS,
  EPlanet.NEPTUNE,
  EPlanet.OUMUAMUA,
] as const;

export function behaviorWithoutMascamitesCustom(
  cardId: string,
  omit: Partial<Record<keyof IBehavior, true>> = {},
): IBehavior {
  const behavior = behaviorFromEffects(loadCardData(cardId).effects ?? []);
  const custom = behavior.custom?.filter(
    (id) =>
      id !== 'desc.et-pickup' &&
      id !== 'desc.et-pickup-moon' &&
      id !== 'desc.et-pickup-back',
  );
  const next: IBehavior = { ...behavior, custom };
  if (!custom || custom.length === 0) {
    delete next.custom;
  }
  for (const key of Object.keys(omit) as Array<keyof IBehavior>) {
    delete next[key];
  }
  return next;
}

export function getMascamitesPlugin(): MascamitesAlienPlugin | undefined {
  const plugin = AlienRegistry.get(EAlienType.MASCAMITES);
  return plugin instanceof MascamitesAlienPlugin ? plugin : undefined;
}

function hasOwnProbeAtPlanet(
  player: IPlayer,
  game: IGame,
  planet: EPlanet,
): boolean {
  const spaces = game.solarSystem?.getSpacesOnPlanet(planet) ?? [];
  const spaceIds = new Set(spaces.map((space) => space.id));
  const hasProbe = spaces.some((space) =>
    game.solarSystem
      ?.getProbesAt(space.id)
      .some((probe) => probe.playerId === player.id),
  );
  if (hasProbe) return true;

  const board = game.alienState?.getBoardByType(EAlienType.MASCAMITES);
  if (!isMascamitesAlienBoard(board)) return false;
  return board.capsules.some(
    (capsule) => capsule.ownerId === player.id && spaceIds.has(capsule.spaceId),
  );
}

export function createPickupBackInput(
  player: IPlayer,
  game: IGame,
  options: {
    requireOwnProbe?: boolean;
    onComplete?: () => PlayerInput | undefined;
  } = {},
): PlayerInput | undefined {
  const board = game.alienState?.getBoardByType(EAlienType.MASCAMITES);
  if (!isMascamitesAlienBoard(board)) return undefined;

  const planetOptions = SAMPLE_PLANETS.filter((planet) => {
    if (board.samplePools[planet].length === 0) return false;
    if (options.requireOwnProbe && !hasOwnProbeAtPlanet(player, game, planet)) {
      return false;
    }
    return true;
  }).map((planet) => ({
    id: `mascamites-pickup-back-${planet}`,
    label: `Choose ${planet}`,
    onSelect: () =>
      new SelectOption(
        player,
        board.samplePools[planet].map((sampleTokenId) => ({
          id: `sample:${sampleTokenId}`,
          label: sampleTokenId,
          onSelect: () => {
            const token = getMascamitesSampleToken(sampleTokenId);
            if (token) {
              executeSimpleSlotRewards(player, game, token.rewards);
            }
            return options.onComplete?.();
          },
        })),
        `Choose Mascamites sample from ${planet}`,
      ),
  }));

  if (planetOptions.length === 0) return undefined;
  return new SelectOption(player, planetOptions, 'Choose Mascamites planet');
}

function createPickupInputForPlanet(
  player: IPlayer,
  game: IGame,
  planet: EPlanet,
  cardId: string,
): PlayerInput | undefined {
  const plugin = getMascamitesPlugin();
  return plugin?.createCollectSampleInput(player, game, planet, cardId);
}

export function createLandThenPickupInput(
  player: IPlayer,
  game: IGame,
  card: ICard,
  options: { allowMoons?: boolean } = {},
): PlayerInput | undefined {
  const targets = LANDABLE_PLANETS.flatMap((planet) => {
    const planetTarget = LandProbeEffect.canExecute(player, game, planet, {
      isMoon: false,
      allowMoons: options.allowMoons,
    })
      ? [{ planet, isMoon: false }]
      : [];
    const moonTarget = LandProbeEffect.canExecute(player, game, planet, {
      isMoon: true,
      allowMoons: options.allowMoons,
    })
      ? [{ planet, isMoon: true }]
      : [];
    return [...planetTarget, ...moonTarget];
  });

  if (targets.length === 0) return undefined;
  return new SelectOption(
    player,
    targets.map((target) => ({
      id: target.isMoon
        ? `land-${target.planet}-moon`
        : `land-${target.planet}`,
      label: target.isMoon
        ? `Land on ${target.planet} (moon)`
        : `Land on ${target.planet}`,
      onSelect: () => {
        LandProbeEffect.executeCardContainedAction(
          player,
          game,
          target.planet,
          {
            isMoon: target.isMoon,
            allowMoons: options.allowMoons,
          },
        );
        return createPickupInputForPlanet(player, game, target.planet, card.id);
      },
    })),
    'Select a planet to land on',
  );
}

export function createOrbitOrLandThenPickupInput(
  player: IPlayer,
  game: IGame,
  card: ICard,
): PlayerInput | undefined {
  const orbitOptions = LANDABLE_PLANETS.filter((planet) =>
    OrbitProbeEffect.canExecute(player, game, planet),
  ).map((planet) => ({
    id: `orbit-${planet}`,
    label: `Orbit ${planet}`,
    onSelect: () => {
      const result = OrbitProbeEffect.execute(player, game, planet, {
        onComplete: () =>
          createPickupInputForPlanet(player, game, planet, card.id),
      });
      game.missionTracker.recordEvent({
        type: EMissionEventType.PROBE_ORBITED,
        planet,
      });
      return (
        result.pendingInput ??
        createPickupInputForPlanet(player, game, planet, card.id)
      );
    },
  }));

  const landOptions = LANDABLE_PLANETS.flatMap((planet) => {
    if (!LandProbeEffect.canExecute(player, game, planet)) return [];
    return [
      {
        id: `land-${planet}`,
        label: `Land on ${planet}`,
        onSelect: () => {
          LandProbeEffect.executeCardContainedAction(player, game, planet);
          return createPickupInputForPlanet(player, game, planet, card.id);
        },
      },
    ];
  });

  const options = [...orbitOptions, ...landOptions];
  if (options.length === 0) return undefined;
  return new SelectOption(player, options, 'Select orbit or land action');
}

export function hasMascamitesTraceCount(
  player: IPlayer,
  game: IGame,
  trace: ETrace,
  count: number,
): boolean {
  return (
    game.alienState.getPlayerTraceCount(player, trace, {
      alienType: EAlienType.MASCAMITES,
    }) >= count
  );
}
