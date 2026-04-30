import { describe, expect, it } from 'vitest';
import { CometaryEncounterCard } from '@/engine/cards/base/CometaryEncounterCard.js';
import { Game } from '@/engine/Game.js';
import { emitCometVisitedTurnEvent } from '@/engine/turnEffects/TurnEffects.js';

const PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

describe('CometaryEncounterCard', () => {
  it('scores once for a future comet visit', () => {
    const game = Game.create(PLAYERS, { playerCount: 2 }, 'cometary-test');
    const player = game.activePlayer;
    const card = new CometaryEncounterCard();
    const scoreBefore = player.score;

    card.play({ player, game });
    game.deferredActions.drain(game);
    emitCometVisitedTurnEvent(game, player);
    emitCometVisitedTurnEvent(game, player);

    expect(card.id).toBe('124');
    expect(card.behavior.custom).toBeUndefined();
    expect(player.score).toBe(scoreBefore + 4);
  });
});
