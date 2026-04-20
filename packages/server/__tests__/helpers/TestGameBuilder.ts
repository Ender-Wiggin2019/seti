import type { ETrace } from '@seti/common/types/element';
import type { EPlanet } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type IPlayerInputModel,
  type ISelectEndOfRoundCardInputModel,
  type ISelectOptionInputModel,
  type ISelectTraceInputModel,
} from '@seti/common/types/protocol/playerInput';
import type { SolarSystem } from '@/engine/board/SolarSystem.js';
import { Game } from '@/engine/Game.js';
import type { IGameOptions } from '@/engine/GameOptions.js';
import type { IGamePlayerIdentity } from '@/engine/IGame.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import type { Player } from '@/engine/player/Player.js';

/**
 * Shared test fixtures & builder for the SETI engine integration tests.
 *
 * Rationale (docs/tests/tdd-plan.md §Refactor): centralize the recurring
 * `Game.create(...) + player lookup + first-option input resolver` pattern
 * so every agent writing Phase 5–10 tests shares one canonical helper.
 */

export const TEST_PLAYERS_2P: ReadonlyArray<IGamePlayerIdentity> = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
];

export const TEST_PLAYERS_3P: ReadonlyArray<IGamePlayerIdentity> = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
  { id: 'p3', name: 'Carol', color: 'green', seatIndex: 2 },
];

export const TEST_PLAYERS_4P: ReadonlyArray<IGamePlayerIdentity> = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
  { id: 'p3', name: 'Carol', color: 'green', seatIndex: 2 },
  { id: 'p4', name: 'Dave', color: 'yellow', seatIndex: 3 },
];

export interface ITestGameConfig {
  playerCount?: 2 | 3 | 4;
  seed?: string;
  options?: Partial<IGameOptions>;
  players?: ReadonlyArray<IGamePlayerIdentity>;
}

function selectPlayers(count: 2 | 3 | 4): ReadonlyArray<IGamePlayerIdentity> {
  switch (count) {
    case 2:
      return TEST_PLAYERS_2P;
    case 3:
      return TEST_PLAYERS_3P;
    case 4:
      return TEST_PLAYERS_4P;
    default: {
      const exhaustive: never = count;
      return exhaustive;
    }
  }
}

/**
 * Build a fully initialized `Game` via `Game.create(...)` with sensible
 * defaults. Seed defaults to a stable string so tests are deterministic.
 */
export function buildTestGame(config: ITestGameConfig = {}): Game {
  const playerCount = config.playerCount ?? 2;
  const players = config.players ?? selectPlayers(playerCount);
  const seed = config.seed ?? `test-game-${playerCount}p`;
  const options: Partial<IGameOptions> = {
    playerCount,
    ...(config.options ?? {}),
  };
  return Game.create(players, options, seed, seed);
}

/** Look up a player by id, throwing a clear error on miss. */
export function getPlayer(game: Game, id: string): Player {
  const player = game.players.find((candidate) => candidate.id === id);
  if (!player) {
    throw new Error(`Test setup error: no player with id '${id}'`);
  }
  return player as Player;
}

/** Non-null accessor for the solar system. */
export function requireSolarSystem(game: Game): SolarSystem {
  if (!game.solarSystem) {
    throw new Error('Test setup error: game.solarSystem is null');
  }
  return game.solarSystem;
}

/**
 * Place `count` probes for `playerId` on the first space of `planet`.
 * Mirrors the `placeProbeOnPlanet` pattern used across action tests.
 */
export function placeProbeOnPlanet(
  game: Game,
  playerId: string,
  planet: EPlanet,
  count = 1,
): void {
  const solarSystem = requireSolarSystem(game);
  const space = solarSystem.getSpacesOnPlanet(planet)[0];
  if (!space) {
    throw new Error(`Test setup error: no space found for planet ${planet}`);
  }
  for (let i = 0; i < count; i += 1) {
    solarSystem.placeProbe(playerId, space.id);
  }
}

/**
 * Options for {@link resolveAllInputsDefault} that lets callers tune the
 * default-pick behavior without forcing every test to `processInput`
 * directly.
 */
export interface IResolveAllInputsOptions {
  /**
   * Preference order used when auto-answering a `TRACE` prompt. The
   * resolver picks the first available option in this list; if none of
   * the preferred colors are on offer it falls back to the first option
   * the prompt surfaces. Pass this when the test has a color semantic
   * and the prompt's option order is not stable (it often isn't — the
   * engine orders options by tile layout, not by test intent).
   */
  traceOrder?: ReadonlyArray<ETrace>;
}

/**
 * Advance past any pending player input by picking the first legal option.
 * Returns the number of inputs that were resolved.
 *
 * Use this when the test does not care which branch is chosen (e.g. when
 * draining to the next assertion point). For branch-specific decisions,
 * drive `game.processInput` directly instead — or, for `TRACE`-specific
 * color semantics, pass `options.traceOrder` to express the preferred
 * color list without having to hand-roll the input loop.
 */
export function resolveAllInputsDefault(
  game: Game,
  player: IPlayer,
  options: IResolveAllInputsOptions = {},
): number {
  let resolved = 0;
  while (player.waitingFor) {
    const model: IPlayerInputModel = player.waitingFor.toModel();
    switch (model.type) {
      case EPlayerInputType.OPTION: {
        const optModel = model as ISelectOptionInputModel;
        const first = optModel.options[0];
        if (!first) {
          return resolved;
        }
        game.processInput(player.id, {
          type: EPlayerInputType.OPTION,
          optionId: first.id,
        });
        break;
      }
      case EPlayerInputType.TRACE: {
        const traceModel = model as ISelectTraceInputModel;
        if (traceModel.options.length === 0) {
          return resolved;
        }
        const preferred = options.traceOrder?.find((candidate) =>
          traceModel.options.includes(candidate),
        );
        const pick = preferred ?? traceModel.options[0];
        game.processInput(player.id, {
          type: EPlayerInputType.TRACE,
          trace: pick,
        });
        break;
      }
      case EPlayerInputType.END_OF_ROUND: {
        const eor = model as ISelectEndOfRoundCardInputModel;
        const first = eor.cards[0];
        if (!first) {
          return resolved;
        }
        game.processInput(player.id, {
          type: EPlayerInputType.END_OF_ROUND,
          cardId: first.id,
        });
        break;
      }
      default:
        return resolved;
    }
    resolved += 1;
  }
  return resolved;
}

/** Assert the player is waiting for an OPTION input and return its model. */
export function expectOptionInput(player: IPlayer): ISelectOptionInputModel {
  if (!player.waitingFor) {
    throw new Error(`Expected ${player.id} to have a pending OPTION input`);
  }
  const model = player.waitingFor.toModel();
  if (model.type !== EPlayerInputType.OPTION) {
    throw new Error(`Expected OPTION input, got ${model.type}`);
  }
  return model as ISelectOptionInputModel;
}

/** Assert the player is waiting for a TRACE input and return its model. */
export function expectTraceInput(player: IPlayer): ISelectTraceInputModel {
  if (!player.waitingFor) {
    throw new Error(`Expected ${player.id} to have a pending TRACE input`);
  }
  const model = player.waitingFor.toModel();
  if (model.type !== EPlayerInputType.TRACE) {
    throw new Error(`Expected TRACE input, got ${model.type}`);
  }
  return model as ISelectTraceInputModel;
}
