import { EErrorCode } from '@seti/common/types/protocol/errors';
import { ETechId } from '@seti/common/types/tech';
import type { Deck } from '@/engine/deck/Deck.js';
import { PlaceDataFreeAction } from '@/engine/freeActions/PlaceData.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

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

    it('returns false when top full and no computer tech for bottom', () => {
      const player = createTestPlayer({
        computerTopSlots: 3,
        computerBottomSlots: 3,
      });
      player.computer.placeData({ row: 'TOP' as never, index: 0 });
      player.computer.placeData({ row: 'TOP' as never, index: 1 });
      player.computer.placeData({ row: 'TOP' as never, index: 2 });
      expect(PlaceDataFreeAction.canExecute(player, createMockGame())).toBe(
        false,
      );
    });

    it('returns true when top full and player has matching computer tech', () => {
      const player = createTestPlayer({
        computerTopSlots: 3,
        computerBottomSlots: 3,
        techs: [ETechId.COMPUTER_VP_CREDIT],
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

    it('fills top slots left to right', () => {
      const player = createTestPlayer({ dataPoolCount: 3 });

      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.row).toBe('top');
      expect(result.index).toBe(2);
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

  describe('execute - bottom slot tech gating', () => {
    it('fills tech-unlocked bottom slot after top is full', () => {
      const player = createTestPlayer({
        dataPoolCount: 5,
        computerTopSlots: 3,
        computerBottomSlots: 3,
        techs: [ETechId.COMPUTER_VP_CREDIT],
      });

      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.row).toBe('bottom');
      expect(result.index).toBe(0);
    });

    it('skips bottom slots without matching tech', () => {
      const player = createTestPlayer({
        dataPoolCount: 5,
        computerTopSlots: 3,
        computerBottomSlots: 3,
        techs: [ETechId.COMPUTER_VP_CARD],
      });

      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.row).toBe('bottom');
      expect(result.index).toBe(2);
    });

    it('throws when top full and no tech-unlocked bottom available', () => {
      const player = createTestPlayer({
        dataPoolCount: 5,
        computerTopSlots: 3,
        computerBottomSlots: 3,
        techs: [],
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
    it('grants 2VP when placing on top slot with matching computer tech', () => {
      const player = createTestPlayer({
        techs: [ETechId.COMPUTER_VP_CREDIT],
      });
      const initialScore = player.score;

      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.row).toBe('top');
      expect(result.index).toBe(0);
      expect(result.reward).toEqual({ vp: 2 });
      expect(player.score).toBe(initialScore + 2);
    });

    it('grants no reward for top slot without matching computer tech', () => {
      const player = createTestPlayer({ techs: [] });
      const initialScore = player.score;

      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.reward).toBeUndefined();
      expect(player.score).toBe(initialScore);
    });

    it('grants +1 credit for bottom slot of comp-0', () => {
      const player = createTestPlayer({
        dataPoolCount: 5,
        computerTopSlots: 3,
        computerBottomSlots: 3,
        techs: [ETechId.COMPUTER_VP_CREDIT],
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

    it('grants +1 energy for bottom slot of comp-1', () => {
      const player = createTestPlayer({
        dataPoolCount: 5,
        computerTopSlots: 3,
        computerBottomSlots: 3,
        techs: [ETechId.COMPUTER_VP_ENERGY],
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

    it('draws 1 card for bottom slot of comp-2', () => {
      const player = createTestPlayer({
        dataPoolCount: 5,
        computerTopSlots: 3,
        computerBottomSlots: 3,
        techs: [ETechId.COMPUTER_VP_CARD],
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

    it('grants +2 publicity for bottom slot of comp-3', () => {
      const player = createTestPlayer({
        dataPoolCount: 5,
        computerTopSlots: 4,
        computerBottomSlots: 4,
        techs: [ETechId.COMPUTER_VP_PUBLICITY],
      });
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());

      const publicityBefore = player.resources.publicity;
      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.row).toBe('bottom');
      expect(result.index).toBe(3);
      expect(result.reward).toEqual({ publicity: 2 });
      expect(player.resources.publicity).toBe(publicityBefore + 2);
    });
  });
});
