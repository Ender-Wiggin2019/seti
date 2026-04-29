import { EPlanet } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { EuropaClipperCard } from '@/engine/cards/base/EuropaClipperCard.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';
import {
  buildTestGame,
  getPlayer,
  placeProbeOnPlanet,
} from '../../../helpers/TestGameBuilder.js';

describe('EuropaClipperCard (card 12)', () => {
  it('loads expected metadata without exposing desc custom token', () => {
    const card = new EuropaClipperCard();

    expect(card.id).toBe('12');
    expect(card.kind).toBe(EServerCardKind.END_GAME);
    expect(card.behavior.custom).toBeUndefined();
    expect(card.behavior.land).toBeUndefined();
  });

  it('can land on a moon even without the moon-landing tech', () => {
    const game = buildTestGame({ seed: 'europa-clipper' });
    const player = getPlayer(game, 'p1');
    placeProbeOnPlanet(game, player.id, EPlanet.JUPITER);
    player.resources.gain({ energy: 10 });
    const card = new EuropaClipperCard();

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'land-jupiter-moon',
    });

    expect(
      game.planetaryBoard?.planets.get(EPlanet.JUPITER)?.moonOccupant,
    ).toEqual({ playerId: player.id });
  });
});
