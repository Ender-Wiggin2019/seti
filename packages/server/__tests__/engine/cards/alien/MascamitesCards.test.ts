import {
  EEffectType,
  type IBaseEffect,
  type ICustomizedEffect,
} from '@seti/common/types/effect';
import { EResource } from '@seti/common/types/element';
import {
  EAlienType,
  EFreeAction,
  EMainAction,
  EPlanet,
  ETrace,
} from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type IPlayerInputModel,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ETechId } from '@seti/common/types/tech';
import {
  isMascamitesAlienBoard,
  type MascamitesAlienBoard,
} from '@/engine/alien/AlienBoard.js';
import { AlienState } from '@/engine/alien/AlienState.js';
import { MascamitesAlienPlugin } from '@/engine/alien/plugins/MascamitesAlienPlugin.js';
import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { Game } from '@/engine/Game.js';
import { applyMissionRewards } from '@/engine/missions/MissionReward.js';
import { scoreEndGameCard } from '@/engine/scoring/GoldScoringTile.js';
import { resolveSetupTucks } from '../../../helpers/TestGameBuilder.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createMascamitesGame(seed: string): {
  game: Game;
  board: MascamitesAlienBoard;
} {
  const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, seed, seed);
  resolveSetupTucks(game);
  game.alienState = AlienState.createFromHiddenAliens([EAlienType.MASCAMITES]);
  const board = game.alienState.getBoardByType(EAlienType.MASCAMITES);
  if (!isMascamitesAlienBoard(board)) {
    throw new Error('expected Mascamites board');
  }
  board.discovered = true;
  new MascamitesAlienPlugin().onDiscover(game, []);
  return { game, board };
}

function getOptionIds(game: Game): string[] {
  const model = game.activePlayer.waitingFor?.toModel() as
    | ISelectOptionInputModel
    | undefined;
  if (!model || model.type !== EPlayerInputType.OPTION) {
    throw new Error('expected option input');
  }
  return model.options.map((option) => option.id);
}

function selectOption(game: Game, optionId: string): void {
  game.processInput(game.activePlayer.id, {
    type: EPlayerInputType.OPTION,
    optionId,
  });
}

function resolveNonMissionOptions(game: Game): void {
  let guard = 0;
  while (game.activePlayer.waitingFor) {
    guard += 1;
    if (guard > 20) throw new Error('input resolution exceeded 20 steps');
    const model = game.activePlayer.waitingFor.toModel() as IPlayerInputModel;
    if (model.type !== EPlayerInputType.OPTION) {
      throw new Error(`unexpected input type: ${model.type}`);
    }
    const options = (model as ISelectOptionInputModel).options;
    const skipMissions = options.find(
      (candidate) => candidate.id === 'skip-missions',
    );
    if (skipMissions) {
      selectOption(game, skipMissions.id);
      continue;
    }
    const option = options[0];
    if (!option) throw new Error('missing selectable option');
    selectOption(game, option.id);
  }
}

function playCard(game: Game, cardId: string): void {
  const player = game.activePlayer;
  player.hand = [cardId];
  player.resources.gain({ credits: 10, energy: 10 });
  game.processMainAction(player.id, {
    type: EMainAction.PLAY_CARD,
    payload: { cardIndex: 0 },
  });
}

function placeProbeOnPlanet(game: Game, planet: EPlanet): void {
  const player = game.activePlayer;
  const space = game.solarSystem?.getSpacesOnPlanet(planet)[0];
  if (!space) throw new Error(`missing space for ${planet}`);
  game.solarSystem?.placeProbe(player.id, space.id);
  player.probesInSpace += 1;
}

function addMascamitesTrace(
  game: Game,
  board: MascamitesAlienBoard,
  trace: ETrace,
): void {
  const slot = board.addTraceSlot({
    slotId: `mascamites-test-${trace}-${board.speciesTraceSlots.length}`,
    alienIndex: board.alienIndex,
    traceColor: trace,
    maxOccupants: 1,
    rewards: [],
    isDiscovery: false,
  });
  const ok = game.alienState.applyTraceToSlot(
    game.activePlayer,
    game,
    slot.slotId,
    trace,
  );
  if (!ok) throw new Error(`failed to place ${trace}`);
}

describe('Mascamites alien cards ET.1-ET.10', () => {
  it('ET.1 lands, then lets the player pick up a sample from that planet without unhandled custom effects', () => {
    const { game, board } = createMascamitesGame('mascamites-et1');
    placeProbeOnPlanet(game, EPlanet.JUPITER);

    playCard(game, 'ET.1');
    selectOption(game, `land-${EPlanet.JUPITER}`);

    const sampleOptions = getOptionIds(game);
    expect(sampleOptions.some((id) => id.startsWith('sample:'))).toBe(true);
    selectOption(game, sampleOptions.find((id) => id.startsWith('sample:'))!);

    expect(board.capsules).toEqual([
      expect.objectContaining({
        ownerId: game.activePlayer.id,
        sourcePlanet: EPlanet.JUPITER,
        missionCardId: 'ET.1',
      }),
    ]);
    expect(
      game.eventLog
        .toArray()
        .some(
          (event) =>
            event.type === 'ACTION' &&
            event.action === 'CARD_CUSTOM_EFFECT_UNHANDLED',
        ),
    ).toBe(false);
  });

  it('ET.1 resolves moon landing rewards before sample pickup', () => {
    const { game, board } = createMascamitesGame('mascamites-et1-moon-reward');
    const player = game.activePlayer;
    player.gainTech(ETechId.PROBE_MOON);
    player.hand = ['ET.1'];
    player.resources.gain({ credits: 10, energy: 10 });
    placeProbeOnPlanet(game, EPlanet.SATURN);

    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });
    const scoreBeforeLanding = player.score;
    selectOption(game, `land-${EPlanet.SATURN}-moon-saturn-enceladus`);

    let rewardOptions = getOptionIds(game);
    expect(rewardOptions.some((id) => id.startsWith('sample:'))).toBe(false);
    selectOption(game, rewardOptions[0]);
    rewardOptions = getOptionIds(game);
    expect(rewardOptions.some((id) => id.startsWith('sample:'))).toBe(false);
    selectOption(game, rewardOptions[0]);
    rewardOptions = getOptionIds(game);
    expect(rewardOptions.some((id) => id.startsWith('sample:'))).toBe(false);
    selectOption(game, rewardOptions[0]);

    const sampleOptions = getOptionIds(game);
    expect(sampleOptions.some((id) => id.startsWith('sample:'))).toBe(true);
    selectOption(game, sampleOptions.find((id) => id.startsWith('sample:'))!);

    expect(player.score - scoreBeforeLanding).toBe(12);
    expect(board.capsules).toEqual([
      expect.objectContaining({
        ownerId: player.id,
        sourcePlanet: EPlanet.SATURN,
        missionCardId: 'ET.1',
      }),
    ]);
  });

  it('ET.1 can collect a sample, deliver it to Earth, and complete its mission through the real card flow', () => {
    const { game, board } = createMascamitesGame('mascamites-et1-deliver');
    placeProbeOnPlanet(game, EPlanet.JUPITER);

    playCard(game, 'ET.1');
    selectOption(game, `land-${EPlanet.JUPITER}`);
    const sampleId = board.samplePools.jupiter[0];
    selectOption(game, `sample:${sampleId}`);
    resolveNonMissionOptions(game);
    const capsule = board.capsules[0];
    const earthSpace = game.solarSystem?.getSpacesOnPlanet(EPlanet.EARTH)[0];
    if (!earthSpace) throw new Error('missing Earth space');
    capsule.spaceId = earthSpace.id;

    game.processFreeAction(game.activePlayer.id, {
      type: EFreeAction.DELIVER_SAMPLE,
      capsuleId: capsule.capsuleId,
      cardId: 'ET.1',
    });

    expect(board.capsules).toEqual([]);
    expect(board.deliveredSamples).toEqual([
      expect.objectContaining({
        sampleTokenId: sampleId,
        deliveredBy: game.activePlayer.id,
      }),
    ]);
    expect(
      game.activePlayer.completedMissions.map((card) =>
        typeof card === 'string' ? card : card.id,
      ),
    ).toContain('ET.1');
  });

  it.each([
    ['ET.1', EPlanet.JUPITER, `land-${EPlanet.JUPITER}`, EPlanet.EARTH],
    ['ET.2', EPlanet.JUPITER, `land-${EPlanet.JUPITER}`, EPlanet.EARTH],
    ['ET.3', EPlanet.JUPITER, `orbit-${EPlanet.JUPITER}`, EPlanet.EARTH],
    ['ET.4', EPlanet.JUPITER, `land-${EPlanet.JUPITER}`, EPlanet.MARS],
    ['ET.6', EPlanet.SATURN, `land-${EPlanet.SATURN}`, EPlanet.EARTH],
    ['ET.7', EPlanet.SATURN, `land-${EPlanet.SATURN}`, EPlanet.EARTH],
  ] as const)(
    '%s collects a sample, delivers it to its mission destination, and completes',
    (cardId, sourcePlanet, actionOptionId, destination) => {
      const { game, board } = createMascamitesGame(
        `mascamites-${cardId}-delivery`,
      );
      placeProbeOnPlanet(game, sourcePlanet);

      playCard(game, cardId);
      selectOption(game, actionOptionId);
      const sampleId = board.samplePools[sourcePlanet][0];
      selectOption(game, `sample:${sampleId}`);
      resolveNonMissionOptions(game);
      const capsule = board.capsules[0];
      const destinationSpace =
        game.solarSystem?.getSpacesOnPlanet(destination)[0];
      if (!destinationSpace) throw new Error(`missing ${destination} space`);
      capsule.spaceId = destinationSpace.id;

      game.processFreeAction(game.activePlayer.id, {
        type: EFreeAction.DELIVER_SAMPLE,
        capsuleId: capsule.capsuleId,
        cardId,
      });

      expect(board.capsules).toEqual([]);
      expect(board.deliveredSamples).toEqual([
        expect.objectContaining({
          sampleTokenId: sampleId,
          deliveredBy: game.activePlayer.id,
        }),
      ]);
      expect(
        game.activePlayer.completedMissions.map((card) =>
          typeof card === 'string' ? card : card.id,
        ),
      ).toContain(cardId);
    },
  );

  it.each([
    ['ET.8', ETrace.YELLOW],
    ['ET.9', ETrace.RED],
    ['ET.10', ETrace.BLUE],
  ] as const)(
    '%s completes from two matching Mascamites traces and resolves pickup-back reward',
    (cardId, trace) => {
      const { game, board } = createMascamitesGame(`mascamites-${cardId}`);
      addMascamitesTrace(game, board, trace);
      addMascamitesTrace(game, board, trace);
      const scoreToken = board.samplePools.jupiter.find((sampleId) =>
        sampleId.includes('vp'),
      );
      if (scoreToken) {
        board.samplePools.jupiter = [
          scoreToken,
          ...board.samplePools.jupiter.filter((id) => id !== scoreToken),
        ];
      }

      playCard(game, cardId);
      resolveNonMissionOptions(game);
      const completable = game.missionTracker.getCompletableQuickMissions(
        game.activePlayer,
        game,
      );
      expect(completable.map((mission) => mission.cardId)).toContain(cardId);

      const scoreBefore = game.activePlayer.score;
      game.processFreeAction(game.activePlayer.id, {
        type: EFreeAction.COMPLETE_MISSION,
        cardId,
      });
      selectOption(game, `mascamites-pickup-back-${EPlanet.JUPITER}`);
      selectOption(game, `sample:${board.samplePools.jupiter[0]}`);

      expect(board.samplePools.jupiter).toHaveLength(3);
      expect(game.activePlayer.score).toBeGreaterThanOrEqual(scoreBefore);
    },
  );

  it('ET.5 scores one point per Mascamites trace at end game', () => {
    const { game, board } = createMascamitesGame('mascamites-et5-endgame');
    addMascamitesTrace(game, board, ETrace.RED);
    addMascamitesTrace(game, board, ETrace.BLUE);
    const card = getCardRegistry().create('ET.5');

    expect(card.behavior.custom).toBeUndefined();
    expect(scoreEndGameCard(card, game.activePlayer, game)).toBe(2);
  });

  it('ET.5 pickup-back treats an owned Mascamites capsule as a probe on that planet', () => {
    const { game, board } = createMascamitesGame('mascamites-et5-capsule');
    const space = game.solarSystem?.getSpacesOnPlanet(EPlanet.JUPITER)[0];
    if (!space) throw new Error('missing Jupiter space');
    board.createCapsule({
      ownerId: game.activePlayer.id,
      sampleTokenId: 'mascamites-credit-2',
      sourcePlanet: EPlanet.JUPITER,
      spaceId: space.id,
      missionCardId: 'ET.1',
    });

    playCard(game, 'ET.5');

    expect(getOptionIds(game)).toContain(
      `mascamites-pickup-back-${EPlanet.JUPITER}`,
    );
  });

  it('continues mission rewards after resolving pickup-back reward', () => {
    const { game, board } = createMascamitesGame(
      'mascamites-pickup-back-chain',
    );
    board.samplePools.jupiter = ['mascamites-credit-2'];
    board.samplePools.saturn = [];
    const scoreBefore = game.activePlayer.score;
    const rewards: Array<IBaseEffect | ICustomizedEffect> = [
      {
        effectType: EEffectType.CUSTOMIZED,
        id: 'desc.et-pickup-back-reward',
        desc: 'desc.et-pickup-back-reward',
      },
      {
        effectType: EEffectType.BASE,
        type: EResource.SCORE,
        value: 5,
      },
    ];

    const planetInput = applyMissionRewards(rewards, game.activePlayer, game);
    const sampleInput = planetInput?.process({
      type: EPlayerInputType.OPTION,
      optionId: `mascamites-pickup-back-${EPlanet.JUPITER}`,
    });
    sampleInput?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'sample:mascamites-credit-2',
    });

    expect(game.activePlayer.score).toBe(scoreBefore + 5);
  });
});
