import { ESector } from '@seti/common/types/element';
import { ScanAction } from '@/engine/actions/Scan.js';
import { Sector } from '@/engine/board/Sector.js';
import { Deck } from '@/engine/deck/Deck.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

function createMockGame(): IGame {
  const sectors = [
    new Sector({ id: 'sector-earth', color: ESector.RED, dataSlotCapacity: 3 }),
    new Sector({
      id: 'sector-target',
      color: ESector.BLUE,
      dataSlotCapacity: 3,
    }),
  ];
  const mainDeck = new Deck(['refill-1', 'refill-2']);
  return {
    solarSystem: null,
    planetaryBoard: null,
    techBoard: null,
    sectors,
    mainDeck,
    cardRow: ['card-row-1', 'card-row-2', 'card-row-3'],
    endOfRoundStacks: [],
    hiddenAliens: [],
    neutralMilestones: [],
    roundRotationReminderIndex: 0,
    hasRoundFirstPassOccurred: false,
    rotationCounter: 0,
  } as unknown as IGame;
}

const basePlayer = () =>
  new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { credits: 4, energy: 3, publicity: 4 },
  });

describe('ScanAction', () => {
  describe('canExecute', () => {
    it('returns true with sufficient resources', () => {
      const game = createMockGame();
      const player = basePlayer();
      expect(ScanAction.canExecute(player, game)).toBe(true);
    });

    it('returns false without credits', () => {
      const game = createMockGame();
      const player = new Player({
        id: 'p1',
        name: 'Alice',
        color: 'red',
        seatIndex: 0,
        resources: { credits: 0, energy: 3, publicity: 4 },
      });
      expect(ScanAction.canExecute(player, game)).toBe(false);
    });

    it('returns false without energy', () => {
      const game = createMockGame();
      const player = new Player({
        id: 'p1',
        name: 'Alice',
        color: 'red',
        seatIndex: 0,
        resources: { credits: 4, energy: 0, publicity: 4 },
      });
      expect(ScanAction.canExecute(player, game)).toBe(false);
    });

    it('returns false without both credits and energy', () => {
      const game = createMockGame();
      const player = new Player({
        id: 'p1',
        name: 'Alice',
        color: 'red',
        seatIndex: 0,
        resources: { credits: 0, energy: 0, publicity: 4 },
      });
      expect(ScanAction.canExecute(player, game)).toBe(false);
    });

    it('returns true with exact cost amounts (1 credit, 2 energy)', () => {
      const game = createMockGame();
      const player = new Player({
        id: 'p1',
        name: 'Alice',
        color: 'red',
        seatIndex: 0,
        resources: { credits: 1, energy: 2, publicity: 0 },
      });
      expect(ScanAction.canExecute(player, game)).toBe(true);
    });
  });

  describe('execute', () => {
    it('spends credits and energy', () => {
      const game = createMockGame();
      const player = basePlayer();
      ScanAction.execute(player, game, {
        cardRowDiscardIndex: 0,
        targetSectorColor: ESector.BLUE,
      });
      expect(player.resources.credits).toBe(3);
      expect(player.resources.energy).toBe(1);
    });

    it('marks a signal in the earth sector (default index 0)', () => {
      const game = createMockGame();
      const player = basePlayer();
      const earth = game.sectors[0] as Sector;
      ScanAction.execute(player, game, {
        cardRowDiscardIndex: 0,
        targetSectorColor: ESector.BLUE,
      });
      expect(earth.markerSlots.some((m) => m.playerId === player.id)).toBe(
        true,
      );
    });

    it('discards from the card row and refills from the main deck', () => {
      const game = createMockGame();
      const player = basePlayer();
      const beforeDeck = game.mainDeck.drawSize;
      ScanAction.execute(player, game, {
        cardRowDiscardIndex: 0,
        targetSectorColor: ESector.BLUE,
      });
      expect(game.cardRow).toEqual(['card-row-2', 'card-row-3', 'refill-1']);
      expect(game.mainDeck.drawSize).toBe(beforeDeck - 1);
    });

    it('marks a signal in the target sector matching targetSectorColor', () => {
      const game = createMockGame();
      const player = basePlayer();
      const target = game.sectors[1] as Sector;
      ScanAction.execute(player, game, {
        cardRowDiscardIndex: 0,
        targetSectorColor: ESector.BLUE,
      });
      expect(target.markerSlots.some((m) => m.playerId === player.id)).toBe(
        true,
      );
    });

    it('throws when the action is illegal (insufficient resources)', () => {
      const game = createMockGame();
      const player = new Player({
        id: 'p1',
        name: 'Alice',
        color: 'red',
        seatIndex: 0,
        resources: { credits: 0, energy: 0, publicity: 4 },
      });
      expect(() =>
        ScanAction.execute(player, game, {
          cardRowDiscardIndex: 0,
          targetSectorColor: ESector.BLUE,
        }),
      ).toThrow();
    });
  });
});
