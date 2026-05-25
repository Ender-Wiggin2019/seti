import { ETrace } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import { LandProbeEffect } from '@/engine/effects/probe/LandProbeEffect.js';
import { Game } from '@/engine/Game.js';
import { resolveSetupTucks } from '../../../helpers/TestGameBuilder.js';

describe('LandProbeEffect', () => {
  it('cannot execute on earth', () => {
    const can = LandProbeEffect.canExecute(
      {} as never,
      {
        solarSystem: {},
        planetaryBoard: {},
      } as never,
      EPlanet.EARTH,
    );

    expect(can).toBe(false);
  });

  it('returns trace rewards without the legacy lifeTraceGained scalar', () => {
    const game = Game.create(
      [
        { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
        { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
      ],
      { playerCount: 2 },
      'land-probe-effect',
      'land-probe-effect',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    const mercurySpace = game.solarSystem?.getSpacesOnPlanet(
      EPlanet.MERCURY,
    )[0];
    if (!mercurySpace || !game.solarSystem) {
      throw new Error('expected Mercury space');
    }
    game.solarSystem.placeProbe(player.id, mercurySpace.id);

    const result = LandProbeEffect.execute(player, game, EPlanet.MERCURY);

    expect(result.traceRewards).toEqual([{ trace: ETrace.YELLOW, amount: 1 }]);
    expect('lifeTraceGained' in result).toBe(false);
  });
});
