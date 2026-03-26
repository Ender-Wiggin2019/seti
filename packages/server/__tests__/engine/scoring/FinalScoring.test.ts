import { Player } from '@/engine/player/Player.js';
import { FinalScoring } from '@/engine/scoring/FinalScoring.js';
import { GoldScoringTile } from '@/engine/scoring/GoldScoringTile.js';

describe('FinalScoring', () => {
  it('sums all scoring sources and determines winner', () => {
    const p1 = new Player({
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
      score: 30,
      completedMissions: ['m1', 'm2'],
      endGameCards: [{ endGameScore: 5 }],
    });
    const p2 = new Player({
      id: 'p2',
      name: 'Bob',
      color: 'blue',
      seatIndex: 1,
      score: 34,
      completedMissions: [],
      endGameCards: [{ endGameScore: 1 }],
    });

    const missionTile = new GoldScoringTile({
      id: 'mission',
      side: 'A',
      slotValues: [4, 3, 2, 1],
    });
    missionTile.claim('p1');
    missionTile.claim('p2');

    const game = {
      players: [p1, p2],
      goldScoringTiles: [missionTile],
      sectors: [],
      eventLog: { append: () => undefined },
    } as never;

    const result = FinalScoring.score(game);

    expect(result.scores.p1).toBe(43);
    expect(result.scores.p2).toBe(35);
    expect(result.winnerIds).toEqual(['p1']);
  });

  it('keeps ties as ties', () => {
    const p1 = new Player({
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
      score: 40,
    });
    const p2 = new Player({
      id: 'p2',
      name: 'Bob',
      color: 'blue',
      seatIndex: 1,
      score: 40,
    });

    const game = {
      players: [p1, p2],
      goldScoringTiles: [],
      sectors: [],
      eventLog: { append: () => undefined },
    } as never;

    const result = FinalScoring.score(game);
    expect(result.winnerIds).toEqual(['p1', 'p2']);
  });
});
