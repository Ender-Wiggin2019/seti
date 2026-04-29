import { KeplerSpaceTelescope } from '@/engine/cards/base/KeplerSpaceTelescopeCard.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('KeplerSpaceTelescope', () => {
  it('removes the handled custom token from behavior', () => {
    const card = new KeplerSpaceTelescope();

    expect(card.behavior.gainMovement).toBe(1);
    expect(card.behavior.custom).toBeUndefined();
  });

  it('marks two signals in a sector with one of your probes', () => {
    const game = buildTestGame();
    const player = getPlayer(game, 'p1');
    const sector = game.sectors[0];
    const space = game.solarSystem?.getSpacesInSector(0)[0];
    if (!space) throw new Error('missing solar system space');

    game.solarSystem?.placeProbe(player.id, space.id);

    const card = new KeplerSpaceTelescope();
    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.getMoveStash()).toBe(1);
    expect(
      sector.signals.filter(
        (signal) => signal.type === 'player' && signal.playerId === player.id,
      ),
    ).toHaveLength(2);
  });
});
