import { EPlanet } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { PerseveranceRoverCard } from '@/engine/cards/base/PerseveranceRoverCard.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import {
  buildTestGame,
  getPlayer,
  placeProbeOnPlanet,
} from '../../../helpers/TestGameBuilder.js';

describe('PerseveranceRoverCard (card 13)', () => {
  it('loads expected metadata without exposing desc custom token', () => {
    const card = new PerseveranceRoverCard();

    expect(card.id).toBe('13');
    expect(card.behavior.custom).toBeUndefined();
    expect(card.behavior.land).toBeUndefined();
  });

  it('lands on Mars without energy cost, does not offer skip, records the event, and queues trace reward', () => {
    const game = buildTestGame({ seed: 'perseverance-rover' });
    const player = getPlayer(game, 'p1');
    placeProbeOnPlanet(game, player.id, EPlanet.MARS);
    player.resources.spend({ energy: player.resources.energy });
    const scoreBefore = player.score;
    const energyBefore = player.resources.energy;
    const card = new PerseveranceRoverCard();

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    const model = input?.toModel() as ISelectOptionInputModel | undefined;

    expect(model?.type).toBe(EPlayerInputType.OPTION);
    expect(model?.options.some((option) => option.id === 'skip-land')).toBe(
      false,
    );

    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'land-mars',
    });

    expect(player.score).toBe(scoreBefore + 10);
    expect(player.resources.energy).toBe(energyBefore);
    expect(
      game.planetaryBoard?.planets.get(EPlanet.MARS)?.landingSlots,
    ).toContainEqual({ playerId: player.id });
    expect(
      game.missionTracker.hasTurnEvent(
        (event) =>
          event.type === EMissionEventType.PROBE_LANDED &&
          event.planet === EPlanet.MARS,
      ),
    ).toBe(true);

    const traceInput = game.deferredActions.drain(game);
    const traceModel = traceInput?.toModel() as
      | ISelectOptionInputModel
      | undefined;

    expect(traceModel?.type).toBe(EPlayerInputType.OPTION);
    expect(traceModel?.options[0]?.id).toContain('alien-');
  });
});
