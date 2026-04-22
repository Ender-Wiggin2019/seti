import {
  EMainAction,
  EPlanet,
  ETrace,
} from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
  type ISelectTraceInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ETechId } from '@seti/common/types/tech';
import { LandAction } from '@/engine/actions/Land.js';
import { Game } from '@/engine/Game.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import {
  resolveSetupTucks,
  skipSetupTucks,
} from '../../helpers/TestGameBuilder.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function placeProbeOnPlanet(
  game: Game,
  playerId: string,
  planet: EPlanet,
  count: number,
): void {
  const targetSpace = game.solarSystem?.getSpacesOnPlanet(planet)[0];
  if (!targetSpace || game.solarSystem === null) {
    throw new Error('Expected a planet space in solar system');
  }

  for (let index = 0; index < count; index += 1) {
    game.solarSystem.placeProbe(playerId, targetSpace.id);
  }
}

function resolveAllInputs(game: Game, player: IPlayer): void {
  while (player.waitingFor) {
    const model = player.waitingFor.toModel();
    if (model.type === EPlayerInputType.TRACE) {
      const traceModel = model as ISelectTraceInputModel;
      game.processInput(player.id, {
        type: EPlayerInputType.TRACE,
        trace: traceModel.options[0],
      });
    } else if (model.type === EPlayerInputType.OPTION) {
      const optModel = model as ISelectOptionInputModel;
      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: optModel.options[0].id,
      });
    } else {
      break;
    }
  }
}

function expectTraceInput(player: IPlayer): ISelectTraceInputModel {
  if (!player.waitingFor) {
    throw new Error('Expected player to be waiting for trace input');
  }

  const model = player.waitingFor.toModel();
  if (model.type !== EPlayerInputType.TRACE) {
    throw new Error(`Expected trace input, received ${model.type}`);
  }

  return model as ISelectTraceInputModel;
}

function expectOptionInput(player: IPlayer): ISelectOptionInputModel {
  if (!player.waitingFor) {
    throw new Error('Expected player to be waiting for option input');
  }

  const model = player.waitingFor.toModel();
  if (model.type !== EPlayerInputType.OPTION) {
    throw new Error(`Expected option input, received ${model.type}`);
  }

  return model as ISelectOptionInputModel;
}

describe('Land action', () => {
  it('lets the player place a landing life trace onto the selected discovery slot', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-trace-selection',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    placeProbeOnPlanet(game, player.id, EPlanet.VENUS, 1);
    player.probesInSpace = 1;

    game.processMainAction(player.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.VENUS },
    });

    const traceInput = expectTraceInput(player);
    expect(traceInput.options).toContain(ETrace.BLUE);

    game.processInput(player.id, {
      type: EPlayerInputType.TRACE,
      trace: ETrace.BLUE,
    });

    const optionInput = expectOptionInput(player);
    expect(optionInput.options.length).toBeGreaterThan(1);
    const firstOption = optionInput.options[0];
    const targetOption = optionInput.options.at(-1);

    expect(targetOption).toBeDefined();
    expect(targetOption?.id).not.toBe(firstOption?.id);
    const targetOptionId = targetOption?.id;
    if (!targetOptionId) {
      throw new Error('Expected a concrete target option id');
    }

    game.processInput(player.id, {
      type: EPlayerInputType.OPTION,
      optionId: targetOptionId,
    });

    const untouchedSlot = game.alienState.boards
      .flatMap((board) => board.slots)
      .find((slot) => slot.slotId === firstOption?.id);
    const selectedSlot = game.alienState.boards
      .flatMap((board) => board.slots)
      .find((slot) => slot.slotId === targetOptionId);

    expect(untouchedSlot?.occupants).toHaveLength(0);
    expect(selectedSlot?.occupants).toHaveLength(1);
    expect(selectedSlot?.occupants[0]).toMatchObject({
      source: { playerId: player.id },
      traceColor: ETrace.BLUE,
    });
  });

  it('lands on a planet, spends energy, gains center VP and first data bonus', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-main-action',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    placeProbeOnPlanet(game, player.id, EPlanet.MARS, 1);
    player.probesInSpace = 1;

    game.processMainAction(player.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.MARS },
    });

    expect(player.resources.energy).toBe(0);
    expect(player.resources.data).toBe(1);
    expect(player.probesInSpace).toBe(0);
    expect(
      game.planetaryBoard?.planets.get(EPlanet.MARS)?.landingSlots,
    ).toEqual([{ playerId: player.id }]);
    expect(player.score).toBe(5);
  });

  it('uses reduced landing cost when any orbiter is already present', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-reduced-cost',
    );
    skipSetupTucks(game);
    const p1 = game.players[0];
    const p2 = game.players[1];
    placeProbeOnPlanet(game, p1.id, EPlanet.SATURN, 1);
    placeProbeOnPlanet(game, p2.id, EPlanet.SATURN, 1);
    p1.probesInSpace = 1;
    p2.probesInSpace = 1;

    game.processMainAction(p1.id, {
      type: EMainAction.ORBIT,
      payload: { planet: EPlanet.SATURN },
    });
    game.processEndTurn(p1.id);
    game.processMainAction(p2.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.SATURN },
    });

    expect(p2.resources.energy).toBe(1);
  });

  it('gives Mars first-land data only to the first two landers', () => {
    const threePlayerGame = Game.create(
      [
        ...TEST_PLAYERS,
        { id: 'p3', name: 'Cara', color: 'green', seatIndex: 2 },
      ],
      { playerCount: 3 },
      'land-mars-first-two',
    );
    resolveSetupTucks(threePlayerGame);
    const [p1, p2, p3] = threePlayerGame.players;

    placeProbeOnPlanet(threePlayerGame, p1.id, EPlanet.MARS, 1);
    placeProbeOnPlanet(threePlayerGame, p2.id, EPlanet.MARS, 1);
    placeProbeOnPlanet(threePlayerGame, p3.id, EPlanet.MARS, 1);
    p1.probesInSpace = 1;
    p2.probesInSpace = 1;
    p3.probesInSpace = 1;

    threePlayerGame.processMainAction(p1.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.MARS },
    });
    resolveAllInputs(threePlayerGame, p1);
    threePlayerGame.processEndTurn(p1.id);

    threePlayerGame.processMainAction(p2.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.MARS },
    });
    resolveAllInputs(threePlayerGame, p2);
    threePlayerGame.processEndTurn(p2.id);

    threePlayerGame.processMainAction(p3.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.MARS },
    });
    resolveAllInputs(threePlayerGame, p3);
    threePlayerGame.processEndTurn(p3.id);

    expect(p1.resources.data).toBe(1);
    expect(p2.resources.data).toBe(1);
    expect(p3.resources.data).toBe(0);
    expect(
      threePlayerGame.planetaryBoard?.planets.get(EPlanet.MARS)
        ?.firstLandDataBonusTaken,
    ).toEqual([true, true]);
  });

  it('enforces moon unlock and single occupancy through Land action', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-moon-rules',
    );
    resolveSetupTucks(game);
    const p1 = game.players[0];
    const p2 = game.players[1];
    placeProbeOnPlanet(game, p1.id, EPlanet.MARS, 1);
    placeProbeOnPlanet(game, p2.id, EPlanet.MARS, 1);
    p1.probesInSpace = 1;
    p2.probesInSpace = 1;

    expect(() =>
      game.processMainAction(p1.id, {
        type: EMainAction.LAND,
        payload: { planet: EPlanet.MARS, isMoon: true },
      }),
    ).toThrowError(
      expect.objectContaining({
        code: EErrorCode.INVALID_ACTION,
      }),
    );

    game.planetaryBoard?.unlockMoon(EPlanet.MARS);
    game.processMainAction(p1.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.MARS, isMoon: true },
    });
    resolveAllInputs(game, p1);
    game.processEndTurn(p1.id);

    expect(
      game.planetaryBoard?.planets.get(EPlanet.MARS)?.moonOccupant?.playerId,
    ).toBe(p1.id);
    expect(() =>
      game.processMainAction(p2.id, {
        type: EMainAction.LAND,
        payload: { planet: EPlanet.MARS, isMoon: true },
      }),
    ).toThrowError(
      expect.objectContaining({
        code: EErrorCode.INVALID_ACTION,
      }),
    );
  });

  it('applies rover discount tech to reduce landing energy cost by 1', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-probe-tech-2',
    );
    skipSetupTucks(game);
    const player = game.players[0];
    player.gainTech(ETechId.PROBE_ROVER_DISCOUNT);
    placeProbeOnPlanet(game, player.id, EPlanet.MERCURY, 1);
    player.probesInSpace = 1;

    game.processMainAction(player.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.MERCURY },
    });

    expect(player.resources.energy).toBe(1);
  });

  it('applies orbiter and rover discounts together when landing on a moon', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-moon-stacked-discount',
    );
    resolveSetupTucks(game);
    const p1 = game.players[0];
    const p2 = game.players[1];

    p1.gainTech(ETechId.PROBE_ROVER_DISCOUNT);
    p1.gainTech(ETechId.PROBE_MOON);
    placeProbeOnPlanet(game, p1.id, EPlanet.MARS, 1);
    placeProbeOnPlanet(game, p2.id, EPlanet.MARS, 1);
    p1.probesInSpace = 1;
    p2.probesInSpace = 1;

    game.setActivePlayer(p2.id);
    game.processMainAction(p2.id, {
      type: EMainAction.ORBIT,
      payload: { planet: EPlanet.MARS },
    });
    game.processEndTurn(p2.id);
    game.processMainAction(p1.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.MARS, isMoon: true },
    });
    resolveAllInputs(game, p1);

    expect(p1.resources.energy).toBe(2);
    expect(
      game.planetaryBoard?.planets.get(EPlanet.MARS)?.moonOccupant?.playerId,
    ).toBe(p1.id);
  });

  it('allows landing on moon with probe moon tech even when moon is locked', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-probe-tech-3',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    player.gainTech(ETechId.PROBE_MOON);
    placeProbeOnPlanet(game, player.id, EPlanet.MARS, 1);
    player.probesInSpace = 1;

    game.processMainAction(player.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.MARS, isMoon: true },
    });

    expect(
      game.planetaryBoard?.planets.get(EPlanet.MARS)?.moonOccupant?.playerId,
    ).toBe(player.id);
  });

  it('does not let an existing orbiter land later on the same planet', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-orbiter-cannot-land',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    placeProbeOnPlanet(game, player.id, EPlanet.VENUS, 1);
    player.probesInSpace = 1;

    game.processMainAction(player.id, {
      type: EMainAction.ORBIT,
      payload: { planet: EPlanet.VENUS },
    });
    game.processEndTurn(player.id);

    game.setActivePlayer(player.id);

    expect(() =>
      game.processMainAction(player.id, {
        type: EMainAction.LAND,
        payload: { planet: EPlanet.VENUS },
      }),
    ).toThrowError(
      expect.objectContaining({
        code: EErrorCode.INVALID_ACTION,
      }),
    );
  });

  it('returns false when there is no probe on a non-Earth planet to land with', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-no-planet-probe',
    );
    resolveSetupTucks(game);
    const player = game.players[0];

    game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE });
    game.processEndTurn(player.id);
    game.setActivePlayer(player.id);

    expect(LandAction.canExecute(player, EPlanet.MARS)).toBe(false);
    expect(player.canLand(EPlanet.MARS)).toBe(false);
  });

  it('returns false when landing energy is insufficient for the current discount state', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-insufficient-energy',
    );
    resolveSetupTucks(game);
    const p1 = game.players[0];
    const p2 = game.players[1];

    placeProbeOnPlanet(game, p1.id, EPlanet.MARS, 1);
    p1.probesInSpace = 1;
    p1.resources.spend({ energy: 1 });
    expect(p1.resources.energy).toBe(2);
    expect(LandAction.canExecute(p1, EPlanet.MARS)).toBe(false);

    placeProbeOnPlanet(game, p2.id, EPlanet.MARS, 1);
    p2.probesInSpace = 1;
    game.setActivePlayer(p2.id);
    game.processMainAction(p2.id, {
      type: EMainAction.ORBIT,
      payload: { planet: EPlanet.MARS },
    });

    expect(LandAction.canExecute(p1, EPlanet.MARS)).toBe(true);
    p1.resources.spend({ energy: 2 });
    expect(p1.resources.energy).toBe(0);
    expect(LandAction.canExecute(p1, EPlanet.MARS)).toBe(false);
  });
});
