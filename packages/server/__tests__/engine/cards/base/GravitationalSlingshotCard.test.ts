import { EFreeAction, EPlanet } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { describe, expect, it } from 'vitest';
import {
  ESolarSystemElementType,
  type ISolarSystemSpace,
  type SolarSystem,
} from '@/engine/board/SolarSystem.js';
import { GravitationalSlingshotCard } from '@/engine/cards/base/GravitationalSlingshotCard.js';
import { Game } from '@/engine/Game.js';

const PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createGame() {
  const game = Game.create(PLAYERS, { playerCount: 2 }, 'gravitational-test');
  for (const player of game.players) {
    player.pendingSetupTucks = 0;
    player.waitingFor = undefined;
  }
  return game;
}

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

describe('GravitationalSlingshotCard', () => {
  it('lets the player convert one planet visit publicity into movement', () => {
    const card = new GravitationalSlingshotCard();
    const game = createGame();
    const player = game.activePlayer;
    const solarSystem = requireSolarSystem(game);
    const start = requireSpace(solarSystem, 'ring-1-cell-2');
    setEmpty(start);
    solarSystem.setDynamicPlanetAtSpace(EPlanet.MERCURY, 'ring-1-cell-1', {
      grantVisitPublicity: true,
    });
    solarSystem.placeProbe(player.id, start.id);

    card.play({ player, game });
    game.deferredActions.drain(game);

    const publicityBefore = player.resources.publicity;
    const moveBefore = player.getMoveStash();
    game.processFreeAction(player.id, {
      type: EFreeAction.MOVEMENT,
      path: [start.id, 'ring-1-cell-1'],
    });

    const prompt = player.waitingFor?.toModel() as
      | ISelectOptionInputModel
      | undefined;
    expect(prompt?.type).toBe(EPlayerInputType.OPTION);
    expect(prompt?.options.map((option) => option.id)).toEqual([
      'convert-publicity',
      'keep-publicity',
    ]);

    game.processInput(player.id, {
      type: EPlayerInputType.OPTION,
      optionId: 'convert-publicity',
    });

    expect(card.id).toBe('19');
    expect(card.behavior.custom).toBeUndefined();
    expect(player.resources.publicity).toBe(publicityBefore);
    expect(player.getMoveStash()).toBe(moveBefore);
    expect(player.waitingFor).toBeUndefined();
  });

  it('lets the player keep planet visit publicity without gaining movement', () => {
    const card = new GravitationalSlingshotCard();
    const game = createGame();
    const player = game.activePlayer;
    const solarSystem = requireSolarSystem(game);
    const start = requireSpace(solarSystem, 'ring-1-cell-2');
    setEmpty(start);
    solarSystem.setDynamicPlanetAtSpace(EPlanet.MERCURY, 'ring-1-cell-1', {
      grantVisitPublicity: true,
    });
    solarSystem.placeProbe(player.id, start.id);

    card.play({ player, game });
    game.deferredActions.drain(game);

    const publicityBefore = player.resources.publicity;
    const moveBefore = player.getMoveStash();
    game.processFreeAction(player.id, {
      type: EFreeAction.MOVEMENT,
      path: [start.id, 'ring-1-cell-1'],
    });

    const prompt = player.waitingFor?.toModel() as
      | ISelectOptionInputModel
      | undefined;
    expect(prompt?.type).toBe(EPlayerInputType.OPTION);

    game.processInput(player.id, {
      type: EPlayerInputType.OPTION,
      optionId: 'keep-publicity',
    });

    expect(player.resources.publicity).toBe(publicityBefore + 1);
    expect(player.getMoveStash()).toBe(moveBefore - 1);
    expect(player.waitingFor).toBeUndefined();
  });

  it('does not prompt when movement gains no planet visit publicity', () => {
    const card = new GravitationalSlingshotCard();
    const game = createGame();
    const player = game.activePlayer;
    const solarSystem = requireSolarSystem(game);
    const start = requireSpace(solarSystem, 'ring-1-cell-2');
    const destination = requireSpace(solarSystem, 'ring-1-cell-1');
    setEmpty(start);
    setEmpty(destination);
    solarSystem.placeProbe(player.id, start.id);

    card.play({ player, game });
    game.deferredActions.drain(game);

    const publicityBefore = player.resources.publicity;
    const moveBefore = player.getMoveStash();
    game.processFreeAction(player.id, {
      type: EFreeAction.MOVEMENT,
      path: [start.id, destination.id],
    });

    expect(player.waitingFor).toBeUndefined();
    expect(player.resources.publicity).toBe(publicityBefore);
    expect(player.getMoveStash()).toBe(moveBefore - 1);
  });
});
