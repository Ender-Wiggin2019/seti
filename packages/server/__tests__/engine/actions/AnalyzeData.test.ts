import { AnalyzeDataAction } from '@/engine/actions/AnalyzeData.js';
import type { IGame } from '@/engine/IGame.js';
import { EComputerRow } from '@/engine/player/Computer.js';
import { Player } from '@/engine/player/Player.js';

function createMockGame(): IGame {
  return {
    solarSystem: null,
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
    ...overrides,
  });
}

function fillTopComputer(player: Player): void {
  for (let i = 0; i < 3; i += 1) {
    player.computer.placeData({ row: EComputerRow.TOP, index: i });
  }
}

describe('AnalyzeDataAction', () => {
  describe('canExecute', () => {
    it('returns true when computer is full and energy >= 1', () => {
      const game = createMockGame();
      const player = createPlayer();
      fillTopComputer(player);
      expect(AnalyzeDataAction.canExecute(player, game)).toBe(true);
    });

    it('returns false when computer is not full', () => {
      const game = createMockGame();
      const player = createPlayer();
      expect(AnalyzeDataAction.canExecute(player, game)).toBe(false);
    });

    it('returns false when there is no energy', () => {
      const game = createMockGame();
      const player = createPlayer({
        resources: { credits: 4, energy: 0, publicity: 4 },
      });
      fillTopComputer(player);
      expect(AnalyzeDataAction.canExecute(player, game)).toBe(false);
    });

    it('returns false when computer is only partially full', () => {
      const game = createMockGame();
      const player = createPlayer();
      player.computer.placeData({ row: EComputerRow.TOP, index: 0 });
      player.computer.placeData({ row: EComputerRow.TOP, index: 1 });
      expect(AnalyzeDataAction.canExecute(player, game)).toBe(false);
    });

    it('returns true with exactly 1 energy when computer is full', () => {
      const game = createMockGame();
      const player = createPlayer({
        resources: { credits: 4, energy: 1, publicity: 4 },
      });
      fillTopComputer(player);
      expect(AnalyzeDataAction.canExecute(player, game)).toBe(true);
    });
  });

  describe('execute', () => {
    it('spends 1 energy', () => {
      const game = createMockGame();
      const player = createPlayer({
        resources: { credits: 4, energy: 3, publicity: 4 },
      });
      fillTopComputer(player);
      const before = player.resources.energy;
      AnalyzeDataAction.execute(player, game);
      expect(player.resources.energy).toBe(before - 1);
    });

    it('clears computer data', () => {
      const game = createMockGame();
      const player = createPlayer();
      fillTopComputer(player);
      AnalyzeDataAction.execute(player, game);
      expect(player.computer.getPlacedCount()).toBe(0);
      expect(player.computer.isFull()).toBe(false);
    });

    it('returns dataCleared count matching placed data before clear', () => {
      const game = createMockGame();
      const player = createPlayer();
      fillTopComputer(player);
      const result = AnalyzeDataAction.execute(player, game);
      expect(result.dataCleared).toBe(3);
    });

    it('throws when the action is illegal', () => {
      const game = createMockGame();
      const player = createPlayer();
      expect(() => AnalyzeDataAction.execute(player, game)).toThrow();
    });
  });
});
