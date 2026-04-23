import { EAlienType, EPlanet, ETrace } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { AlienState } from '@/engine/alien/AlienState.js';
import { OumuamuaAlienPlugin } from '@/engine/alien/plugins/OumuamuaAlienPlugin.js';
import { LandProbeEffect } from '@/engine/effects/probe/LandProbeEffect.js';
import { OrbitProbeEffect } from '@/engine/effects/probe/OrbitProbeEffect.js';
import { Game } from '@/engine/Game.js';
import { Player } from '@/engine/player/Player.js';
import { resolveSetupTucks } from '../../../helpers/TestGameBuilder.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createGame(seed: string): { game: Game; p1: Player; p2: Player } {
  const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, seed, seed);
  resolveSetupTucks(game);
  game.alienState = AlienState.createFromHiddenAliens([EAlienType.OUMUAMUA]);
  const board = game.alienState.getBoardByType(EAlienType.OUMUAMUA);
  if (!board) {
    throw new Error('expected oumuamua board');
  }
  board.discovered = true;
  return { game, p1: game.players[0] as Player, p2: game.players[1] as Player };
}

function findExpectedOumuamuaSpaceId(game: Game): string {
  const ss = game.solarSystem;
  if (!ss) throw new Error('expected solar system');
  const jupiterSector = ss.getSectorIndexOfPlanet(EPlanet.JUPITER);
  if (jupiterSector === null) throw new Error('expected jupiter sector');
  const targetSector = (jupiterSector + 2) % game.sectors.length;
  const candidates = ss.getSpacesInSector(targetSector).filter(
    (space) =>
      !space.elements.some((el) => el.type === 'NULL' && el.amount > 0),
  );
  const preferred =
    candidates.find((space) => space.discIndex === 2) ?? candidates[0];
  if (!preferred) throw new Error('expected oumuamua target space');
  return preferred.id;
}

function findTraceSlotId(
  game: Game,
  color: ETrace,
  tierFromBottom: number,
): string {
  const board = game.alienState.getBoardByType(EAlienType.OUMUAMUA);
  if (!board) throw new Error('expected oumuamua board');
  const slot = board.slots.find((candidate) =>
    candidate.slotId.includes(`oumuamua-trace|${color}|${tierFromBottom}|`),
  );
  if (!slot) throw new Error(`missing trace slot: ${color}/${tierFromBottom}`);
  return slot.slotId;
}

describe('OumuamuaAlienPlugin', () => {
  it('initializes oumuamua tile metadata/data/supply on discover', () => {
    const { game } = createGame('oumuamua-a1');
    const plugin = new OumuamuaAlienPlugin();

    plugin.onDiscover(game, []);
    const state = plugin.getRuntimeState(game);

    expect(state?.meta).not.toBeNull();
    expect(state?.tileDataRemaining).toBe(3);
    expect(state?.exofossilSupplyRemaining).toBe(20);
  });

  it('grants +1 publicity if a probe is already on the oumuamua space at discover', () => {
    const { game, p1 } = createGame('oumuamua-a2');
    const plugin = new OumuamuaAlienPlugin();
    const spaceId = findExpectedOumuamuaSpaceId(game);
    const publicityBefore = p1.resources.publicity;

    game.solarSystem?.placeProbe(p1.id, spaceId);
    plugin.onDiscover(game, []);

    expect(p1.resources.publicity).toBe(publicityBefore + 1);
  });

  it('registers oumuamua as a planet on its tile space', () => {
    const { game } = createGame('oumuamua-a1-planet');
    const plugin = new OumuamuaAlienPlugin();

    plugin.onDiscover(game, []);
    const state = plugin.getRuntimeState(game);
    if (!state?.meta) throw new Error('missing oumuamua meta');

    const location = game.solarSystem?.getPlanetLocation(EPlanet.OUMUAMUA);
    expect(location?.space.id).toBe(state.meta.spaceId);
  });

  it('prompts sector-vs-tile choice when marking signal in oumuamua sector', () => {
    const { game, p1 } = createGame('oumuamua-b1');
    const plugin = new OumuamuaAlienPlugin();
    plugin.onDiscover(game, []);
    const state = plugin.getRuntimeState(game);
    if (!state?.meta) throw new Error('missing oumuamua meta');

    const input = plugin.createSectorOrTileSignalInput(
      p1,
      game,
      state.meta.sectorId,
      () => {
        throw new Error('should not auto-mark sector');
      },
    );

    const model = input?.toModel() as ISelectOptionInputModel;
    expect(model.type).toBe(EPlayerInputType.OPTION);
    expect(model.options.map((option) => option.id)).toEqual(
      expect.arrayContaining(['oumuamua-sector', 'oumuamua-tile']),
    );
  });

  it('tile marking consumes one data and records marker owner', () => {
    const { game, p1 } = createGame('oumuamua-b3');
    const plugin = new OumuamuaAlienPlugin();
    plugin.onDiscover(game, []);
    const scoreBefore = p1.score;

    plugin.markTileSignal(p1, game);
    const state = plugin.getRuntimeState(game);

    expect(state?.tileDataRemaining).toBe(2);
    expect(state?.tileMarkerPlayerIds).toEqual([p1.id]);
    expect(p1.score).toBe(scoreBefore + 1);
  });

  it('on tile completion, each marker owner gains exofossil and tile resets', () => {
    const { game, p1, p2 } = createGame('oumuamua-c1-c4');
    const plugin = new OumuamuaAlienPlugin();
    plugin.onDiscover(game, []);
    const p1Before = p1.exofossils;
    const p2Before = p2.exofossils;

    plugin.markTileSignal(p1, game);
    plugin.markTileSignal(p2, game);
    plugin.markTileSignal(p1, game);

    const state = plugin.getRuntimeState(game);
    expect(p1.exofossils).toBe(p1Before + 1);
    expect(p2.exofossils).toBe(p2Before + 1);
    expect(state?.tileDataRemaining).toBe(3);
    expect(state?.tileMarkerPlayerIds).toEqual([]);
  });

  it('second marker grants no score and third marker grants +2 score', () => {
    const { game, p1 } = createGame('oumuamua-b4-b5');
    const plugin = new OumuamuaAlienPlugin();
    plugin.onDiscover(game, []);
    const scoreBefore = p1.score;

    plugin.markTileSignal(p1, game);
    expect(p1.score).toBe(scoreBefore + 1);

    plugin.markTileSignal(p1, game);
    expect(p1.score).toBe(scoreBefore + 1);

    plugin.markTileSignal(p1, game);
    expect(p1.score).toBe(scoreBefore + 3);
  });

  it('tile can complete repeatedly and exofossil supply is consumed', () => {
    const { game, p1 } = createGame('oumuamua-c5');
    const plugin = new OumuamuaAlienPlugin();
    plugin.onDiscover(game, []);
    const before = plugin.getRuntimeState(game);
    if (!before) throw new Error('missing runtime state');

    for (let i = 0; i < 6; i += 1) {
      plugin.markTileSignal(p1, game);
    }

    const after = plugin.getRuntimeState(game);
    expect(p1.exofossils).toBe(2);
    expect(after?.tileDataRemaining).toBe(3);
    expect(after?.exofossilSupplyRemaining).toBe(
      before.exofossilSupplyRemaining - 2,
    );
  });

  it('visiting oumuamua grants publicity, and orbit/land treat it as a valid planet', () => {
    const { game, p1 } = createGame('oumuamua-d5-d6');
    const plugin = new OumuamuaAlienPlugin();
    plugin.onDiscover(game, []);
    const state = plugin.getRuntimeState(game);
    if (!state?.meta) throw new Error('missing oumuamua meta');
    const solarSystem = game.solarSystem;
    if (!solarSystem) throw new Error('expected solar system');

    const adjacentId =
      (solarSystem.adjacency.get(state.meta.spaceId) ?? []).find((spaceId) =>
        !solarSystem
          .getProbesAt(spaceId)
          .some((probe) => probe.playerId === p1.id),
      ) ?? null;
    if (!adjacentId) throw new Error('expected adjacent space');

    const traveler = solarSystem.placeProbe(p1.id, adjacentId);
    const publicityBefore = p1.resources.publicity;
    const moveResult = solarSystem.moveProbe(
      traveler.id,
      adjacentId,
      state.meta.spaceId,
    );
    p1.resources.gain({ publicity: moveResult.publicityGained });
    expect(p1.resources.publicity).toBe(publicityBefore + 1);

    solarSystem.placeProbe(p1.id, state.meta.spaceId);
    expect(OrbitProbeEffect.canExecute(p1, game, EPlanet.OUMUAMUA)).toBe(true);
    OrbitProbeEffect.execute(p1, game, EPlanet.OUMUAMUA);

    solarSystem.placeProbe(p1.id, state.meta.spaceId);
    expect(LandProbeEffect.canExecute(p1, game, EPlanet.OUMUAMUA)).toBe(true);
    const land = LandProbeEffect.execute(p1, game, EPlanet.OUMUAMUA);
    expect(land.planet).toBe(EPlanet.OUMUAMUA);
  });

  it('creates 3 columns x 6 slots with expected repeatable top tier', () => {
    const { game } = createGame('oumuamua-d1-layout');
    const plugin = new OumuamuaAlienPlugin();
    plugin.onDiscover(game, []);
    const board = game.alienState.getBoardByType(EAlienType.OUMUAMUA);
    if (!board) throw new Error('expected oumuamua board');

    const traceSlots = board.slots.filter((slot) =>
      slot.slotId.includes('oumuamua-trace|'),
    );
    expect(traceSlots).toHaveLength(18);
    for (const color of [ETrace.RED, ETrace.YELLOW, ETrace.BLUE]) {
      const top = board.slots.find((slot) =>
        slot.slotId.includes(`oumuamua-trace|${color}|6|1`),
      );
      expect(top?.maxOccupants).toBe(-1);
    }
  });

  it('tier-1 slot requires 4 exofossils and grants 25 vp', () => {
    const { game, p1 } = createGame('oumuamua-d1-tier1');
    const plugin = new OumuamuaAlienPlugin();
    plugin.onDiscover(game, []);
    const slotId = findTraceSlotId(game, ETrace.RED, 1);

    const fail = game.alienState.applyTraceToSlot(p1, game, slotId, ETrace.RED);
    expect(fail).toBe(false);

    p1.gainExofossils(4);
    const scoreBefore = p1.score;
    const exoBefore = p1.exofossils;
    const ok = game.alienState.applyTraceToSlot(p1, game, slotId, ETrace.RED);
    expect(ok).toBe(true);
    expect(p1.score).toBe(scoreBefore + 25);
    expect(p1.exofossils).toBe(exoBefore - 4);
  });

  it('tier-4 and tier-5 slots grant exofossil/publicity bonuses', () => {
    const { game, p1 } = createGame('oumuamua-d1-tier4-tier5');
    const plugin = new OumuamuaAlienPlugin();
    plugin.onDiscover(game, []);

    const tier4 = findTraceSlotId(game, ETrace.YELLOW, 4);
    const tier5 = findTraceSlotId(game, ETrace.BLUE, 5);
    const scoreBefore = p1.score;
    const exoBefore = p1.exofossils;
    const publicityBefore = p1.resources.publicity;

    expect(game.alienState.applyTraceToSlot(p1, game, tier4, ETrace.YELLOW)).toBe(
      true,
    );
    expect(game.alienState.applyTraceToSlot(p1, game, tier5, ETrace.BLUE)).toBe(
      true,
    );

    expect(p1.score).toBe(scoreBefore + 3 + 2);
    expect(p1.exofossils).toBe(exoBefore + 2);
    expect(p1.resources.publicity).toBe(publicityBefore + 1);
  });

  it('tier-6 slot is repeatable and each mark costs 1 exofossil for 6 vp', () => {
    const { game, p1 } = createGame('oumuamua-d3-tier6');
    const plugin = new OumuamuaAlienPlugin();
    plugin.onDiscover(game, []);
    const slotId = findTraceSlotId(game, ETrace.RED, 6);
    p1.gainExofossils(2);

    const scoreBefore = p1.score;
    expect(game.alienState.applyTraceToSlot(p1, game, slotId, ETrace.RED)).toBe(
      true,
    );
    expect(game.alienState.applyTraceToSlot(p1, game, slotId, ETrace.RED)).toBe(
      true,
    );
    expect(game.alienState.applyTraceToSlot(p1, game, slotId, ETrace.RED)).toBe(
      false,
    );

    const board = game.alienState.getBoardByType(EAlienType.OUMUAMUA);
    if (!board) throw new Error('expected oumuamua board');
    const slot = board.slots.find((candidate) => candidate.slotId === slotId);
    expect(slot?.occupants.length).toBe(2);
    expect(p1.score).toBe(scoreBefore + 12);
    expect(p1.exofossils).toBe(0);
  });
});
