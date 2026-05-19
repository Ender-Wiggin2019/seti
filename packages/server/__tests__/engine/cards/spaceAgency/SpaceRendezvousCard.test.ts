import { EPlanet } from '@seti/common/types/protocol/enums';
import { SpaceRendezvous } from '@/engine/cards/spaceAgency/SpaceRendezvousCard.js';
import { emitMovementStepTurnEvent } from '@/engine/turnEffects/TurnEffects.js';
import {
  buildTestGame,
  getPlayer,
  placeProbeOnPlanet,
} from '../../../helpers/TestGameBuilder.js';

describe('SpaceRendezvous', () => {
  it('scores 3 VP if one own probe shares a space with another probe', () => {
    const game = buildTestGame({ seed: 'sa-38' });
    const player = getPlayer(game, 'p1');
    const other = getPlayer(game, 'p2');
    placeProbeOnPlanet(game, player.id, EPlanet.MARS);
    const space = game.solarSystem?.getSpacesOnPlanet(EPlanet.MARS)[0];
    if (!space) throw new Error('missing Mars');
    game.solarSystem?.placeProbe(other.id, space.id);
    const initialScore = player.score;
    const card = new SpaceRendezvous();

    card.play({ player, game });
    game.deferredActions.drain(game);
    game.deferredActions.drain(game);

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_38');
    expect(player.score).toBe(initialScore + 3);
  });

  it('scores after card-granted movement creates a shared probe space later in the turn', () => {
    const game = buildTestGame({ seed: 'sa-38-later-rendezvous' });
    const player = getPlayer(game, 'p1');
    const other = getPlayer(game, 'p2');
    const solarSystem = game.solarSystem;
    if (!solarSystem) throw new Error('missing solar system');
    const earth = solarSystem.getPlanetLocation(EPlanet.EARTH)?.space;
    if (!earth) throw new Error('missing Earth');
    const adjacent = solarSystem.getAdjacentSpaces(earth.id)[0];
    if (!adjacent) throw new Error('missing Earth-adjacent space');
    const ownProbe = solarSystem.placeProbe(player.id, earth.id);
    solarSystem.placeProbe(other.id, adjacent.id);
    const initialScore = player.score;
    const card = new SpaceRendezvous();

    card.play({ player, game });
    game.deferredActions.drain(game);
    game.deferredActions.drain(game);
    expect(player.score).toBe(initialScore);

    const move = solarSystem.moveProbe(ownProbe.id, earth.id, adjacent.id);
    emitMovementStepTurnEvent(game, player, {
      fromSpace: earth,
      toSpace: adjacent,
      publicityGained: move.publicityGained,
    });

    expect(player.score).toBe(initialScore + 3);
  });
});
