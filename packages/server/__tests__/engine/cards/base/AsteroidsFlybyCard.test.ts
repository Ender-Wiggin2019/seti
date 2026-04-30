import { describe, expect, it } from 'vitest';
import { AsteroidsFlybyCard } from '@/engine/cards/base/AsteroidsFlybyCard.js';
import { Game } from '@/engine/Game.js';
import { emitAsteroidsVisitedTurnEvent } from '@/engine/turnEffects/TurnEffects.js';

const PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

describe('AsteroidsFlybyCard', () => {
  it('gains data once for a future asteroid visit', () => {
    const game = Game.create(
      PLAYERS,
      { playerCount: 2 },
      'asteroids-flyby-test',
    );
    const player = game.activePlayer;
    const card = new AsteroidsFlybyCard();
    const dataBefore = player.resources.data;

    card.play({ player, game });
    game.deferredActions.drain(game);
    emitAsteroidsVisitedTurnEvent(game, player);
    emitAsteroidsVisitedTurnEvent(game, player);

    expect(card.id).toBe('123');
    expect(card.behavior.custom).toBeUndefined();
    expect(player.resources.data).toBe(dataBefore + 1);
  });
});
