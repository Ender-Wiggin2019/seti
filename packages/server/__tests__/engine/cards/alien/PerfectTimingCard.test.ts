import { EPlanet } from '@seti/common/types/protocol/enums';
import { PerfectTiming } from '@/engine/cards/alien/PerfectTimingCard.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import { discoverOumuamua } from '../../../helpers/OumuamuaTestUtils.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

function playAndDrain(card: PerfectTiming, seed: string, visited: boolean) {
  const game = buildTestGame({ seed });
  const player = getPlayer(game, 'p1');
  discoverOumuamua(game);
  if (visited) {
    game.missionTracker.recordEvent({
      type: EMissionEventType.PROBE_VISITED_PLANET,
      planet: EPlanet.OUMUAMUA,
    });
  }
  const exofossilsBefore = player.exofossils;

  card.play({ player, game });
  game.deferredActions.drain(game);

  return player.exofossils - exofossilsBefore;
}

describe('PerfectTiming', () => {
  it('gains 1 exofossil if a probe visited Oumuamua this turn', () => {
    const card = new PerfectTiming();

    const withoutVisit = playAndDrain(card, 'et-27-no-visit', false);
    const withVisit = playAndDrain(card, 'et-27-with-visit', true);

    expect(card.id).toBe('ET.27');
    expect(card.behavior.custom ?? []).not.toContain('desc.et-27');
    expect(withVisit - withoutVisit).toBe(1);
  });
});
