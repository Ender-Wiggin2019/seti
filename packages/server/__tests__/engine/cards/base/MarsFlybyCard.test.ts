import { EPlanet } from '@seti/common/types/protocol/enums';
import { describe, expect, it } from 'vitest';
import { MarsFlybyCard } from '@/engine/cards/base/MarsFlybyCard.js';
import { Game } from '@/engine/Game.js';
import { emitPlanetVisitedTurnEvent } from '@/engine/turnEffects/TurnEffects.js';

const PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

describe('MarsFlybyCard', () => {
  it('scores once for a future Mars visit', () => {
    const game = Game.create(PLAYERS, { playerCount: 2 }, 'mars-flyby-test');
    const player = game.activePlayer;
    const card = new MarsFlybyCard();
    const scoreBefore = player.score;

    card.play({ player, game });
    game.deferredActions.drain(game);
    emitPlanetVisitedTurnEvent(game, player, {
      planet: EPlanet.MARS,
      publicityGained: 0,
    });

    expect(card.id).toBe('22');
    expect(card.behavior.custom).toBeUndefined();
    expect(player.score).toBe(scoreBefore + 4);
  });
});
