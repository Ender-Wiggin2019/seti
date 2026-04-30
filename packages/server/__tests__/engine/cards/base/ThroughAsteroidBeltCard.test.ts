import { describe, expect, it } from 'vitest';
import {
  ESolarSystemElementType,
  type ISolarSystemSpace,
  type SolarSystem,
} from '@/engine/board/SolarSystem.js';
import { ThroughAsteroidBeltCard } from '@/engine/cards/base/ThroughAsteroidBeltCard.js';
import { MovementFreeAction } from '@/engine/freeActions/Movement.js';
import { Game } from '@/engine/Game.js';

const PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function setSpace(
  space: ISolarSystemSpace,
  type: ESolarSystemElementType,
): void {
  space.elements = [{ type, amount: 1 }];
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

describe('ThroughAsteroidBeltCard', () => {
  it('ignores the asteroid leave surcharge for the current player this turn', () => {
    const game = Game.create(PLAYERS, { playerCount: 2 }, 'asteroid-belt-test');
    const player = game.activePlayer;
    const card = new ThroughAsteroidBeltCard();
    const solarSystem = requireSolarSystem(game);
    const asteroid = requireSpace(solarSystem, 'ring-1-cell-1');
    const target = requireSpace(solarSystem, 'ring-1-cell-2');
    setSpace(asteroid, ESolarSystemElementType.ASTEROID);
    setSpace(target, ESolarSystemElementType.EMPTY);
    solarSystem.placeProbe(player.id, asteroid.id);
    player.gainMove(2);

    card.play({ player, game });
    game.deferredActions.drain(game);
    const moveBefore = player.getMoveStash();
    const result = MovementFreeAction.execute(player, game, [
      asteroid.id,
      target.id,
    ]);

    expect(card.id).toBe('26');
    expect(card.behavior.custom).toBeUndefined();
    expect(result.totalCost).toBe(1);
    expect(player.getMoveStash()).toBe(moveBefore - 1);
  });
});
