import { describe, expect, it } from 'vitest';
import {
  ESolarSystemElementType,
  type ISolarSystemSpace,
  type SolarSystem,
} from '@/engine/board/SolarSystem.js';
import { TrajectoryCorrectionCard } from '@/engine/cards/base/TrajectoryCorrectionCard.js';
import { MovementFreeAction } from '@/engine/freeActions/Movement.js';
import { Game } from '@/engine/Game.js';

const PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function setEmpty(space: ISolarSystemSpace): void {
  space.elements = [{ type: ESolarSystemElementType.EMPTY, amount: 1 }];
  space.hasPublicityIcon = false;
}

function requireSolarSystem(game: Game): SolarSystem {
  if (!game.solarSystem) {
    throw new Error('Expected solar system');
  }
  return game.solarSystem;
}

function requireSpace(
  solarSystem: SolarSystem,
  spaceId: string,
): ISolarSystemSpace {
  const space = solarSystem.spaces.find(
    (candidate) => candidate.id === spaceId,
  );
  if (!space) {
    throw new Error(`Expected space ${spaceId}`);
  }
  return space;
}

describe('TrajectoryCorrectionCard', () => {
  it('rewards the first future movement within the same ring', () => {
    const game = Game.create(PLAYERS, { playerCount: 2 }, 'trajectory-test');
    const player = game.activePlayer;
    const card = new TrajectoryCorrectionCard();
    const solarSystem = requireSolarSystem(game);
    const start = requireSpace(solarSystem, 'ring-1-cell-1');
    const target = requireSpace(solarSystem, 'ring-1-cell-2');
    setEmpty(start);
    setEmpty(target);
    solarSystem.placeProbe(player.id, start.id);
    player.gainMove(2);
    const scoreBefore = player.score;
    const publicityBefore = player.resources.publicity;

    card.play({ player, game });
    game.deferredActions.drain(game);
    MovementFreeAction.execute(player, game, [start.id, target.id]);
    MovementFreeAction.execute(player, game, [target.id, start.id]);

    expect(card.id).toBe('125');
    expect(card.behavior.custom).toBeUndefined();
    expect(player.score).toBe(scoreBefore + 3);
    expect(player.resources.publicity).toBe(publicityBefore + 1);
  });
});
