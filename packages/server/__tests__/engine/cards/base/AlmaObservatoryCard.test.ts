import { ESector } from '@seti/common/types/element';
import { describe, expect, it } from 'vitest';
import { Sector } from '@/engine/board/Sector.js';
import { AlmaObservatoryCard } from '@/engine/cards/base/AlmaObservatoryCard.js';
import { MarkSectorSignalEffect } from '@/engine/effects/scan/MarkSectorSignalEffect.js';
import { Game } from '@/engine/Game.js';

const PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

describe('AlmaObservatoryCard', () => {
  it('draws one card once when a future signal completes a sector this turn', () => {
    const game = Game.create(PLAYERS, { playerCount: 2 }, 'alma-test');
    const player = game.activePlayer;
    const card = new AlmaObservatoryCard();
    const sector = new Sector({
      id: 'test-sector',
      color: ESector.YELLOW,
      dataSlotCapacity: 1,
    });
    game.cardRow = [];
    game.sectors = [sector];
    const handBefore = player.hand.length;

    card.play({ player, game });
    game.deferredActions.drain(game);
    MarkSectorSignalEffect.markOnSector(player, game, sector);

    expect(card.id).toBe('46');
    expect(card.behavior.custom).toBeUndefined();
    expect(player.hand).toHaveLength(handBefore + 1);
  });
});
