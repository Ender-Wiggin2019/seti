import { JamesWebbSpaceTelescope } from '@/engine/cards/base/JamesWebbSpaceTelescopeCard.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('JamesWebbSpaceTelescope', () => {
  it('removes the handled custom token from behavior', () => {
    const card = new JamesWebbSpaceTelescope();

    expect(card.behavior.gainMovement).toBe(1);
    expect(card.behavior.custom).toBeUndefined();
  });

  it('marks one signal in the probe sector and both neighboring sectors', () => {
    const game = buildTestGame();
    const player = getPlayer(game, 'p1');
    const sectorIndexes = [7, 0, 1];
    const space = game.solarSystem?.getSpacesInSector(0)[0];
    if (!space) throw new Error('missing solar system space');

    game.solarSystem?.placeProbe(player.id, space.id);

    const card = new JamesWebbSpaceTelescope();
    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.getMoveStash()).toBe(1);
    for (const sectorIndex of sectorIndexes) {
      expect(game.sectors[sectorIndex].signals).toContainEqual(
        expect.objectContaining({ type: 'player', playerId: player.id }),
      );
    }
  });
});
