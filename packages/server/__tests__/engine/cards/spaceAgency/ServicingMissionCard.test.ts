import { EMainAction, EPlanet } from '@seti/common/types/protocol/enums';
import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { emitMovementStepTurnEvent } from '@/engine/turnEffects/TurnEffects.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('ServicingMission', () => {
  it('returns itself to hand after card-granted movement leaves a probe adjacent to Earth', () => {
    const game = buildTestGame({ seed: 'sa-5-completion' });
    const player = getPlayer(game, 'p1');
    const solarSystem = game.solarSystem;
    if (!solarSystem) throw new Error('missing solar system');
    const earth = solarSystem.getPlanetLocation(EPlanet.EARTH)?.space;
    if (!earth) throw new Error('missing Earth');
    const adjacent = solarSystem.getAdjacentSpaces(earth.id)[0];
    if (!adjacent) throw new Error('missing Earth-adjacent space');
    const probe = solarSystem.placeProbe(player.id, earth.id);
    player.hand = ['SA.5'];
    player.resources.gain({ credits: 10 });

    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });
    const move = solarSystem.moveProbe(probe.id, earth.id, adjacent.id);
    emitMovementStepTurnEvent(game, player, {
      fromSpace: earth,
      toSpace: adjacent,
      publicityGained: move.publicityGained,
    });
    const card = getCardRegistry().create('SA.5');

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_5');
    expect(player.hand).toContain('SA.5');
    expect(game.mainDeck.getDiscardPile()).not.toContain('SA.5');
  });
});
