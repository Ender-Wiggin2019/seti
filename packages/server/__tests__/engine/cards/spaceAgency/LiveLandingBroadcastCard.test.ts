import { EPlanet } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { LiveLandingBroadcast } from '@/engine/cards/spaceAgency/LiveLandingBroadcastCard.js';
import {
  buildTestGame,
  getPlayer,
  placeProbeOnPlanet,
} from '../../../helpers/TestGameBuilder.js';

function countSignals(
  game: ReturnType<typeof buildTestGame>,
  playerId: string,
) {
  return game.sectors.reduce(
    (total, sector) =>
      total +
      sector.signals.filter(
        (signal) => signal.type === 'player' && signal.playerId === playerId,
      ).length,
    0,
  );
}

describe('LiveLandingBroadcast', () => {
  it('marks a signal in the sector where the card land action placed a lander', () => {
    const game = buildTestGame({ seed: 'sa-6' });
    const player = getPlayer(game, 'p1');
    placeProbeOnPlanet(game, player.id, EPlanet.MARS);
    const beforeSignals = countSignals(game, player.id);
    const beforeMove = player.getMoveStash();
    const card = new LiveLandingBroadcast();

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    const model = input?.toModel() as ISelectOptionInputModel | undefined;

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_6');
    expect(model?.type).toBe(EPlayerInputType.OPTION);
    expect(player.getMoveStash()).toBe(beforeMove + 1);

    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'land-mars',
    });
    game.deferredActions.drain(game);

    expect(countSignals(game, player.id)).toBe(beforeSignals + 1);
  });
});
