import { ESector } from '@seti/common/types/element';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { ScanAction } from '@/engine/actions/Scan.js';
import { Sector } from '@/engine/board/Sector.js';
import { Deck } from '@/engine/deck/Deck.js';
import { RefillCardRowEffect } from '@/engine/effects/cardRow/RefillCardRowEffect.js';
import { MarkSectorSignalEffect } from '@/engine/effects/scan/MarkSectorSignalEffect.js';
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
    cardRow: [
      { id: 'card-row-1', sector: ESector.BLUE },
      { id: 'card-row-2', sector: ESector.RED },
      { id: 'card-row-3', sector: ESector.YELLOW },
    ],
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
      ScanAction.execute(player, game);
      expect(player.resources.credits).toBe(3);
      expect(player.resources.energy).toBe(1);
    });

    it('marks a signal in the earth sector (index 0) immediately', () => {
      const game = createMockGame();
      const player = basePlayer();
      const earth = game.sectors[0] as Sector;
      ScanAction.execute(player, game);
      expect(earth.markerSlots.some((m) => m.playerId === player.id)).toBe(
        true,
      );
    });

    it('returns a PlayerInput for card row selection', () => {
      const game = createMockGame();
      const player = basePlayer();
      const input = ScanAction.execute(player, game);
      expect(input).toBeDefined();
      expect(input!.type).toBe(EPlayerInputType.CARD);
    });

    it('processes card selection: removes card, marks target sector, refills card row', () => {
      const game = createMockGame();
      const player = basePlayer();
      const target = game.sectors[1] as Sector;

      const input = ScanAction.execute(player, game);
      expect(input).toBeDefined();

      input!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['card-row-1'],
      });

      expect(target.markerSlots.some((m) => m.playerId === player.id)).toBe(
        true,
      );

      expect(game.cardRow.length).toBe(3);
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
      expect(() => ScanAction.execute(player, game)).toThrow();
    });
  });

  describe('MarkSectorSignalEffect (atomic)', () => {
    it('marks signal by index', () => {
      const game = createMockGame();
      const player = basePlayer();
      const result = MarkSectorSignalEffect.markByIndex(player, game, 0);
      expect(result).not.toBeNull();
      expect(result!.sectorId).toBe('sector-earth');
    });

    it('marks signal by color', () => {
      const game = createMockGame();
      const player = basePlayer();
      const result = MarkSectorSignalEffect.markByColor(
        player,
        game,
        ESector.BLUE,
      );
      expect(result).not.toBeNull();
      expect(result!.sectorId).toBe('sector-target');
    });

    it('returns null for invalid index', () => {
      const game = createMockGame();
      const player = basePlayer();
      expect(MarkSectorSignalEffect.markByIndex(player, game, 99)).toBeNull();
    });
  });

  describe('RefillCardRowEffect', () => {
    it('fills card row to target size', () => {
      const game = createMockGame();
      game.cardRow = [];
      const result = RefillCardRowEffect.execute(game, 3);
      expect(result.cardsAdded).toBe(2);
      expect(game.cardRow.length).toBe(2);
    });
  });
});
