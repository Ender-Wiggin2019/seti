import {
  EFreeAction,
  EMainAction,
  EPhase,
  EPlanet,
} from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type ISelectEndOfRoundCardInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ETechId } from '@seti/common/types/tech';
import { ESolarSystemElementType } from '@/engine/board/SolarSystem.js';
import { Game } from '@/engine/Game.js';
import {
  ProbeAsteroidTech,
  ProbeDoubleProbeTech,
  ProbeMoonTech,
  ProbeRoverDiscountTech,
} from '@/engine/tech/techs/ProbeTechs.js';
import { GameError } from '@/shared/errors/GameError.js';
import {
  resolveSetupTucks,
  setSolarSystemInitialDiscAngles,
  skipSetupTucks,
} from '../../helpers/TestGameBuilder.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function resolvePassEndOfRoundPick(game: Game, playerId: string): void {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player?.waitingFor) {
    if (
      game.phase === EPhase.AWAIT_END_TURN &&
      game.activePlayer.id === playerId
    ) {
      game.processEndTurn(playerId);
    }
    return;
  }

  while (player.waitingFor) {
    const model = player.waitingFor.toModel();
    if (model.type === EPlayerInputType.END_OF_ROUND) {
      game.processInput(playerId, {
        type: EPlayerInputType.END_OF_ROUND,
        cardId: (model as ISelectEndOfRoundCardInputModel).cards[0].id,
      });
      continue;
    }

    if (model.type === EPlayerInputType.CARD) {
      game.processInput(playerId, {
        type: EPlayerInputType.CARD,
        cardIds: [model.cards[0].id],
      });
      continue;
    }

    if (model.type === EPlayerInputType.OPTION) {
      game.processInput(playerId, {
        type: EPlayerInputType.OPTION,
        optionId: model.options[0].id,
      });
      continue;
    }

    throw new Error(`Unexpected pass input type: ${model.type}`);
  }

  if (
    game.phase === EPhase.AWAIT_END_TURN &&
    game.activePlayer.id === playerId
  ) {
    game.processEndTurn(playerId);
  }
}

/** Shape ring 1 so rotating once puts Earth next to an asteroid and Venus. */
function patchSolarSystemForMeteoriteScenario(game: Game): void {
  setSolarSystemInitialDiscAngles(game, [0, 0, 0]);
  const ss = game.solarSystem;
  if (!ss) {
    throw new Error('Expected solar system');
  }

  const setSpace = (
    id: string,
    elements: Array<{ type: ESolarSystemElementType; amount: number }>,
    hasPublicityIcon = false,
  ) => {
    const space = ss.spaces.find((s) => s.id === id);
    if (!space) {
      throw new Error(`${id} not found`);
    }
    space.elements = elements;
    space.hasPublicityIcon = hasPublicityIcon;
  };

  setSpace('ring-1-cell-1', [
    { type: ESolarSystemElementType.EMPTY, amount: 1 },
  ]);
  setSpace('ring-1-cell-2', [
    { type: ESolarSystemElementType.ASTEROID, amount: 1 },
  ]);
  setSpace('ring-1-cell-3', [
    { type: ESolarSystemElementType.EMPTY, amount: 1 },
  ]);
  setSpace('ring-1-cell-5', [
    { type: ESolarSystemElementType.EMPTY, amount: 1 },
  ]);
  ss.setDynamicPlanetAtSpace(EPlanet.EARTH, 'ring-1-cell-3');
  ss.setDynamicPlanetAtSpace(EPlanet.VENUS, 'ring-1-cell-1', {
    grantVisitPublicity: true,
  });
}

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

function resolveAllInputs(game: Game, playerId: string): void {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) {
    throw new Error('player');
  }
  while (player.waitingFor) {
    const model = player.waitingFor.toModel();
    if (model.type === EPlayerInputType.TRACE) {
      game.processInput(playerId, {
        type: EPlayerInputType.TRACE,
        trace: model.options[0],
      });
    } else if (model.type === EPlayerInputType.CARD) {
      game.processInput(playerId, {
        type: EPlayerInputType.CARD,
        cardIds: [model.cards[0].id],
      });
    } else if (model.type === EPlayerInputType.OPTION) {
      game.processInput(playerId, {
        type: EPlayerInputType.OPTION,
        optionId: model.options[0].id,
      });
    } else {
      break;
    }
  }
}

describe('Probe tech modifiers (unit)', () => {
  it('raises probe space limit to 2 with double-probe tech', () => {
    const tech = new ProbeDoubleProbeTech();
    expect(tech.modifyProbeSpaceLimit(1)).toBe(2);
    expect(tech.modifyProbeSpaceLimit(2)).toBe(2);
  });

  it('removes asteroid leave surcharge and grants asteroid publicity', () => {
    const tech = new ProbeAsteroidTech();
    expect(tech.modifyAsteroidLeaveCost(1)).toBe(0);
    expect(tech.grantsAsteroidPublicity()).toBe(true);
  });

  it('reduces landing cost by 1 with rover discount tech', () => {
    const tech = new ProbeRoverDiscountTech();
    expect(tech.modifyLandingCost(3)).toBe(2);
    expect(tech.modifyLandingCost(2)).toBe(1);
  });

  it('enables moon landing with probe moon tech', () => {
    const tech = new ProbeMoonTech();
    expect(tech.grantsMoonLanding()).toBe(true);
  });
});

describe('Phase 8.1 — orange Probe tech (integration)', () => {
  it('8.1.0 probeLimit: third launch fails after two probes are already in space', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'phase-8-1-0-probe-limit',
    );
    resolveSetupTucks(game);
    const p1 = game.players[0];
    const p2 = game.players[1];
    p1.gainTech(ETechId.PROBE_DOUBLE_PROBE);
    p1.resources.gain({ credits: 10 });

    game.processMainAction(p1.id, { type: EMainAction.LAUNCH_PROBE });
    expect(p1.probesInSpace).toBe(1);

    game.processEndTurn(p1.id);
    game.processMainAction(p2.id, { type: EMainAction.PASS });
    resolvePassEndOfRoundPick(game, p2.id);

    game.processMainAction(p1.id, { type: EMainAction.LAUNCH_PROBE });
    expect(p1.probesInSpace).toBe(2);

    game.processEndTurn(p1.id);
    // p2 already passed this round; handoff returns to p1 for a third attempt.

    expect(() =>
      game.processMainAction(p1.id, { type: EMainAction.LAUNCH_PROBE }),
    ).toThrow(GameError);
    try {
      game.processMainAction(p1.id, { type: EMainAction.LAUNCH_PROBE });
    } catch (err) {
      expect((err as GameError).code).toBe(EErrorCode.INVALID_ACTION);
    }
    expect(p1.probesInSpace).toBe(2);
  });

  it('8.1.1 meteorite: publicity when entering asteroid; leaving asteroid costs no extra move', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'behavior-flow-seed',
      'phase-8-1-1-meteorite',
    );
    resolveSetupTucks(game);
    patchSolarSystemForMeteoriteScenario(game);
    game.solarSystem!.rotateNextDisc();

    const p1 = game.players[0];
    p1.gainTech(ETechId.PROBE_ASTEROID);

    game.processMainAction(p1.id, { type: EMainAction.LAUNCH_PROBE });

    const ss = game.solarSystem!;
    const earthId = ss.getSpacesOnPlanet(EPlanet.EARTH)[0].id;
    const fromEarth = ss.getAdjacentSpaces(earthId);
    const asteroidSpace = fromEarth.find((s) =>
      s.elements.some(
        (e) => e.type === ESolarSystemElementType.ASTEROID && e.amount > 0,
      ),
    );
    const venusSpace = ss.getSpacesOnPlanet(EPlanet.VENUS)[0];
    if (!asteroidSpace) {
      throw new Error('Expected asteroid adjacent to Earth');
    }

    p1.gainMove(5);
    const publicityBeforeAsteroid = p1.resources.publicity;

    game.processFreeAction(p1.id, {
      type: EFreeAction.MOVEMENT,
      path: [earthId, asteroidSpace.id],
    });

    expect(p1.resources.publicity).toBe(publicityBeforeAsteroid + 1);

    const moveBeforeLeave = p1.getMoveStash();
    const publicityBeforeVenus = p1.resources.publicity;

    game.processFreeAction(p1.id, {
      type: EFreeAction.MOVEMENT,
      path: [asteroidSpace.id, venusSpace.id],
    });

    expect(moveBeforeLeave - p1.getMoveStash()).toBe(1);
    expect(p1.resources.publicity).toBeGreaterThanOrEqual(publicityBeforeVenus);
  });

  it('8.1.2 roverDiscount: base landing cost is reduced by 1', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'phase-8-1-2-rover',
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
    resolveAllInputs(game, player.id);

    expect(player.resources.energy).toBe(1);
  });

  it('8.1.2 roverDiscount: stacks with orbiter discount (land after another player orbited)', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'phase-8-1-2-rover-stack',
    );
    resolveSetupTucks(game);
    const p1 = game.players[0];
    const p2 = game.players[1];

    p2.gainTech(ETechId.PROBE_ROVER_DISCOUNT);
    placeProbeOnPlanet(game, p1.id, EPlanet.SATURN, 1);
    placeProbeOnPlanet(game, p2.id, EPlanet.SATURN, 1);
    p1.probesInSpace = 1;
    p2.probesInSpace = 1;

    game.processMainAction(p1.id, {
      type: EMainAction.ORBIT,
      payload: { planet: EPlanet.SATURN },
    });
    resolveAllInputs(game, p1.id);
    game.processEndTurn(p1.id);

    game.processMainAction(p2.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.SATURN },
    });
    resolveAllInputs(game, p2.id);

    expect(p2.resources.energy).toBe(2);
  });

  it('8.1.3 roverMoon: can land on the moon with probe moon tech while moon is still locked', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'phase-8-1-3-moon',
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
    resolveAllInputs(game, player.id);

    expect(
      game.planetaryBoard?.planets.get(EPlanet.MARS)?.moonOccupant?.playerId,
    ).toBe(player.id);
  });

  it('8.1.4 rejects moon landing without probe moon tech when the moon is locked', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'phase-8-1-4-no-moon',
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
  });
});
