import { EPlanet } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { Deck } from '@/engine/deck/Deck.js';
import { Game } from '@/engine/Game.js';
import { resolveSetupTucks } from '../../../helpers/TestGameBuilder.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

describe('WowSignalCard', () => {
  it('is registered as a dedicated card class', () => {
    const card = getCardRegistry().create('83');

    expect(card.constructor.name).toBe('WowSignalCard');
    expect(card.id).toBe('83');
  });

  it('gains publicity and marks two signals in the sector with Earth', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'wow-signal-earth-sector',
    );
    resolveSetupTucks(game);
    game.mainDeck = new Deck<string>([]);
    const player = game.players[0];
    const earthSectorIndex = game.solarSystem?.getSectorIndexOfPlanet(
      EPlanet.EARTH,
    );
    if (earthSectorIndex === null || earthSectorIndex === undefined) {
      throw new Error('Expected Earth sector');
    }
    const earthSector = game.sectors[earthSectorIndex];
    const otherSector =
      game.sectors[(earthSectorIndex + 1) % game.sectors.length];
    const publicityBefore = player.resources.publicity;
    const earthMarkersBefore = earthSector.getPlayerMarkerCount(player.id);
    const otherMarkersBefore = otherSector.getPlayerMarkerCount(player.id);

    const card = getCardRegistry().create('83');
    card.play({ player, game });

    const pendingInput = game.deferredActions.drain(game);

    expect(pendingInput?.toModel().type).not.toBe(EPlayerInputType.OPTION);
    expect(pendingInput).toBeUndefined();
    expect(player.resources.publicity).toBe(publicityBefore + 1);
    expect(earthSector.getPlayerMarkerCount(player.id)).toBe(
      earthMarkersBefore + 2,
    );
    expect(otherSector.getPlayerMarkerCount(player.id)).toBe(
      otherMarkersBefore,
    );
  });
});
