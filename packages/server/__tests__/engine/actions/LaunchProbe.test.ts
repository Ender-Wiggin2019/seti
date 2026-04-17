import { EErrorCode } from '@seti/common/types/protocol/errors';
import { EMainAction, EPlanet } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectEndOfRoundCardInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ETechId } from '@seti/common/types/tech';
import { LaunchProbeAction } from '@/engine/actions/LaunchProbe.js';
import { Game } from '@/engine/Game.js';
import type { IGame } from '@/engine/IGame.js';
import { GameError } from '@/shared/errors/GameError.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function resolvePassEndOfRoundPick(game: Game, playerId: string): void {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player?.waitingFor) {
    return;
  }

  const model = player.waitingFor.toModel() as ISelectEndOfRoundCardInputModel;
  if (model.type !== EPlayerInputType.END_OF_ROUND) {
    throw new Error('Expected end-of-round selection');
  }

  game.processInput(playerId, {
    type: EPlayerInputType.END_OF_ROUND,
    cardId: model.cards[0].id,
  });
}

function requireSolarSystem(game: IGame) {
  if (game.solarSystem === null) {
    throw new Error('Expected solar system to be initialized');
  }

  return game.solarSystem;
}

describe('LaunchProbeAction — integration', () => {
  describe('execute', () => {
    it('integration: double-probe tech allows launching again on a later turn until two probes are in space', () => {
      const game = Game.create(
        TEST_PLAYERS,
        { playerCount: 2 },
        'launch-probe-double-tech',
      );
      const player = game.players[0];
      player.gainTech(ETechId.PROBE_DOUBLE_PROBE);
      const otherPlayer = game.players[1];

      game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE });
      game.processEndTurn(player.id);
      game.processMainAction(otherPlayer.id, { type: EMainAction.PASS });
      resolvePassEndOfRoundPick(game, otherPlayer.id);
      game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE });
      game.processEndTurn(player.id);

      const solarSystem = requireSolarSystem(game);
      const earthSpaces = solarSystem.getSpacesOnPlanet(EPlanet.EARTH);
      const earthProbes = solarSystem.getProbesAt(earthSpaces[0].id);

      expect(player.resources.credits).toBe(0);
      expect(player.probesInSpace).toBe(2);
      expect(
        earthProbes.filter((probe) => probe.playerId === player.id),
      ).toHaveLength(2);
    });
  });

  describe('processMainAction integration', () => {
    it('2.1.1 spends 2 credits, places probe on Earth, increments probesInSpace', () => {
      const game = Game.create(
        TEST_PLAYERS,
        { playerCount: 2 },
        'launch-probe-integration-2-1-1',
      );
      const player = game.players[0];
      const initialCredits = player.resources.credits;

      game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE });

      expect(player.resources.credits).toBe(initialCredits - 2);
      expect(player.probesInSpace).toBe(1);
      const solarSystem = requireSolarSystem(game);
      const earthSpaces = solarSystem.getSpacesOnPlanet(EPlanet.EARTH);
      const earthProbes = solarSystem.getProbesAt(earthSpaces[0].id);
      expect(
        earthProbes.some((probe) => probe.playerId === player.id),
      ).toBe(true);
    });

    it('2.1.4 throws GameError when credits are below 2', () => {
      const game = Game.create(
        TEST_PLAYERS,
        { playerCount: 2 },
        'launch-probe-integration-2-1-4',
      );
      const player = game.players[0];
      player.resources.spend({ credits: player.resources.credits - 1 });
      expect(player.resources.credits).toBe(1);

      expect(() =>
        game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE }),
      ).toThrow(GameError);

      try {
        game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE });
      } catch (err) {
        expect((err as GameError).code).toBe(EErrorCode.INVALID_ACTION);
      }
      expect(player.resources.credits).toBe(1);
      expect(player.probesInSpace).toBe(0);
    });

    it('2.1.5 throws GameError when probesInSpace has reached the limit', () => {
      const game = Game.create(
        TEST_PLAYERS,
        { playerCount: 2 },
        'launch-probe-integration-2-1-5',
      );
      const player = game.players[0];
      player.probesInSpace = player.probeSpaceLimit;

      expect(() =>
        game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE }),
      ).toThrow(GameError);

      try {
        game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE });
      } catch (err) {
        expect((err as GameError).code).toBe(EErrorCode.INVALID_ACTION);
      }
    });

    it('2.1.2 orbiters and landers do not count toward the probesInSpace limit', () => {
      const game = Game.create(
        TEST_PLAYERS,
        { playerCount: 2 },
        'launch-probe-integration-2-1-2',
      );
      const player = game.players[0];
      const other = game.players[1];

      // Place a probe on Mars directly so the player can orbit it as a main
      // action without first needing movement. probesInSpace must reflect the
      // live probe on a planet (not Earth).
      const marsSpace = game.solarSystem?.getSpacesOnPlanet(EPlanet.MARS)[0];
      if (!marsSpace || game.solarSystem === null) {
        throw new Error('Expected Mars space');
      }
      game.solarSystem.placeProbe(player.id, marsSpace.id);
      player.probesInSpace = 1;
      expect(player.probeSpaceLimit).toBe(1);
      expect(LaunchProbeAction.canExecute(player, game)).toBe(false);

      // Orbit the Mars probe → probe leaves space into the orbit slot.
      game.processMainAction(player.id, {
        type: EMainAction.ORBIT,
        payload: { planet: EPlanet.MARS },
      });
      game.processEndTurn(player.id);
      expect(player.probesInSpace).toBe(0);
      expect(
        game.planetaryBoard?.planets.get(EPlanet.MARS)?.orbitSlots,
      ).toEqual([{ playerId: player.id }]);

      // Hand the turn back so p1 can take another main action.
      game.processMainAction(other.id, { type: EMainAction.PASS });
      resolvePassEndOfRoundPick(game, other.id);
      expect(game.activePlayer.id).toBe(player.id);

      // The orbiter must NOT count toward probesInSpace; launch is legal again
      // even though the total probe footprint (orbiter + new probe) is 2.
      expect(LaunchProbeAction.canExecute(player, game)).toBe(true);
      game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE });
      expect(player.probesInSpace).toBe(1);
      expect(
        game.planetaryBoard?.planets.get(EPlanet.MARS)?.orbitSlots,
      ).toEqual([{ playerId: player.id }]);
    });

    it('2.1E.3 rejects launch attempted by a non-active player', () => {
      const game = Game.create(
        TEST_PLAYERS,
        { playerCount: 2 },
        'launch-probe-integration-2-1E-3',
      );
      const active = game.activePlayer;
      const other = game.players.find((p) => p.id !== active.id);
      if (!other) {
        throw new Error('Expected a second player');
      }

      expect(() =>
        game.processMainAction(other.id, { type: EMainAction.LAUNCH_PROBE }),
      ).toThrow(GameError);

      try {
        game.processMainAction(other.id, { type: EMainAction.LAUNCH_PROBE });
      } catch (err) {
        expect((err as GameError).code).toBe(EErrorCode.NOT_YOUR_TURN);
      }
      expect(other.probesInSpace).toBe(0);
    });
  });
});
