import { EPlanet } from '@seti/common/types/protocol/enums';
import { TwoPlanetFlyby } from '@/engine/cards/spaceAgency/TwoPlanetFlybyCard.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import { emitPlanetVisitedTurnEvent } from '@/engine/turnEffects/TurnEffects.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('TwoPlanetFlyby', () => {
  it('scores 3 VP if two different non-Earth planets were visited this turn', () => {
    const game = buildTestGame({ seed: 'sa-12' });
    const player = getPlayer(game, 'p1');
    game.missionTracker.recordEvent({
      type: EMissionEventType.PROBE_VISITED_PLANET,
      planet: EPlanet.MARS,
    });
    game.missionTracker.recordEvent({
      type: EMissionEventType.PROBE_VISITED_PLANET,
      planet: EPlanet.VENUS,
    });
    const initialScore = player.score;
    const card = new TwoPlanetFlyby();

    card.play({ player, game });
    game.deferredActions.drain(game);
    game.deferredActions.drain(game);

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_12');
    expect(player.score).toBe(initialScore + 3);
  });
});

it('scores after a later same-turn free-action visit completes the second non-Earth planet', () => {
  const game = buildTestGame({ seed: 'sa-12-later-visit' });
  const player = getPlayer(game, 'p1');
  const card = new TwoPlanetFlyby();
  const initialScore = player.score;

  game.missionTracker.recordEvent({
    type: EMissionEventType.PROBE_VISITED_PLANET,
    planet: EPlanet.MARS,
  });
  card.play({ player, game });
  game.deferredActions.drain(game);
  game.deferredActions.drain(game);
  expect(player.score).toBe(initialScore);

  game.missionTracker.recordEvent({
    type: EMissionEventType.PROBE_VISITED_PLANET,
    planet: EPlanet.VENUS,
  });
  // Turn-effect path mirrors MovementFreeAction's planet-visit hook.
  const input = emitPlanetVisitedTurnEvent(game, player, {
    planet: EPlanet.VENUS,
    publicityGained: 0,
  });
  expect(input).toBeUndefined();

  expect(player.score).toBe(initialScore + 3);
});
