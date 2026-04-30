import { EPlanet } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { GreatObservatoriesProjectCard } from '@/engine/cards/base/GreatObservatoriesProjectCard.js';
import {
  buildTestGame,
  getPlayer,
  placeProbeOnPlanet,
  requireSolarSystem,
} from '../../../helpers/TestGameBuilder.js';

describe('GreatObservatoriesProjectCard (card 30)', () => {
  it('loads expected metadata without exposing desc custom token', () => {
    const card = new GreatObservatoriesProjectCard();

    expect(card.id).toBe('30');
    expect(card.behavior.custom).toBeUndefined();
    expect(card.behavior.markAnySignal).toBeUndefined();
  });

  it('marks a signal in the sector of a selected probe owned by any player', () => {
    const game = buildTestGame({ seed: 'great-observatories' });
    const player = getPlayer(game, 'p1');
    const other = getPlayer(game, 'p2');
    placeProbeOnPlanet(game, other.id, EPlanet.MARS);
    const solarSystem = requireSolarSystem(game);
    const marsSectorIndex = solarSystem.getSectorIndexOfPlanet(EPlanet.MARS);
    if (marsSectorIndex === null) throw new Error('missing Mars sector');
    const sector = game.sectors[marsSectorIndex];
    const card = new GreatObservatoriesProjectCard();

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    const model = input?.toModel();
    if (model?.type !== EPlayerInputType.OPTION) {
      throw new Error('missing probe option input');
    }
    const optionId = (model as ISelectOptionInputModel).options.find((option) =>
      option.label.includes(other.id),
    )?.id;
    if (!optionId) throw new Error('missing probe option');
    const next = input?.process({ type: EPlayerInputType.OPTION, optionId });
    next?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'finish-probe-signals',
    });

    expect(
      sector.signals.filter(
        (signal) => signal.type === 'player' && signal.playerId === player.id,
      ),
    ).toHaveLength(1);
  });
});
