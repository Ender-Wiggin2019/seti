import { ETrace, ESector } from '@seti/common/types/element';
import { Sector } from '@/engine/board/Sector.js';
import { SectorFulfillmentEffect } from '@/engine/effects/scan/SectorFulfillmentEffect.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

function createPlayer(id: string, seatIndex = 0): Player {
  return new Player({
    id,
    name: id,
    color: 'red',
    seatIndex,
  });
}

function createMockGame(
  players: Player[],
  sectors: Sector[],
): IGame {
  return {
    players,
    sectors,
    eventLog: { append: () => undefined },
  } as unknown as IGame;
}

describe('SectorFulfillmentEffect', () => {
  describe('checkAll', () => {
    it('returns undefined when no sectors are fulfilled', () => {
      const p1 = createPlayer('p1');
      const sector = new Sector({
        id: 's1',
        color: ESector.RED,
        dataSlotCapacity: 3,
      });
      sector.markSignal('p1');
      const game = createMockGame([p1], [sector]);

      const result = SectorFulfillmentEffect.checkAll(game);
      expect(result).toBeUndefined();
    });

    it('resolves a single fulfilled sector', () => {
      const p1 = createPlayer('p1');
      const p2 = createPlayer('p2', 1);
      const sector = new Sector({
        id: 's1',
        color: ESector.RED,
        dataSlotCapacity: 2,
      });
      sector.markSignal('p1');
      sector.markSignal('p2');
      expect(sector.isFulfilled()).toBe(true);

      const game = createMockGame([p1, p2], [sector]);

      SectorFulfillmentEffect.checkAll(game);

      expect(sector.sectorWinners).toHaveLength(1);
    });

    it('awards +1 publicity to all participants', () => {
      const p1 = createPlayer('p1');
      const p2 = createPlayer('p2', 1);
      const pubBefore1 = p1.resources.publicity;
      const pubBefore2 = p2.resources.publicity;

      const sector = new Sector({
        id: 's1',
        color: ESector.RED,
        dataSlotCapacity: 2,
      });
      sector.markSignal('p1');
      sector.markSignal('p2');

      const game = createMockGame([p1, p2], [sector]);
      SectorFulfillmentEffect.checkAll(game);

      expect(p1.resources.publicity).toBe(pubBefore1 + 1);
      expect(p2.resources.publicity).toBe(pubBefore2 + 1);
    });

    it('resolves multiple fulfilled sectors in index order', () => {
      const p1 = createPlayer('p1');
      const p2 = createPlayer('p2', 1);

      const s1 = new Sector({
        id: 's1',
        color: ESector.RED,
        dataSlotCapacity: 2,
      });
      s1.markSignal('p1');
      s1.markSignal('p2');

      const s2 = new Sector({
        id: 's2',
        color: ESector.BLUE,
        dataSlotCapacity: 2,
      });
      s2.markSignal('p2');
      s2.markSignal('p1');

      const game = createMockGame([p1, p2], [s1, s2]);
      SectorFulfillmentEffect.checkAll(game);

      expect(s1.sectorWinners).toHaveLength(1);
      expect(s2.sectorWinners).toHaveLength(1);
    });

    it('calls onComplete after all sectors resolved', () => {
      const p1 = createPlayer('p1');
      const sector = new Sector({
        id: 's1',
        color: ESector.RED,
        dataSlotCapacity: 1,
      });
      sector.markSignal('p1');

      const game = createMockGame([p1], [sector]);
      let completeCalled = false;

      SectorFulfillmentEffect.checkAll(game, () => {
        completeCalled = true;
        return undefined;
      });

      expect(completeCalled).toBe(true);
    });

    it('skips non-fulfilled sectors', () => {
      const p1 = createPlayer('p1');
      const fulfilled = new Sector({
        id: 's1',
        color: ESector.RED,
        dataSlotCapacity: 1,
      });
      fulfilled.markSignal('p1');

      const partial = new Sector({
        id: 's2',
        color: ESector.BLUE,
        dataSlotCapacity: 3,
      });
      partial.markSignal('p1');

      const game = createMockGame([p1], [fulfilled, partial]);
      SectorFulfillmentEffect.checkAll(game);

      expect(fulfilled.sectorWinners).toHaveLength(1);
      expect(partial.sectorWinners).toHaveLength(0);
    });
  });

  describe('winner bonuses', () => {
    it('applies first-win bonus to the sector winner', () => {
      const p1 = createPlayer('p1');
      const p2 = createPlayer('p2', 1);
      const scoreBefore = p1.score;

      const sector = new Sector({
        id: 's1',
        color: ESector.RED,
        dataSlotCapacity: 2,
        firstWinBonus: [{ type: 'vp', amount: 5 }],
        repeatWinBonus: [{ type: 'vp', amount: 2 }],
      });
      sector.markSignal('p1');
      sector.markSignal('p2');

      const game = createMockGame([p1, p2], [sector]);
      SectorFulfillmentEffect.checkAll(game);

      expect(p1.score).toBe(scoreBefore + 5);
    });

    it('applies repeat-win bonus on second completion', () => {
      const p1 = createPlayer('p1');
      const p2 = createPlayer('p2', 1);

      const sector = new Sector({
        id: 's1',
        color: ESector.RED,
        dataSlotCapacity: 2,
        firstWinBonus: [{ type: 'vp', amount: 5 }],
        repeatWinBonus: [{ type: 'vp', amount: 2 }],
      });

      sector.markSignal('p1');
      sector.markSignal('p2');
      const game = createMockGame([p1, p2], [sector]);
      SectorFulfillmentEffect.checkAll(game);

      const scoreAfterFirst = p1.score;

      sector.markSignal('p1');
      SectorFulfillmentEffect.checkAll(game);

      expect(p1.score).toBe(scoreAfterFirst + 2);
    });

    it('applies trace bonus to winner', () => {
      const p1 = createPlayer('p1');

      const sector = new Sector({
        id: 's1',
        color: ESector.RED,
        dataSlotCapacity: 1,
        firstWinBonus: [{ type: 'trace', trace: ETrace.RED }],
      });
      sector.markSignal('p1');

      const game = createMockGame([p1], [sector]);
      SectorFulfillmentEffect.checkAll(game);

      expect(p1.traces[ETrace.RED]).toBe(1);
    });

    it('applies compound bonus (vp + trace)', () => {
      const p1 = createPlayer('p1');
      const scoreBefore = p1.score;

      const sector = new Sector({
        id: 's1',
        color: ESector.RED,
        dataSlotCapacity: 1,
        firstWinBonus: [
          { type: 'vp', amount: 3 },
          { type: 'trace', trace: ETrace.BLUE },
        ],
      });
      sector.markSignal('p1');

      const game = createMockGame([p1], [sector]);
      SectorFulfillmentEffect.checkAll(game);

      expect(p1.score).toBe(scoreBefore + 3);
      expect(p1.traces[ETrace.BLUE]).toBe(1);
    });
  });

  describe('sector reset after resolution', () => {
    it('resets sector data with second-place marker at index 0', () => {
      const p1 = createPlayer('p1');
      const p2 = createPlayer('p2', 1);

      const sector = new Sector({
        id: 's1',
        color: ESector.RED,
        dataSlotCapacity: 3,
      });
      sector.markSignal('p1');
      sector.markSignal('p1');
      sector.markSignal('p2');

      const game = createMockGame([p1, p2], [sector]);
      SectorFulfillmentEffect.checkAll(game);

      expect(sector.completed).toBe(false);
      expect(sector.signals[0]).toEqual({ type: 'player', playerId: 'p2' });
      expect(sector.signals.filter((s) => s.type === 'data')).toHaveLength(2);
    });
  });
});
