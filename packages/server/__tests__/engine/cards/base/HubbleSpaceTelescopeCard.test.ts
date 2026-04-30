import { HubbleSpaceTelescope } from '@/engine/cards/base/HubbleSpaceTelescopeCard.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('HubbleSpaceTelescope', () => {
  it('removes the handled custom token from behavior', () => {
    const card = new HubbleSpaceTelescope();

    expect(card.behavior.gainMovement).toBe(1);
    expect(card.behavior.custom).toBeUndefined();
  });

  it('marks one signal in a sector with one of your probes', () => {
    const game = buildTestGame();
    const player = getPlayer(game, 'p1');
    const sector = game.sectors[0];
    const space = game.solarSystem?.getSpacesInSector(0)[0];
    if (!space) throw new Error('missing solar system space');

    game.solarSystem?.placeProbe(player.id, space.id);

    const card = new HubbleSpaceTelescope();
    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.getMoveStash()).toBe(1);
    expect(sector.signals).toContainEqual(
      expect.objectContaining({ type: 'player', playerId: player.id }),
    );
  });
});
