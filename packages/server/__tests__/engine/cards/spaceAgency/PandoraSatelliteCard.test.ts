import { PandoraSatellite } from '@/engine/cards/spaceAgency/PandoraSatelliteCard.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

function countPlayerSignals(
  sector: ReturnType<typeof buildTestGame>['sectors'][number],
  playerId: string,
): number {
  return sector.signals.filter(
    (signal) => signal.type === 'player' && signal.playerId === playerId,
  ).length;
}

describe('PandoraSatellite', () => {
  it('marks one no-data signal in each sector where the player already has a signal', () => {
    const game = buildTestGame({ seed: 'sa-37' });
    const player = getPlayer(game, 'p1');
    const [firstSector, secondSector, untouchedSector] = game.sectors;
    if (!firstSector || !secondSector || !untouchedSector) {
      throw new Error('missing sectors');
    }
    firstSector.markSignal(player.id);
    secondSector.markSignal(player.id);
    const beforeData = player.resources.data;
    const untouchedBefore = countPlayerSignals(untouchedSector, player.id);
    const card = new PandoraSatellite();

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_37');
    expect(card.behavior.markAnySignal).toBeUndefined();
    expect(countPlayerSignals(firstSector, player.id)).toBe(2);
    expect(countPlayerSignals(secondSector, player.id)).toBe(2);
    expect(countPlayerSignals(untouchedSector, player.id)).toBe(
      untouchedBefore,
    );
    expect(player.resources.data).toBe(beforeData);
  });
});
