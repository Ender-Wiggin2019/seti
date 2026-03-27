import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { AlienState } from '@/engine/alien/AlienState.js';
import { Player } from '@/engine/player/Player.js';
import { GoldScoringTile } from '@/engine/scoring/GoldScoringTile.js';
import { MilestoneState } from '@/engine/scoring/Milestone.js';

function createPlayers() {
  return [
    new Player({ id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 }),
    new Player({ id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 }),
  ];
}

describe('MilestoneState', () => {
  it('triggers gold milestone when threshold reached', () => {
    const [p1, p2] = createPlayers();
    p1.score = 25;
    const game = {
      players: [p1, p2],
      goldScoringTiles: [
        new GoldScoringTile({ id: 'tech', side: 'A' }),
        new GoldScoringTile({ id: 'mission', side: 'A' }),
      ],
      eventLog: { append: () => undefined },
    };

    const state = new MilestoneState([]);
    const input = state.checkAndQueue(game as never, p1);

    expect(input?.type).toBe(EPlayerInputType.GOLD_TILE);
  });

  it('resolves simultaneous players in seat order from current player', () => {
    const [p1, p2] = createPlayers();
    p1.score = 25;
    p2.score = 25;

    const game = {
      players: [p1, p2],
      goldScoringTiles: [new GoldScoringTile({ id: 'tech', side: 'A' })],
      eventLog: { append: () => undefined },
    };

    const state = new MilestoneState([]);
    const firstInput = state.checkAndQueue(game as never, p2);
    firstInput?.process({ type: EPlayerInputType.GOLD_TILE, tileId: 'tech' });

    expect(game.goldScoringTiles[0].claims[0]?.playerId).toBe('p2');
  });

  it('resolves neutral milestones after gold milestones', () => {
    const [p1, p2] = createPlayers();
    p1.score = 30;
    const game = {
      players: [p1, p2],
      goldScoringTiles: [new GoldScoringTile({ id: 'tech', side: 'A' })],
      alienState: AlienState.createFromHiddenAliens([]),
      eventLog: { append: () => undefined },
    };

    const state = new MilestoneState([20]);
    const input = state.checkAndQueue(game as never, p1);
    input?.process({ type: EPlayerInputType.GOLD_TILE, tileId: 'tech' });

    expect(state.getNeutralDiscoveryMarkersUsed()).toBe(1);
  });

  it('does not retrigger same milestone when score passes 100', () => {
    const [p1, p2] = createPlayers();
    p1.score = 125;
    const game = {
      players: [p1, p2],
      goldScoringTiles: [new GoldScoringTile({ id: 'tech', side: 'A' })],
      eventLog: { append: () => undefined },
    };

    const state = new MilestoneState([]);
    const firstInput = state.checkAndQueue(game as never, p1);
    firstInput?.process({ type: EPlayerInputType.GOLD_TILE, tileId: 'tech' });

    const secondInput = state.checkAndQueue(game as never, p1);
    expect(secondInput).toBeUndefined();
  });
});
