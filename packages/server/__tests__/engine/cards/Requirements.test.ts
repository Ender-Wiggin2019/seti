import { ESector } from '@seti/common/types/element';
import { ETechId } from '@seti/common/types/tech';
import { Requirements } from '@/engine/cards/Requirements.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

function createPlayer(overrides: Record<string, unknown> = {}): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { credits: 4, energy: 3, publicity: 4 },
    techs: [],
    ...overrides,
  });
}

function createGame(): IGame {
  return {
    sectors: [{ id: 's1', color: ESector.RED }],
  } as unknown as IGame;
}

describe('Requirements', () => {
  it('checks resource requirements', () => {
    const game = createGame();
    const richPlayer = createPlayer({ resources: { credits: 5, energy: 0 } });
    const poorPlayer = createPlayer({ resources: { credits: 1, energy: 0 } });

    expect(
      Requirements.checkRequirements(richPlayer, game, {
        resources: { credits: 3 },
      }),
    ).toBe(true);
    expect(
      Requirements.checkRequirements(poorPlayer, game, {
        resources: { credits: 3 },
      }),
    ).toBe(false);
  });

  it('checks tech requirements', () => {
    const game = createGame();
    const player = createPlayer({ techs: [ETechId.PROBE_ASTEROID] });

    expect(
      Requirements.checkRequirements(player, game, {
        requiredTechIds: [ETechId.PROBE_ASTEROID],
      }),
    ).toBe(true);
    expect(
      Requirements.checkRequirements(player, game, {
        requiredTechIds: [ETechId.SCAN_POP_SIGNAL],
      }),
    ).toBe(false);
  });

  it('checks board-state requirements by sector color', () => {
    const game = createGame();
    const player = createPlayer();

    expect(
      Requirements.checkRequirements(player, game, {
        requiredSectorColors: [ESector.RED],
      }),
    ).toBe(true);
    expect(
      Requirements.checkRequirements(player, game, {
        requiredSectorColors: [ESector.BLUE],
      }),
    ).toBe(false);
  });
});
