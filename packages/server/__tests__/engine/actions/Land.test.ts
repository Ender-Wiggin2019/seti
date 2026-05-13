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
  resolveAllInputsDefault,
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
  it('lets the player place a landing yellow trace onto the selected discovery slot', () => {
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
      traceColor: ETrace.YELLOW,
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
    expect(player.resources.data).toBe(2);
    expect(player.probesInSpace).toBe(0);
    expect(
      game.planetaryBoard?.planets.get(EPlanet.MARS)?.landingSlots,
    ).toEqual([{ playerId: player.id }]);
    expect(player.score).toBe(7);
  });

  it('allows the same player to land multiple probes on the same planet', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-same-player-duplicate-planet',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    placeProbeOnPlanet(game, player.id, EPlanet.MARS, 2);
    player.probesInSpace = 2;

    LandAction.execute(player, EPlanet.MARS);
    player.resources.gain({ energy: 3 });

    expect(player.canLand(EPlanet.MARS)).toBe(true);
    LandAction.execute(player, EPlanet.MARS);

    expect(
      game.planetaryBoard?.planets.get(EPlanet.MARS)?.landingSlots,
    ).toEqual([{ playerId: player.id }, { playerId: player.id }]);
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
    resolveAllInputsDefault(game, p1);
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

    expect(p1.resources.data).toBe(2);
    expect(p2.resources.data).toBe(1);
    expect(p3.resources.data).toBe(0);
    expect(
      threePlayerGame.planetaryBoard?.planets.get(EPlanet.MARS)
        ?.firstLandDataBonusTaken,
    ).toEqual([true, true]);
  });

  it('requires moon tech and still enforces single occupancy through Land action', () => {
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

    p1.gainTech(ETechId.PROBE_MOON);
    game.processMainAction(p1.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.MARS, isMoon: true },
    });
    resolveAllInputsDefault(game, p1);
    game.processEndTurn(p1.id);

    expect(
      game.planetaryBoard?.planets.get(EPlanet.MARS)?.moonOccupants,
    ).toEqual([{ playerId: p1.id, moonId: 'mars-phobos-deimos' }]);
    p2.gainTech(ETechId.PROBE_MOON);
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

  it('applies immediate moon rewards through the Land action', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-jupiter-moon-reward',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    player.gainTech(ETechId.PROBE_MOON);
    placeProbeOnPlanet(game, player.id, EPlanet.JUPITER, 1);
    player.probesInSpace = 1;

    game.processMainAction(player.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.JUPITER, isMoon: true },
    });

    expect(player.score).toBe(13);
    expect(player.resources.publicity).toBe(9);
    expect(player.resources.data).toBe(0);
    expect(player.waitingFor).toBeUndefined();
    expect(
      game.planetaryBoard?.planets.get(EPlanet.JUPITER)
        ?.firstLandDataBonusTaken,
    ).toEqual([false]);
    expect(
      game.planetaryBoard?.planets.get(EPlanet.JUPITER)?.moonOccupants,
    ).toEqual([{ playerId: player.id, moonId: 'jupiter-ganymede' }]);
  });

  it('applies the clicked moon slot reward through the Land action', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-jupiter-specific-moon-reward',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    player.gainTech(ETechId.PROBE_MOON);
    placeProbeOnPlanet(game, player.id, EPlanet.JUPITER, 1);
    player.probesInSpace = 1;

    game.processMainAction(player.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.JUPITER, isMoon: true, moonId: 'jupiter-io' },
    });

    expect(player.score).toBe(14);
    expect(player.resources.data).toBe(4);
    expect(player.resources.publicity).toBe(4);
    expect(
      game.planetaryBoard?.planets.get(EPlanet.JUPITER)?.moonOccupants,
    ).toEqual([{ playerId: player.id, moonId: 'jupiter-io' }]);
  });

  it('rejects legacy moon index payloads instead of silently choosing another moon', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-jupiter-legacy-moon-index-rejected',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    player.gainTech(ETechId.PROBE_MOON);
    placeProbeOnPlanet(game, player.id, EPlanet.JUPITER, 1);
    player.probesInSpace = 1;

    expect(() =>
      game.processMainAction(player.id, {
        type: EMainAction.LAND,
        payload: { planet: EPlanet.JUPITER, isMoon: true, moonIndex: 3 },
      }),
    ).toThrow('payload.moonIndex is not supported');
    expect(
      game.planetaryBoard?.planets.get(EPlanet.JUPITER)?.moonOccupants,
    ).toEqual([]);
  });

  it('rejects moonId payloads on non-moon landings before mutating board state', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-non-moon-moon-id',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    placeProbeOnPlanet(game, player.id, EPlanet.JUPITER, 1);
    player.probesInSpace = 1;

    expect(() =>
      game.processMainAction(player.id, {
        type: EMainAction.LAND,
        payload: {
          planet: EPlanet.JUPITER,
          isMoon: false,
          moonId: 'jupiter-io',
        },
      }),
    ).toThrow('Action payload.moonId requires isMoon true');
    expect(
      game.planetaryBoard?.planets.get(EPlanet.JUPITER)?.landingSlots,
    ).toEqual([]);
  });

  it('chains colored signal moon rewards through the Land action', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-saturn-moon-signal-reward',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    player.gainTech(ETechId.PROBE_MOON);
    placeProbeOnPlanet(game, player.id, EPlanet.SATURN, 1);
    player.probesInSpace = 1;

    game.processMainAction(player.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.SATURN, isMoon: true },
    });

    expect(player.score).toBe(13);
    expect(player.waitingFor?.toModel().type).toBe(EPlayerInputType.OPTION);
    expect(resolveAllInputsDefault(game, player)).toBeGreaterThanOrEqual(3);
  });

  it('chains moon tuck rewards through the Land action', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-mars-moon-tuck-reward',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    const tuckedBefore = player.tuckedIncomeCards.length;
    player.gainTech(ETechId.PROBE_MOON);
    placeProbeOnPlanet(game, player.id, EPlanet.MARS, 1);
    player.probesInSpace = 1;

    game.processMainAction(player.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.MARS, isMoon: true },
    });

    expect(player.score).toBe(9);
    expect(player.resources.data).toBe(0);
    expect(player.waitingFor?.toModel().type).toBe(EPlayerInputType.CARD);
    resolveAllInputsDefault(game, player);
    expect(player.tuckedIncomeCards).toHaveLength(tuckedBefore + 2);
    expect(
      game.planetaryBoard?.planets.get(EPlanet.MARS)?.firstLandDataBonusTaken,
    ).toEqual([false, false]);
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
    resolveAllInputsDefault(game, p2);
    game.processEndTurn(p2.id);
    game.processMainAction(p1.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.MARS, isMoon: true },
    });

    expect(p1.resources.energy).toBe(2);
    resolveAllInputsDefault(game, p1);
    expect(
      game.planetaryBoard?.planets.get(EPlanet.MARS)?.moonOccupants,
    ).toEqual([{ playerId: p1.id, moonId: 'mars-phobos-deimos' }]);
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
      game.planetaryBoard?.planets.get(EPlanet.MARS)?.moonOccupants,
    ).toEqual([{ playerId: player.id, moonId: 'mars-phobos-deimos' }]);
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
    resolveAllInputsDefault(game, player);
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
