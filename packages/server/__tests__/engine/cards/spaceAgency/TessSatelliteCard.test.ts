import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { TessSatellite } from '@/engine/cards/spaceAgency/TessSatelliteCard.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

function countPlayerSignals(
  sector: ReturnType<typeof buildTestGame>['sectors'][number],
  playerId: string,
): number {
  return sector.signals.filter(
    (signal) => signal.type === 'player' && signal.playerId === playerId,
  ).length;
}

describe('TessSatellite', () => {
  it('marks two no-data signals in one sector where the player already has three signals', () => {
    const game = buildTestGame({ seed: 'sa-22' });
    const player = getPlayer(game, 'p1');
    const [firstSector, secondSector] = game.sectors;
    if (!firstSector || !secondSector) throw new Error('missing sectors');
    for (let index = 0; index < 3; index += 1) {
      firstSector.markSignal(player.id);
      secondSector.markSignal(player.id);
    }
    const beforeData = player.resources.data;
    const secondBefore = countPlayerSignals(secondSector, player.id);
    const card = new TessSatellite();

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    const model = input?.toModel() as ISelectOptionInputModel | undefined;

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_22');
    expect(card.behavior.markAnySignal).toBeUndefined();
    expect(model?.type).toBe(EPlayerInputType.OPTION);

    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: firstSector.id,
    });

    expect(countPlayerSignals(firstSector, player.id)).toBe(5);
    expect(countPlayerSignals(secondSector, player.id)).toBe(secondBefore);
    expect(player.resources.data).toBe(beforeData);
  });
});
