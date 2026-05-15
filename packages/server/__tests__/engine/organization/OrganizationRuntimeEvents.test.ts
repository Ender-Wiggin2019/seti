import { ETechId } from '@seti/common/types/tech';
import { LaunchProbeEffect } from '@/engine/effects/probe/LaunchProbeEffect.js';
import { ResearchTechEffect } from '@/engine/effects/tech/ResearchTechEffect.js';
import { EGameRuntimeEvent } from '@/engine/events/GameEventBus.js';
import { Game } from '@/engine/Game.js';
import { skipSetupTucks } from '../../helpers/TestGameBuilder.js';

function createCleanGame() {
  const game = Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
    ],
    { playerCount: 2 },
    'organization-runtime-events-seed',
  );
  skipSetupTucks(game);
  return game;
}

describe('organization runtime events', () => {
  it('emits TECH_ACQUIRED after a technology is actually taken', () => {
    const game = createCleanGame();
    const player = game.players[0];
    const events: unknown[] = [];
    game.eventBus.subscribe(EGameRuntimeEvent.TECH_ACQUIRED, (context) => {
      events.push(context);
    });

    ResearchTechEffect.acquireTech(player, game, ETechId.PROBE_DOUBLE_PROBE);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: EGameRuntimeEvent.TECH_ACQUIRED,
      game,
      player,
      techId: ETechId.PROBE_DOUBLE_PROBE,
    });
  });

  it('emits PROBE_LAUNCHED after a probe is placed in space', () => {
    const game = createCleanGame();
    const player = game.players[0];
    const events: unknown[] = [];
    game.eventBus.subscribe(EGameRuntimeEvent.PROBE_LAUNCHED, (context) => {
      events.push(context);
    });

    const result = LaunchProbeEffect.execute(player, game, {
      ignoreLimit: true,
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: EGameRuntimeEvent.PROBE_LAUNCHED,
      game,
      player,
      probeId: result.probeId,
      spaceId: result.spaceId,
    });
  });
});
