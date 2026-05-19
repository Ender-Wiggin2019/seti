import { ETrace } from '@seti/common/types/element';
import { CardRegistry } from '@/engine/cards/CardRegistry.js';
import { registerSpaceAgencyAliens } from '@/engine/cards/register/registerSpaceAgencyAliens.js';
import { applyMissionRewards } from '@/engine/missions/MissionReward.js';
import {
  createDiscoveredAmoebaGame,
  markAmoebaTrace,
} from './SpaceAgencyAlienCardTestUtils.js';

function createCard() {
  const registry = new CardRegistry();
  registerSpaceAgencyAliens(registry);
  return registry.create('SA.ET.14');
}

describe('SA.ET.14 Breakthrough Theory', () => {
  it('has a dedicated mission implementation', () => {
    expect(createCard().constructor.name).toBe('SaEt14BreakthroughTheoryCard');
  });

  it('requires red, yellow, and blue Amoeba traces outside discovery spaces, counting overflow', () => {
    const { game, board } = createDiscoveredAmoebaGame('sa-et-14-condition');
    const [player] = game.players;
    const card = createCard();
    const branch = card.getMissionDef?.()?.branches[0];
    if (!branch?.checkCondition) {
      throw new Error('expected SA.ET.14 quick mission condition');
    }

    const discoveryRed = board.discoverySlots.find(
      (slot) => slot.traceColor === ETrace.PINK,
    );
    if (!discoveryRed) {
      throw new Error('expected red discovery slot');
    }
    board.placeTrace(discoveryRed, { playerId: player.id }, ETrace.PINK);
    markAmoebaTrace(board, player.id, ETrace.YELLOW);
    markAmoebaTrace(board, player.id, ETrace.BLUE, { overflow: true });

    expect(branch.checkCondition(player, game)).toBe(false);

    markAmoebaTrace(board, player.id, ETrace.PINK);

    expect(branch.checkCondition(player, game)).toBe(true);
  });

  it('scores 1 VP per empty Amoeba board space when completed', () => {
    const { game, board } = createDiscoveredAmoebaGame('sa-et-14-reward');
    const [player] = game.players;
    const card = createCard();
    const branch = card.getMissionDef?.()?.branches[0];
    if (!branch) {
      throw new Error('expected SA.ET.14 quick mission branch');
    }
    markAmoebaTrace(board, player.id, ETrace.PINK);
    markAmoebaTrace(board, player.id, ETrace.YELLOW);
    const scoreBefore = player.score;

    const input = applyMissionRewards(branch.rewards, player, game);

    expect(input).toBeUndefined();
    expect(player.score - scoreBefore).toBe(7);
  });
});
