import type { IComputerColumnConfig } from '@seti/common/types/computer';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { ETechId } from '@seti/common/types/tech';
import type { Deck } from '@/engine/deck/Deck.js';
import { PlaceDataFreeAction } from '@/engine/freeActions/PlaceData.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

const SIMPLE_3_COL: IComputerColumnConfig[] = [
  { topReward: null, techSlotAvailable: true },
  { topReward: null, techSlotAvailable: true },
  { topReward: null, techSlotAvailable: true },
];

function createTestPlayer(overrides?: Record<string, unknown>): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    dataPoolCount: 3,
    ...overrides,
  });
}

function createMockGame(deckCards: string[] = []): IGame {
  return {
    mainDeck: {
      drawN(count: number): string[] {
        return deckCards.splice(0, count);
      },
    } as Deck<string>,
  } as unknown as IGame;
}

describe('PlaceDataFreeAction', () => {
  describe('canExecute', () => {
    it('returns true when data in pool and computer has space', () => {
      const player = createTestPlayer();
      expect(PlaceDataFreeAction.canExecute(player, createMockGame())).toBe(
        true,
      );
    });

    it('returns false when data pool is empty', () => {
      const player = createTestPlayer({ dataPoolCount: 0 });
      expect(PlaceDataFreeAction.canExecute(player, createMockGame())).toBe(
        false,
      );
    });

    it('returns false when top full and no bottom slots available', () => {
      const player = createTestPlayer({
        computerColumnConfigs: SIMPLE_3_COL,
      });
      player.computer.placeData({ row: 'TOP' as never, index: 0 });
      player.computer.placeData({ row: 'TOP' as never, index: 1 });
      player.computer.placeData({ row: 'TOP' as never, index: 2 });
      expect(PlaceDataFreeAction.canExecute(player, createMockGame())).toBe(
        false,
      );
    });

    it('returns true when top full and bottom slot available via tech', () => {
      const player = createTestPlayer({
        computerColumnConfigs: SIMPLE_3_COL,
      });
      player.computer.placeTech(0, {
        techId: ETechId.COMPUTER_VP_CREDIT,
        bottomReward: { credits: 1 },
      });
      player.computer.placeData({ row: 'TOP' as never, index: 0 });
      player.computer.placeData({ row: 'TOP' as never, index: 1 });
      player.computer.placeData({ row: 'TOP' as never, index: 2 });
      expect(PlaceDataFreeAction.canExecute(player, createMockGame())).toBe(
        true,
      );
    });
  });

  describe('execute - basic placement', () => {
    it('places data from pool to first top slot', () => {
      const player = createTestPlayer();
      const initialPoolCount = player.dataPool.count;

      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.row).toBe('top');
      expect(result.index).toBe(0);
      expect(player.dataPool.count).toBe(initialPoolCount - 1);
      expect(player.computer.getTopSlots()[0]).toBe(true);
    });

    it('fills top slots left to right across 6 default columns', () => {
      const player = createTestPlayer({ dataPoolCount: 6 });

      for (let i = 0; i < 6; i++) {
        const result = PlaceDataFreeAction.execute(player, createMockGame());
        expect(result.row).toBe('top');
        expect(result.index).toBe(i);
      }
      expect(player.computer.getTopSlots().every(Boolean)).toBe(true);
    });

    it('throws when data pool is empty', () => {
      const player = createTestPlayer({ dataPoolCount: 0 });

      expect(() =>
        PlaceDataFreeAction.execute(player, createMockGame()),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INSUFFICIENT_RESOURCES }),
      );
    });
  });

  describe('execute - bottom slot via tech placement', () => {
    it('fills bottom slot after top is full', () => {
      const player = createTestPlayer({
        dataPoolCount: 5,
        computerColumnConfigs: SIMPLE_3_COL,
      });
      player.computer.placeTech(0, {
        techId: ETechId.COMPUTER_VP_CREDIT,
        bottomReward: { credits: 1 },
      });

      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.row).toBe('bottom');
      expect(result.index).toBe(0);
    });

    it('skips columns without tech when looking for bottom slot', () => {
      const player = createTestPlayer({
        dataPoolCount: 5,
        computerColumnConfigs: SIMPLE_3_COL,
      });
      player.computer.placeTech(2, {
        techId: ETechId.COMPUTER_VP_CARD,
        bottomReward: { drawCard: 1 },
      });

      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.row).toBe('bottom');
      expect(result.index).toBe(2);
    });

    it('throws when top full and no bottom slots available', () => {
      const player = createTestPlayer({
        dataPoolCount: 5,
        computerColumnConfigs: SIMPLE_3_COL,
      });

      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());

      expect(() =>
        PlaceDataFreeAction.execute(player, createMockGame()),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INVALID_ACTION }),
      );
    });
  });

  describe('execute - rewards', () => {
    it('grants 2VP when placing on top slot with tech', () => {
      const player = createTestPlayer({
        computerColumnConfigs: SIMPLE_3_COL,
      });
      player.computer.placeTech(0, {
        techId: ETechId.COMPUTER_VP_CREDIT,
        bottomReward: { credits: 1 },
      });
      const initialScore = player.score;

      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.row).toBe('top');
      expect(result.index).toBe(0);
      expect(result.reward).toEqual({ vp: 2 });
      expect(player.score).toBe(initialScore + 2);
    });

    it('grants built-in top reward (publicity) from default config', () => {
      const player = createTestPlayer({ dataPoolCount: 6 });
      const publicityBefore = player.resources.publicity;

      PlaceDataFreeAction.execute(player, createMockGame());
      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.row).toBe('top');
      expect(result.index).toBe(1);
      expect(result.reward).toEqual({ publicity: 1 });
      expect(player.resources.publicity).toBe(publicityBefore + 1);
    });

    it('grants no reward for top slot without reward or tech', () => {
      const player = createTestPlayer({
        computerColumnConfigs: SIMPLE_3_COL,
      });
      const initialScore = player.score;

      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.reward).toBeUndefined();
      expect(player.score).toBe(initialScore);
    });

    it('grants credit for bottom slot of credit tech', () => {
      const player = createTestPlayer({
        dataPoolCount: 5,
        computerColumnConfigs: SIMPLE_3_COL,
      });
      player.computer.placeTech(0, {
        techId: ETechId.COMPUTER_VP_CREDIT,
        bottomReward: { credits: 1 },
      });
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());

      const creditsBefore = player.resources.credits;
      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.row).toBe('bottom');
      expect(result.index).toBe(0);
      expect(result.reward).toEqual({ credits: 1 });
      expect(player.resources.credits).toBe(creditsBefore + 1);
    });

    it('grants energy for bottom slot of energy tech', () => {
      const player = createTestPlayer({
        dataPoolCount: 5,
        computerColumnConfigs: SIMPLE_3_COL,
      });
      player.computer.placeTech(1, {
        techId: ETechId.COMPUTER_VP_ENERGY,
        bottomReward: { energy: 1 },
      });
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());

      const energyBefore = player.resources.energy;
      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.row).toBe('bottom');
      expect(result.index).toBe(1);
      expect(result.reward).toEqual({ energy: 1 });
      expect(player.resources.energy).toBe(energyBefore + 1);
    });

    it('draws card for bottom slot of card tech', () => {
      const player = createTestPlayer({
        dataPoolCount: 5,
        computerColumnConfigs: SIMPLE_3_COL,
      });
      player.computer.placeTech(2, {
        techId: ETechId.COMPUTER_VP_CARD,
        bottomReward: { drawCard: 1 },
      });
      PlaceDataFreeAction.execute(player, createMockGame(['card-a']));
      PlaceDataFreeAction.execute(player, createMockGame(['card-a']));
      PlaceDataFreeAction.execute(player, createMockGame(['card-a']));

      const handBefore = player.hand.length;
      const game = createMockGame(['reward-card']);
      const result = PlaceDataFreeAction.execute(player, game);

      expect(result.row).toBe('bottom');
      expect(result.index).toBe(2);
      expect(result.reward).toEqual({ drawCard: 1 });
      expect(player.hand.length).toBe(handBefore + 1);
      expect(player.hand).toContain('reward-card');
    });

    it('grants publicity for bottom slot of publicity tech', () => {
      const player = createTestPlayer({
        dataPoolCount: 5,
        computerColumnConfigs: SIMPLE_3_COL,
      });
      player.computer.placeTech(0, {
        techId: ETechId.COMPUTER_VP_PUBLICITY,
        bottomReward: { publicity: 2 },
      });
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());

      const publicityBefore = player.resources.publicity;
      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.row).toBe('bottom');
      expect(result.index).toBe(0);
      expect(result.reward).toEqual({ publicity: 2 });
      expect(player.resources.publicity).toBe(publicityBefore + 2);
    });
  });
});
