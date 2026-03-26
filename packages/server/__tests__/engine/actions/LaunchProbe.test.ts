import { EPlanet } from '@seti/common/types/protocol/enums';
import { LaunchProbeAction } from '@/engine/actions/LaunchProbe.js';
import { BoardBuilder } from '@/engine/board/BoardBuilder.js';
import { LaunchProbeEffect } from '@/engine/effects/probe/LaunchProbeEffect.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

function createMockGame(): IGame {
  const rng = new SeededRandom('launch-probe-test');
  const solarSystem = BoardBuilder.buildSolarSystem(rng);
  return {
    solarSystem,
    planetaryBoard: null,
    techBoard: null,
    sectors: [],
    mainDeck: { draw: () => undefined, discard: () => undefined },
    cardRow: [],
    endOfRoundStacks: [],
    hiddenAliens: [],
    neutralMilestones: [],
    roundRotationReminderIndex: 0,
    hasRoundFirstPassOccurred: false,
    rotationCounter: 0,
  } as unknown as IGame;
}

function createPlayer(overrides: Record<string, unknown> = {}): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { credits: 4, energy: 3, publicity: 4 },
    probesInSpace: 0,
    probeSpaceLimit: 1,
    ...overrides,
  });
}

describe('LaunchProbeAction', () => {
  describe('canExecute', () => {
    it('returns true with 2+ credits and probes below limit', () => {
      const game = createMockGame();
      const player = createPlayer();
      expect(LaunchProbeAction.canExecute(player, game)).toBe(true);
    });

    it('returns true with exactly 2 credits', () => {
      const game = createMockGame();
      const player = createPlayer({
        resources: { credits: 2, energy: 0, publicity: 0 },
      });
      expect(LaunchProbeAction.canExecute(player, game)).toBe(true);
    });

    it('returns false with only 1 credit', () => {
      const game = createMockGame();
      const player = createPlayer({
        resources: { credits: 1, energy: 3, publicity: 4 },
      });
      expect(LaunchProbeAction.canExecute(player, game)).toBe(false);
    });

    it('returns false with 0 credits', () => {
      const game = createMockGame();
      const player = createPlayer({
        resources: { credits: 0, energy: 3, publicity: 4 },
      });
      expect(LaunchProbeAction.canExecute(player, game)).toBe(false);
    });

    it('returns false when probes in space equals limit', () => {
      const game = createMockGame();
      const player = createPlayer({ probesInSpace: 1, probeSpaceLimit: 1 });
      expect(LaunchProbeAction.canExecute(player, game)).toBe(false);
    });

    it('returns true with doubled probe limit', () => {
      const game = createMockGame();
      const player = createPlayer({ probesInSpace: 1, probeSpaceLimit: 2 });
      expect(LaunchProbeAction.canExecute(player, game)).toBe(true);
    });

    it('returns false when solarSystem is null', () => {
      const game = createMockGame();
      game.solarSystem = null;
      const player = createPlayer();
      expect(LaunchProbeAction.canExecute(player, game)).toBe(false);
    });
  });

  describe('execute', () => {
    it('spends 2 credits', () => {
      const game = createMockGame();
      const player = createPlayer();
      LaunchProbeAction.execute(player, game);
      expect(player.resources.credits).toBe(2);
    });

    it('increments probesInSpace', () => {
      const game = createMockGame();
      const player = createPlayer();
      expect(player.probesInSpace).toBe(0);
      LaunchProbeAction.execute(player, game);
      expect(player.probesInSpace).toBe(1);
    });

    it('places probe on Earth space', () => {
      const game = createMockGame();
      const player = createPlayer();
      const result = LaunchProbeAction.execute(player, game);
      const earthSpaces = game.solarSystem!.getSpacesOnPlanet(EPlanet.EARTH);
      expect(earthSpaces.length).toBeGreaterThan(0);
      const probes = game.solarSystem!.getProbesAt(earthSpaces[0].id);
      expect(probes.some((p) => p.playerId === 'p1')).toBe(true);
      expect(result.spaceId).toBe(earthSpaces[0].id);
    });

    it('throws when action is illegal', () => {
      const game = createMockGame();
      const player = createPlayer({
        resources: { credits: 0, energy: 0, publicity: 0 },
      });
      expect(() => LaunchProbeAction.execute(player, game)).toThrow();
    });

    it('allows two probes with limit 2', () => {
      const game = createMockGame();
      const player = createPlayer({ probeSpaceLimit: 2 });
      LaunchProbeAction.execute(player, game);
      expect(player.probesInSpace).toBe(1);
      player.resources.gain({ credits: 2 });
      LaunchProbeAction.execute(player, game);
      expect(player.probesInSpace).toBe(2);
    });

    it('LaunchProbeEffect executes without standard action cost', () => {
      const game = createMockGame();
      const player = createPlayer({
        resources: { credits: 0, energy: 3, publicity: 4 },
      });
      LaunchProbeEffect.execute(player, game);
      expect(player.resources.credits).toBe(0);
      expect(player.probesInSpace).toBe(1);
    });
  });
});
