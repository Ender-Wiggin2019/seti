import { JamesClerkMaxwellTelescope } from '@/engine/cards/spaceAgency/JamesClerkMaxwellTelescopeCard.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('JamesClerkMaxwellTelescope', () => {
  it('migrates the legacy DESC into one extra any-signal mark', () => {
    const game = buildTestGame({ seed: 'sa-13' });
    const player = getPlayer(game, 'p1');
    const card = new JamesClerkMaxwellTelescope();

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_13');
    expect(card.behavior.markAnySignal).toBe(1);

    card.play({ player, game });
    expect(game.deferredActions.drain(game)).toBeDefined();
  });
});
