import { EPlanet } from '@seti/common/types/protocol/enums';
import { describe, expect, it } from 'vitest';
import { LightsailCard } from '@/engine/cards/base/LightsailCard.js';
import { Game } from '@/engine/Game.js';
import { emitPlanetVisitedTurnEvent } from '@/engine/turnEffects/TurnEffects.js';

const PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

describe('LightsailCard', () => {
  it('scores for each unique future planet visit including Earth', () => {
    const game = Game.create(PLAYERS, { playerCount: 2 }, 'lightsail-test');
    const player = game.activePlayer;
    const card = new LightsailCard();
    const scoreBefore = player.score;

    emitPlanetVisitedTurnEvent(game, player, {
      planet: EPlanet.MERCURY,
      publicityGained: 0,
    });
    card.play({ player, game });
    game.deferredActions.drain(game);
    emitPlanetVisitedTurnEvent(game, player, {
      planet: EPlanet.EARTH,
      publicityGained: 0,
    });
    emitPlanetVisitedTurnEvent(game, player, {
      planet: EPlanet.EARTH,
      publicityGained: 0,
    });
    emitPlanetVisitedTurnEvent(game, player, {
      planet: EPlanet.MERCURY,
      publicityGained: 0,
    });

    expect(card.id).toBe('25');
    expect(card.behavior.custom).toBeUndefined();
    expect(player.score).toBe(scoreBefore + 2);
  });
});
