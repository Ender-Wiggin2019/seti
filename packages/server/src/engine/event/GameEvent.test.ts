import {
  createActionEvent,
  createGameEndEvent,
  createRoundEndEvent,
} from './GameEvent.js';

describe('GameEvent helpers', () => {
  it('creates action event with expected fields', () => {
    const event = createActionEvent('p1', 'SCAN', { sector: 'RED' });

    expect(event.type).toBe('ACTION');
    expect(event.playerId).toBe('p1');
    expect(event.action).toBe('SCAN');
    expect(event.details).toEqual({ sector: 'RED' });
    expect(typeof event.at).toBe('number');
  });

  it('creates round end and game end events', () => {
    const roundEvent = createRoundEndEvent(3);
    const gameEvent = createGameEndEvent({ p1: 42, p2: 40 });

    expect(roundEvent).toMatchObject({ type: 'ROUND_END', round: 3 });
    expect(gameEvent).toMatchObject({
      type: 'GAME_END',
      finalScores: { p1: 42, p2: 40 },
    });
  });
});
