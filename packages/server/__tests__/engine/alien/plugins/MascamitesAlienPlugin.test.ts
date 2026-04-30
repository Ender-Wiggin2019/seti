import {
  MASCAMITES_SAMPLE_TOKENS,
  type TMascamitesSampleTokenId,
} from '@seti/common/constant/mascamites';
import {
  EFreeAction,
  EAlienType,
  EMainAction,
  EPlanet,
  ETrace,
} from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { OrbitAction } from '@/engine/actions/Orbit.js';
import {
  isMascamitesAlienBoard,
  type MascamitesAlienBoard,
} from '@/engine/alien/AlienBoard.js';
import { AlienState } from '@/engine/alien/AlienState.js';
import { MascamitesAlienPlugin } from '@/engine/alien/plugins/MascamitesAlienPlugin.js';
import { LandAction } from '@/engine/actions/Land.js';
import { ESolarSystemElementType } from '@/engine/board/SolarSystem.js';
import { Deck } from '@/engine/deck/Deck.js';
import { MovementFreeAction } from '@/engine/freeActions/Movement.js';
import { Game } from '@/engine/Game.js';
import { EMissionType } from '@/engine/missions/IMission.js';
import {
  getPlayer,
  resolveSetupTucks,
} from '../../../helpers/TestGameBuilder.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createMascamitesGame(seed: string): {
  game: Game;
  board: MascamitesAlienBoard;
  plugin: MascamitesAlienPlugin;
} {
  const game = Game.create(
    TEST_PLAYERS,
    { playerCount: 2, alienModulesEnabled: [false, false, false, true, true] },
    seed,
    seed,
  );
  resolveSetupTucks(game);
  game.alienState = AlienState.createFromHiddenAliens([EAlienType.MASCAMITES]);
  const board = game.alienState.getBoardByType(EAlienType.MASCAMITES);
  if (!isMascamitesAlienBoard(board)) {
    throw new Error('expected Mascamites board');
  }
  board.discovered = true;
  const plugin = new MascamitesAlienPlugin();
  plugin.onDiscover(game, []);
  return { game, board, plugin };
}

function sampleIds(board: MascamitesAlienBoard): TMascamitesSampleTokenId[] {
  return [
    ...board.samplePools.jupiter,
    ...board.samplePools.saturn,
    ...board.publicSamples,
    ...board.capsules.map((capsule) => capsule.sampleTokenId),
    ...board.deliveredSamples.map((sample) => sample.sampleTokenId),
  ];
}

function firstSampleAt(
  board: MascamitesAlienBoard,
  planet: EPlanet.JUPITER | EPlanet.SATURN,
): TMascamitesSampleTokenId {
  const sampleId = board.samplePools[planet][0];
  if (!sampleId) {
    throw new Error(`expected sample on ${planet}`);
  }
  return sampleId;
}

describe('MascamitesAlienPlugin', () => {
  it('MAS-A1/A2 initializes three Jupiter samples, three Saturn samples, one public sample, and preserves token total', () => {
    const { board } = createMascamitesGame('mas-a1');

    expect(board.samplePools.jupiter).toHaveLength(3);
    expect(board.samplePools.saturn).toHaveLength(3);
    expect(board.publicSamples).toHaveLength(1);
    expect(new Set(sampleIds(board))).toEqual(
      new Set(MASCAMITES_SAMPLE_TOKENS.map((token) => token.id)),
    );
  });

  it('MAS-A4 collects by visible choice rather than blind random and creates a capsule at the source planet', () => {
    const { game, board, plugin } = createMascamitesGame('mas-a4');
    const p1 = getPlayer(game, 'p1');
    const chosen = firstSampleAt(board, EPlanet.JUPITER);
    const otherVisibleSamples = board.samplePools.jupiter.filter(
      (sampleId) => sampleId !== chosen,
    );

    const input = plugin.createCollectSampleInput(
      p1,
      game,
      EPlanet.JUPITER,
      'ET.1',
    );
    expect(input?.toModel().type).toBe(EPlayerInputType.OPTION);
    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: `sample:${chosen}`,
    });

    expect(board.capsules).toEqual([
      expect.objectContaining({
        ownerId: p1.id,
        sampleTokenId: chosen,
        sourcePlanet: EPlanet.JUPITER,
        missionCardId: 'ET.1',
      }),
    ]);
    expect(board.samplePools.jupiter).toEqual(otherVisibleSamples);
    expect(sampleIds(board)).toHaveLength(MASCAMITES_SAMPLE_TOKENS.length);
  });

  it('MAS-A3 skips sample collection when a planet pool is empty without blocking the card main effect', () => {
    const { game, board, plugin } = createMascamitesGame('mas-a3');
    const p1 = getPlayer(game, 'p1');
    board.samplePools.jupiter = [];

    expect(
      plugin.createCollectSampleInput(p1, game, EPlanet.JUPITER, 'ET.1'),
    ).toBeUndefined();
  });

  it('MAS-B2/B3/B4 moves a capsule with movement points and applies publicity plus asteroid leave cost', () => {
    const { game, board, plugin } = createMascamitesGame('mas-b2');
    const p1 = getPlayer(game, 'p1');
    const chosen = firstSampleAt(board, EPlanet.SATURN);
    const capsule = plugin.collectSample(
      p1,
      game,
      EPlanet.SATURN,
      chosen,
      'ET.1',
    );
    const ss = game.solarSystem;
    if (!ss) throw new Error('expected solar system');
    const startSpace = ss.getSpacesOnPlanet(EPlanet.SATURN)[0];
    const iconSpace = ss.getAdjacentSpaces(startSpace.id)[0];
    iconSpace.hasPublicityIcon = true;
    const nextSpace = ss
      .getAdjacentSpaces(iconSpace.id)
      .find((space) => space.id !== startSpace.id);
    if (!nextSpace) throw new Error('expected a next space');
    iconSpace.elements = [
      { type: ESolarSystemElementType.ASTEROID, amount: 1 },
    ];
    nextSpace.hasPublicityIcon = false;
    p1.gainMove(4);
    const publicityBefore = p1.resources.publicity;

    const result = MovementFreeAction.execute(
      p1,
      game,
      [startSpace.id, iconSpace.id, nextSpace.id],
      { target: { type: 'mascamites-capsule', id: capsule.capsuleId } },
    );

    expect(result.totalCost).toBe(3);
    expect(result.publicityGained).toBe(1);
    expect(p1.resources.publicity).toBe(publicityBefore + 1);
    expect(board.capsules[0].spaceId).toBe(nextSpace.id);
  });

  it('MAS-B5 allows one player to maintain multiple capsules independently', () => {
    const { game, board, plugin } = createMascamitesGame('mas-b5');
    const p1 = getPlayer(game, 'p1');
    const first = plugin.collectSample(
      p1,
      game,
      EPlanet.JUPITER,
      firstSampleAt(board, EPlanet.JUPITER),
      'ET.1',
    );
    const second = plugin.collectSample(
      p1,
      game,
      EPlanet.SATURN,
      firstSampleAt(board, EPlanet.SATURN),
      'ET.4',
    );

    expect(board.capsules.map((capsule) => capsule.capsuleId).sort()).toEqual(
      [first.capsuleId, second.capsuleId].sort(),
    );
    expect(p1.probesInSpace).toBe(0);
  });

  it('MAS-C1/C2/C3 keeps capsules out of orbit, land, and probe-limit accounting', () => {
    const { game, board, plugin } = createMascamitesGame('mas-c1');
    const p1 = getPlayer(game, 'p1');
    plugin.collectSample(
      p1,
      game,
      EPlanet.JUPITER,
      firstSampleAt(board, EPlanet.JUPITER),
      'ET.1',
    );
    p1.resources.gain({ credits: 10, energy: 10 });

    expect(OrbitAction.canExecute(p1, game, EPlanet.JUPITER)).toBe(false);
    expect(LandAction.canExecute(p1, EPlanet.JUPITER)).toBe(false);
    expect(p1.probesInSpace).toBe(0);

    game.processMainAction(p1.id, { type: EMainAction.LAUNCH_PROBE });
    expect(p1.probesInSpace).toBe(1);
  });

  it('MAS-D1/D2/D3 delivers a capsule at the mission destination once, grants token reward, and completes the mission card', () => {
    const { game, board, plugin } = createMascamitesGame('mas-d1');
    const p1 = getPlayer(game, 'p1');
    game.mainDeck = new Deck(['reward-card'], []);
    const tokenId = MASCAMITES_SAMPLE_TOKENS.find((token) =>
      token.rewards.some(
        (reward) => reward.type === 'VP' && reward.amount === 7,
      ),
    )!.id;
    board.samplePools.jupiter = [
      tokenId,
      ...board.samplePools.jupiter.filter((sampleId) => sampleId !== tokenId),
    ];
    const capsule = plugin.collectSample(
      p1,
      game,
      EPlanet.JUPITER,
      tokenId,
      'ET.1',
    );
    const ss = game.solarSystem;
    if (!ss) throw new Error('expected solar system');
    capsule.spaceId = ss.getSpacesOnPlanet(EPlanet.EARTH)[0].id;
    p1.playedMissions.push({ id: 'ET.1' });
    game.missionTracker.registerMission(
      {
        cardId: 'ET.1',
        cardName: 'First Contact',
        type: EMissionType.QUICK,
        branches: [{ req: [], rewards: [] }],
      },
      p1.id,
    );
    const scoreBefore = p1.score;

    game.processFreeAction(p1.id, {
      type: EFreeAction.DELIVER_SAMPLE,
      capsuleId: capsule.capsuleId,
      cardId: 'ET.1',
    });

    expect(p1.score).toBe(scoreBefore + 7);
    expect(board.capsules).toHaveLength(0);
    expect(board.deliveredSamples).toEqual([
      expect.objectContaining({ sampleTokenId: tokenId, deliveredBy: p1.id }),
    ]);
    expect(
      p1.completedMissions.map((card) =>
        typeof card === 'string' ? card : card.id,
      ),
    ).toEqual(['ET.1']);
    expect(() =>
      game.processFreeAction(p1.id, {
        type: EFreeAction.DELIVER_SAMPLE,
        capsuleId: capsule.capsuleId,
        cardId: 'ET.1',
      }),
    ).toThrow();
  });

  it('MAS-D refuses delivery cards without structured sample destination data', () => {
    const { game, board, plugin } = createMascamitesGame('mas-d-semantic');
    const p1 = getPlayer(game, 'p1');
    const tokenId = firstSampleAt(board, EPlanet.JUPITER);
    const capsule = plugin.collectSample(
      p1,
      game,
      EPlanet.JUPITER,
      tokenId,
      'ET.8',
    );
    const ss = game.solarSystem;
    if (!ss) throw new Error('expected solar system');
    capsule.spaceId = ss.getSpacesOnPlanet(EPlanet.EARTH)[0].id;

    expect(() =>
      game.processFreeAction(p1.id, {
        type: EFreeAction.DELIVER_SAMPLE,
        capsuleId: capsule.capsuleId,
        cardId: 'ET.8',
      }),
    ).toThrow(/does not define a sample delivery destination/);
    expect(board.capsules).toHaveLength(1);
    expect(board.deliveredSamples).toEqual([]);
  });

  it('MAS-D4/D5/D6 turns delivered samples into one-use blue trace slots whose token reward can be claimed by any player', () => {
    const { game, board, plugin } = createMascamitesGame('mas-d4');
    const p1 = getPlayer(game, 'p1');
    const p2 = getPlayer(game, 'p2');
    const tokenId = MASCAMITES_SAMPLE_TOKENS.find((token) =>
      token.rewards.some(
        (reward) => reward.type === 'DATA' && reward.amount === 2,
      ),
    )!.id;

    const slot = plugin.addDeliveredSampleBlueSlot(game, {
      sampleTokenId: tokenId,
      deliveredBy: p1.id,
      deliveredAtRound: game.round,
    });
    const dataBefore = p2.resources.data;

    expect(
      game.alienState.applyTraceToSlot(p2, game, slot.slotId, ETrace.BLUE),
    ).toBe(true);
    expect(p2.resources.data).toBe(dataBefore + 2);
    expect(
      game.alienState.applyTraceToSlot(p1, game, slot.slotId, ETrace.BLUE),
    ).toBe(false);
  });
});
