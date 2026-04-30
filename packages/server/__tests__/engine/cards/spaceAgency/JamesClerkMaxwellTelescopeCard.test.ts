import { JamesClerkMaxwellTelescope } from '@/engine/cards/spaceAgency/JamesClerkMaxwellTelescopeCard.js';
import { SCAN_ACTION_POOL_TITLE } from '@/engine/effects/scan/ScanActionPool.js';
import {
  buildTestGame,
  getPlayer,
  resolveAllInputsDefault,
} from '../../../helpers/TestGameBuilder.js';

describe('JamesClerkMaxwellTelescope', () => {
  it('grants the signal token only after its scan resolves', () => {
    const game = buildTestGame({ seed: 'sa-13' });
    const player = getPlayer(game, 'p1');
    if (player.resources.signalTokens > 0) {
      player.resources.spend({ signalTokens: player.resources.signalTokens });
    }
    const card = new JamesClerkMaxwellTelescope();

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_13');
    expect(card.behavior.gainResources?.signalTokens ?? 0).toBe(0);

    card.play({ player, game });
    const scanInput = game.deferredActions.drain(game);
    if (!scanInput) {
      throw new Error('Expected James Clerk Maxwell Telescope to start a scan');
    }

    expect(scanInput.title).toBe(SCAN_ACTION_POOL_TITLE);
    expect(player.resources.signalTokens).toBe(0);

    player.waitingFor = scanInput;
    resolveAllInputsDefault(game, player);

    expect(player.waitingFor).toBeUndefined();
    expect(player.resources.signalTokens).toBe(1);
  });
});
