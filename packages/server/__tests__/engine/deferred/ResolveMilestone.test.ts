import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { ResolveMilestone } from '@/engine/deferred/ResolveMilestone.js';
import { Player } from '@/engine/player/Player.js';
import { GoldScoringTile } from '@/engine/scoring/GoldScoringTile.js';
import { MilestoneState } from '@/engine/scoring/Milestone.js';

describe('ResolveMilestone', () => {
  it('returns SelectGoldTile input when milestone is reached', () => {
    const player = new Player({
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
      score: 25,
    });

    const game = {
      players: [player],
      milestoneState: new MilestoneState([]),
      goldScoringTiles: [new GoldScoringTile({ id: 'tech', side: 'A' })],
      eventLog: { append: () => undefined },
    } as never;

    const action = new ResolveMilestone(player);
    const input = action.execute(game);

    expect(input?.type).toBe(EPlayerInputType.GOLD_TILE);
  });
});
