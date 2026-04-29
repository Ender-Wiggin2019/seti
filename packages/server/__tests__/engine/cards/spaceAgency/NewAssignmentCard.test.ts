import { EPlanet } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { NewAssignment } from '@/engine/cards/spaceAgency/NewAssignmentCard.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('NewAssignment', () => {
  it('removes a selected orbiter and places a probe on that planet ignoring probe limit', () => {
    const game = buildTestGame({ seed: 'sa-19' });
    const player = getPlayer(game, 'p1');
    const planetState = game.planetaryBoard?.planets.get(EPlanet.MARS);
    const marsSpace = game.solarSystem?.getPlanetLocation(EPlanet.MARS)?.space;
    if (!planetState || !marsSpace) throw new Error('missing Mars setup');
    planetState.orbitSlots.push({ playerId: player.id });
    planetState.firstOrbitClaimed = true;
    player.probesInSpace = player.probeSpaceLimit;
    const card = new NewAssignment();

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    const model = input?.toModel() as ISelectOptionInputModel | undefined;
    const marsOption = model?.options.find((option) =>
      String(option.id).includes(EPlanet.MARS),
    );

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_19');
    expect(model?.type).toBe(EPlayerInputType.OPTION);
    expect(marsOption).toBeDefined();

    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: String(marsOption?.id),
    });

    expect(planetState.orbitSlots).toHaveLength(0);
    expect(planetState.firstOrbitClaimed).toBe(false);
    expect(
      marsSpace.occupants.some((probe) => probe.playerId === player.id),
    ).toBe(true);
    expect(player.probesInSpace).toBe(player.probeSpaceLimit + 1);
  });
});
