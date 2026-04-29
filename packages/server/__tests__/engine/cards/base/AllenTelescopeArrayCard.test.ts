import { ESector } from '@seti/common/types/element';
import { describe, expect, it } from 'vitest';
import { Sector } from '@/engine/board/Sector.js';
import { AllenTelescopeArrayCard } from '@/engine/cards/base/AllenTelescopeArrayCard.js';
import { MarkSectorSignalEffect } from '@/engine/effects/scan/MarkSectorSignalEffect.js';
import { Game } from '@/engine/Game.js';

const PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

describe('AllenTelescopeArrayCard', () => {
  it('gains energy once when a future signal completes a sector this turn', () => {
    const game = Game.create(PLAYERS, { playerCount: 2 }, 'allen-test');
    const player = game.activePlayer;
    const card = new AllenTelescopeArrayCard();
    const sector = new Sector({
      id: 'test-sector',
      color: ESector.RED,
      dataSlotCapacity: 1,
    });
    game.cardRow = [];
    game.sectors = [sector];
    const energyBefore = player.resources.energy;

    card.play({ player, game });
    game.deferredActions.drain(game);
    MarkSectorSignalEffect.markOnSector(player, game, sector);

    expect(card.id).toBe('45');
    expect(card.behavior.custom).toBeUndefined();
    expect(player.resources.energy).toBe(energyBefore + 1);
  });
});
