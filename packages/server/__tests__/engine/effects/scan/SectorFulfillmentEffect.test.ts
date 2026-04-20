import { ESector, ETrace } from '@seti/common/types/element';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { Sector } from '@/engine/board/Sector.js';
import { SectorFulfillmentEffect } from '@/engine/effects/scan/SectorFulfillmentEffect.js';
import type { IGame } from '@/engine/IGame.js';
import { EPieceType } from '@/engine/player/Pieces.js';
import { Player } from '@/engine/player/Player.js';

function createPlayer(id: string, seatIndex = 0): Player {
  return new Player({
    id,
    name: id,
    color: 'red',
    seatIndex,
  });
}

function createMockGame(players: Player[], sectors: Sector[]): IGame {
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
      // L→R fill: p2 first, p1 second. Tie → later-placed (p1) wins.
      sector.markSignal('p2');
      sector.markSignal('p1');

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

      // Round 1: L→R → [p2, p1]. Tie → p1 wins (later placed).
      sector.markSignal('p2');
      sector.markSignal('p1');
      const game = createMockGame([p1, p2], [sector]);
      SectorFulfillmentEffect.checkAll(game);

      const scoreAfterFirst = p1.score;

      // Round 2: reset leaves [p2, D]. markSignal(p1) → [p2, p1].
      // p1 wins again → repeat-win bonus (+2 VP).
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

  // 5.9 Returning sector markers to players:
  // - Participants other than the second-place player get every marker back.
  // - The second-place player keeps exactly one marker on the first slot
  //   (the marker already on the sector is what represents their "remaining"
  //   deployed piece; all their additional markers on the sector are returned).
  describe('5.9 marker return after resolution', () => {
    it('returns every marker to the winner and non-second-place participants', () => {
      const p1 = createPlayer('p1');
      const p2 = createPlayer('p2', 1);

      // Simulate the mark-signal "deploy" side: each sector marker that
      // the player placed on the sector corresponds to a deployed piece.
      p1.pieces.deploy(EPieceType.SECTOR_MARKER);
      p1.pieces.deploy(EPieceType.SECTOR_MARKER);
      p2.pieces.deploy(EPieceType.SECTOR_MARKER);

      const sector = new Sector({
        id: 's1',
        color: ESector.RED,
        dataSlotCapacity: 3,
      });
      sector.markSignal(p1.id);
      sector.markSignal(p1.id);
      sector.markSignal(p2.id);
      expect(sector.isFulfilled()).toBe(true);

      const game = createMockGame([p1, p2], [sector]);
      SectorFulfillmentEffect.checkAll(game);

      // Winner has nothing left on any sector → all markers returned.
      expect(p1.pieces.deployed(EPieceType.SECTOR_MARKER)).toBe(0);
      // Second place retains exactly one marker (placed on slot 0 after reset).
      expect(p2.pieces.deployed(EPieceType.SECTOR_MARKER)).toBe(1);
    });

    it('returns all extra markers of the second-place player except the one kept on slot 0', () => {
      const p1 = createPlayer('p1');
      const p2 = createPlayer('p2', 1);

      // p1 ends up with 3 markers, p2 with 2. p1 wins; p2 is 2nd-place
      // and keeps one marker on slot 0 while the other is returned.
      p1.pieces.deploy(EPieceType.SECTOR_MARKER);
      p1.pieces.deploy(EPieceType.SECTOR_MARKER);
      p1.pieces.deploy(EPieceType.SECTOR_MARKER);
      p2.pieces.deploy(EPieceType.SECTOR_MARKER);
      p2.pieces.deploy(EPieceType.SECTOR_MARKER);

      const sector = new Sector({
        id: 's1',
        color: ESector.BLUE,
        dataSlotCapacity: 5,
      });
      sector.markSignal(p1.id);
      sector.markSignal(p2.id);
      sector.markSignal(p1.id);
      sector.markSignal(p2.id);
      sector.markSignal(p1.id);
      expect(sector.isFulfilled()).toBe(true);

      const game = createMockGame([p1, p2], [sector]);
      SectorFulfillmentEffect.checkAll(game);

      expect(p1.pieces.deployed(EPieceType.SECTOR_MARKER)).toBe(0);
      expect(p2.pieces.deployed(EPieceType.SECTOR_MARKER)).toBe(1);
    });
  });

  // Rule §5.4 / 5.13 — when multiple sectors fulfill simultaneously the
  // turn owner chooses the order of resolution. The engine surfaces a
  // `SelectOption` input listing every fulfilled sector; each pick
  // resolves that sector and the chain recurses on the remainder.
  describe('5.13 multi-sector resolution order is chosen by the turn owner', () => {
    function fulfillWith(id: string, winnerId: string, color: ESector): Sector {
      // dataSlotCapacity=1 → single marker fulfills; that marker is winner.
      const sector = new Sector({ id, color, dataSlotCapacity: 1 });
      sector.markSignal(winnerId);
      return sector;
    }

    it('prompts the turn owner to pick the resolution order and respects the pick', () => {
      const a = createPlayer('a', 0);
      const b = createPlayer('b', 1);
      const c = createPlayer('c', 2);

      const s1 = fulfillWith('s1', a.id, ESector.RED);
      const s2 = fulfillWith('s2', b.id, ESector.BLUE);
      const s3 = fulfillWith('s3', c.id, ESector.YELLOW);

      const game = createMockGame([a, b, c], [s1, s2, s3]);
      const resolvedOrder: string[] = [];

      // First prompt: 3 options, one per fulfilled sector.
      const firstPrompt = SectorFulfillmentEffect.checkAll(
        game,
        undefined,
        a,
        (sectorId) => {
          resolvedOrder.push(sectorId);
        },
      );
      expect(firstPrompt).toBeDefined();
      const firstModel = firstPrompt!.toModel() as {
        type: EPlayerInputType;
        options: { id: string; label: string }[];
      };
      expect(firstModel.type).toBe(EPlayerInputType.OPTION);
      expect(firstModel.options.map((o) => o.id)).toEqual([
        'resolve-sector-s1',
        'resolve-sector-s2',
        'resolve-sector-s3',
      ]);

      // Turn owner picks s2 first — the engine resolves s2 and re-prompts.
      const secondPrompt = firstPrompt!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'resolve-sector-s2',
      });
      expect(resolvedOrder).toEqual(['s2']);
      expect(secondPrompt).toBeDefined();
      const secondModel = secondPrompt!.toModel() as {
        options: { id: string }[];
      };
      expect(secondModel.options.map((o) => o.id)).toEqual([
        'resolve-sector-s1',
        'resolve-sector-s3',
      ]);

      // Then picks s3. With only s1 remaining, there is no further
      // prompt — a single fulfilled sector resolves directly.
      const done = secondPrompt!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'resolve-sector-s3',
      });
      expect(resolvedOrder).toEqual(['s2', 's3', 's1']);
      expect(done).toBeUndefined();
    });

    it('resolves directly (no prompt) when only a single sector is fulfilled', () => {
      const a = createPlayer('a', 0);
      const b = createPlayer('b', 1);
      const s1 = fulfillWith('s1', b.id, ESector.RED);

      const game = createMockGame([a, b], [s1]);
      const resolvedOrder: string[] = [];
      const input = SectorFulfillmentEffect.checkAll(
        game,
        undefined,
        a,
        (sectorId) => resolvedOrder.push(sectorId),
      );

      expect(input).toBeUndefined();
      expect(resolvedOrder).toEqual(['s1']);
    });

    it('falls back to board order when no turn owner is supplied (legacy path)', () => {
      const a = createPlayer('a', 0);
      const b = createPlayer('b', 1);
      const s1 = fulfillWith('s1', b.id, ESector.RED);
      const s2 = fulfillWith('s2', a.id, ESector.BLUE);

      const game = createMockGame([a, b], [s1, s2]);
      const resolvedOrder: string[] = [];
      SectorFulfillmentEffect.checkAll(game, undefined, undefined, (sectorId) =>
        resolvedOrder.push(sectorId),
      );

      // No turn owner → no prompt, preserve sector array order.
      expect(resolvedOrder).toEqual(['s1', 's2']);
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
