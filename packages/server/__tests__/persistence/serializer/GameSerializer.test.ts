import { RIVAL_COMPUTER_SLOT_REWARDS } from '@seti/common/constant/solo';
import {
  getAvailableFreeActions,
  getAvailableMainActions,
} from '@seti/common/rules';
import { ESector } from '@seti/common/types/element';
import {
  EAlienType,
  EFreeAction,
  EMainAction,
  EPlanet,
  ETrace,
} from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectEndOfRoundCardInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ETechId } from '@seti/common/types/tech';
import {
  isAnomaliesAlienBoard,
  isCentauriansAlienBoard,
  isExertiansAlienBoard,
  isMascamitesAlienBoard,
  isOumuamuaAlienBoard,
} from '@/engine/alien/AlienBoard.js';
import { AlienState } from '@/engine/alien/AlienState.js';
import { Game } from '@/engine/Game.js';
import {
  projectGameState,
  serializeGame,
} from '@/persistence/serializer/GameSerializer.js';
import { resolveSetupTucks } from '../../helpers/TestGameBuilder.js';

function createTestGame(): Game {
  const game = Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
    ],
    { playerCount: 2 },
    'serializer-seed',
    'game-serializer-test',
  );
  resolveSetupTucks(game);
  return game;
}

function createSoloTestGame(): Game {
  return Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      {
        id: 'rival:game-serializer-solo',
        name: 'Rival Institution',
        color: 'blue',
        seatIndex: 1,
      },
    ],
    {
      playerCount: 2,
      isSoloMode: true,
      soloDifficulty: 4,
    } as Parameters<typeof Game.create>[1],
    'serializer-solo-seed',
    'game-serializer-solo',
  );
}

describe('GameSerializer', () => {
  it('serializes core state and RNG snapshot', () => {
    const game = createTestGame();
    const dto = serializeGame(game, 7);

    expect(dto.gameId).toBe(game.id);
    expect(dto.version).toBe(7);
    expect(dto.seed).toBe(game.seed);
    expect(dto.roundIndex).toBe(game.roundIndex);
    expect(dto.maxRounds).toBe(game.maxRounds);
    expect(typeof dto.rngState).toBe('number');
    expect(dto.players).toHaveLength(2);
    expect(dto.mainDeck.drawPile.length + dto.mainDeck.discardPile.length).toBe(
      game.mainDeck.totalSize,
    );
  });

  it('projects round counters for clients', () => {
    const game = createTestGame();
    const publicState = projectGameState(game, 'p1');

    expect(publicState.roundIndex).toBe(1);
    expect(publicState.maxRounds).toBe(5);
  });

  it('serializes and projects public solo rival state without deck order', () => {
    const game = createSoloTestGame();
    game.players[1].gainTech(ETechId.PROBE_DOUBLE_PROBE);
    const dto = serializeGame(game, 3) as ReturnType<typeof serializeGame> & {
      rivalState?: {
        rivalPlayerId: string;
        difficulty: number;
        progress: number;
        actionDeck: { drawPile: string[] };
      };
    };

    expect(dto.rivalState).toMatchObject({
      rivalPlayerId: 'rival:game-serializer-solo',
      difficulty: 4,
      progress: 15,
    });
    expect(dto.rivalState?.actionDeck.drawPile).toHaveLength(5);

    const publicState = projectGameState(game, 'p1') as ReturnType<
      typeof projectGameState
    > & {
      isSoloMode?: boolean;
      rival?: {
        rivalPlayerId: string;
        difficulty: number;
        progress: number;
        actionDeck: { drawPileSize: number; discardPileSize: number };
      };
    };

    expect(publicState.isSoloMode).toBe(true);
    expect(publicState.rival).toMatchObject({
      rivalPlayerId: 'rival:game-serializer-solo',
      difficulty: 4,
      progress: 15,
      techIds: [ETechId.PROBE_DOUBLE_PROBE],
      actionDeck: {
        drawPileSize: 5,
        discardPileSize: 0,
      },
    });
    expect(publicState.rival?.computer.slotRewards).toEqual(
      RIVAL_COMPUTER_SLOT_REWARDS,
    );
    expect(publicState.rival).not.toHaveProperty('actionDeck.drawPile');
  });

  it('projects hidden information per viewer', () => {
    const game = createTestGame();
    game.processMainAction(game.activePlayer.id, { type: EMainAction.PASS });

    const p1View = projectGameState(game, 'p1');
    const p2ForP1 = p1View.players.find((player) => player.playerId === 'p2');
    expect(p2ForP1?.hand).toBeUndefined();
    expect(typeof p2ForP1?.handSize).toBe('number');

    const p2View = projectGameState(game, 'p2');
    const p2Self = p2View.players.find((player) => player.playerId === 'p2');
    expect(Array.isArray(p2Self?.hand)).toBe(true);
    expect(p2View.solarSystem.spaces.length).toBeGreaterThan(0);
  });

  it('does not project hidden end-of-round stack contents', () => {
    const game = createTestGame();
    expect(game.endOfRoundStacks[game.roundRotationReminderIndex].length).toBe(
      3,
    );

    const publicState = projectGameState(game, 'p1');

    expect(publicState.endOfRoundStacks).toBeUndefined();
    expect(publicState.currentEndOfRoundStackIndex).toBe(
      game.roundRotationReminderIndex,
    );

    game.processMainAction(game.activePlayer.id, { type: EMainAction.PASS });
    const model =
      game.players[0].waitingFor?.toModel() as ISelectEndOfRoundCardInputModel;

    expect(model.type).toBe(EPlayerInputType.END_OF_ROUND);
    expect(model.cards).toHaveLength(3);
    expect(projectGameState(game, 'p2').endOfRoundStacks).toBeUndefined();
  });

  it('projects orbit and land as available when a probe is on a planet', () => {
    const game = createTestGame();
    const player = game.players[0];
    const marsSpace = game.solarSystem?.getSpacesOnPlanet(EPlanet.MARS)[0];
    if (!marsSpace || !game.solarSystem) {
      throw new Error('expected Mars space in solar system');
    }

    game.solarSystem.placeProbe(player.id, marsSpace.id);
    player.probesInSpace = 1;

    const publicState = projectGameState(game, player.id);
    const publicPlayer = publicState.players.find(
      (p) => p.playerId === player.id,
    );
    if (!publicPlayer) {
      throw new Error('expected projected player state');
    }

    const actions = getAvailableMainActions(publicPlayer, publicState);
    expect(actions).toContain(EMainAction.ORBIT);
    expect(actions).toContain(EMainAction.LAND);
  });

  it('projects the effective probe limit when double-probe tech is owned', () => {
    const game = createTestGame();
    const player = game.players[0];
    player.gainTech(ETechId.PROBE_DOUBLE_PROBE);
    player.probesInSpace = 2;

    const publicState = projectGameState(game, player.id);
    const publicPlayer = publicState.players.find(
      (p) => p.playerId === player.id,
    );

    expect(publicPlayer?.probeSpaceLimit).toBe(2);
  });

  it('projects completable quick mission branches only to the owning viewer', () => {
    const game = createTestGame();
    const player = game.players[0];
    player.hand = ['37'];

    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });

    for (const sector of game.sectors.filter(
      (sector) => sector.color === ESector.RED,
    )) {
      sector.sectorWinners.push(player.id);
    }

    const selfView = projectGameState(game, player.id);
    const selfPlayer = selfView.players.find((p) => p.playerId === player.id);
    if (!selfPlayer) {
      throw new Error('expected projected self player');
    }

    expect(selfPlayer.completableMissionBranches).toEqual([
      { cardId: '37', branchIndex: 0 },
    ]);
    expect(getAvailableFreeActions(selfPlayer, selfView)).toContain(
      EFreeAction.COMPLETE_MISSION,
    );

    const opponentView = projectGameState(game, game.players[1].id);
    const hiddenPlayer = opponentView.players.find(
      (p) => p.playerId === player.id,
    );
    expect(hiddenPlayer?.completableMissionBranches).toBeUndefined();
  });

  it('does not persist redundant planetSpaceId inside planetary board state', () => {
    const game = createTestGame();
    const dto = serializeGame(game, 7);

    expect(
      dto.planetaryBoard?.planets.every(
        (planet) => !('planetSpaceId' in planet.state),
      ),
    ).toBe(true);
  });

  it('persists alien components in explicit component fields', () => {
    const game = createTestGame();
    game.hiddenAliens = [EAlienType.ANOMALIES];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.boards[0];
    if (!isAnomaliesAlienBoard(board)) {
      throw new Error('expected anomalies board');
    }
    board.discovered = true;
    board.addAnomalyColumn({
      slotId: 'alien-0-anomaly-column|red-trace',
      alienIndex: 0,
      traceColor: ETrace.RED,
      maxOccupants: -1,
      rewards: [],
      isDiscovery: false,
    });
    game.solarSystem?.addAlienToken({
      tokenId: 'alien-0-anomaly-token|0|red-trace',
      alienType: EAlienType.ANOMALIES,
      sectorIndex: 0,
      traceColor: ETrace.RED,
      rewards: [{ type: 'VP', amount: 4 }],
    });

    const dto = serializeGame(game, 7);
    const alien = dto.alienState.aliens[0];

    expect('slots' in alien).toBe(false);
    expect('anomalyTokens' in alien).toBe(false);
    expect(alien.discoverySlots).toHaveLength(3);
    expect(alien.overflowSlots).toHaveLength(3);
    expect(alien.speciesTraceSlots).toEqual([]);
    expect(alien.anomalyColumns?.map((slot) => slot.slotId)).toEqual([
      'alien-0-anomaly-column|red-trace',
    ]);
    expect(dto.solarSystem?.alienTokens).toEqual([
      {
        tokenId: 'alien-0-anomaly-token|0|red-trace',
        alienType: EAlienType.ANOMALIES,
        sectorIndex: 0,
        traceColor: ETrace.RED,
        rewards: [{ type: 'VP', amount: 4 }],
      },
    ]);
  });

  it('projects undiscovered aliens with only discovery zones and overflow', () => {
    const game = createTestGame();
    game.hiddenAliens = [EAlienType.ANOMALIES];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.boards[0];
    if (!isAnomaliesAlienBoard(board)) {
      throw new Error('expected anomalies board');
    }
    board.addAnomalyColumn({
      slotId: 'alien-0-anomaly-column|red-trace',
      alienIndex: 0,
      traceColor: ETrace.RED,
      maxOccupants: -1,
      rewards: [],
      isDiscovery: false,
    });
    game.solarSystem?.addAlienToken({
      tokenId: 'alien-0-anomaly-token|0|red-trace',
      alienType: EAlienType.ANOMALIES,
      sectorIndex: 0,
      traceColor: ETrace.RED,
      rewards: [{ type: 'VP', amount: 4 }],
    });

    const publicState = projectGameState(game, game.activePlayer.id);
    const publicAlien = publicState.aliens[0];

    expect(publicAlien.alienType).toBeNull();
    expect(publicAlien).not.toHaveProperty('slots');
    expect(publicAlien.board).toBeNull();
    expect(publicAlien.cardZone).toBeNull();
    expect(publicAlien.discovery.zones.map((slot) => slot.slotId)).toEqual([
      'alien-0-discovery-red-trace',
      'alien-0-discovery-yellow-trace',
      'alien-0-discovery-blue-trace',
    ]);
    expect(
      publicAlien.discovery.overflowZones.map((slot) => slot.slotId),
    ).toEqual([
      'alien-0-overflow-red-trace',
      'alien-0-overflow-yellow-trace',
      'alien-0-overflow-blue-trace',
    ]);
    expect(
      publicAlien.discovery.overflowZones.every(
        (slot) => slot.maxOccupants === -1,
      ),
    ).toBe(true);
    expect(publicState.solarSystem.alienTokens).toEqual([]);
  });

  it('projects discovered Anomalies as board columns, solar tokens, and a card zone', () => {
    const game = createTestGame();
    game.hiddenAliens = [EAlienType.ANOMALIES];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.boards[0];
    if (!isAnomaliesAlienBoard(board)) {
      throw new Error('expected anomalies board');
    }
    board.discovered = true;
    board.alienDeckDrawPile = ['ET.12', 'ET.13'];
    board.alienDeckDiscardPile = ['ET.14'];
    board.faceUpAlienCardId = 'ET.11';

    for (const color of [ETrace.RED, ETrace.YELLOW, ETrace.BLUE]) {
      board.addAnomalyColumn({
        slotId: `alien-0-anomaly-column|${color}`,
        alienIndex: 0,
        traceColor: color,
        maxOccupants: -1,
        rewards: [],
        isDiscovery: false,
      });
    }
    game.solarSystem?.addAlienToken({
      tokenId: 'alien-0-anomaly-token|3|red-trace',
      alienType: EAlienType.ANOMALIES,
      sectorIndex: 3,
      traceColor: ETrace.RED,
      rewards: [{ type: 'VP', amount: 4 }],
    });

    const publicState = projectGameState(game, game.activePlayer.id);
    const publicAlien = publicState.aliens[0];

    expect(publicAlien).not.toHaveProperty('slots');
    expect(publicAlien.alienType).toBe(EAlienType.ANOMALIES);
    expect(publicAlien.cardZone).toEqual({
      faceUpCardId: 'ET.11',
      drawPileSize: 2,
      discardPileSize: 1,
    });
    if (!publicAlien.board || publicAlien.board.type !== 'anomalies') {
      throw new Error('expected anomalies public board');
    }
    expect(publicAlien.board.type).toBe('anomalies');
    expect(Object.keys(publicAlien.board.traceBoard.columns)).toEqual([
      ETrace.RED,
      ETrace.YELLOW,
      ETrace.BLUE,
    ]);
    expect(publicState.solarSystem.alienTokens).toEqual([
      {
        tokenId: 'alien-0-anomaly-token|3|red-trace',
        alienType: EAlienType.ANOMALIES,
        sectorIndex: 3,
        traceColor: ETrace.RED,
        rewards: [{ type: 'VP', amount: 4 }],
      },
    ]);
  });

  it('projects discovered Oumuamua tile state as a public board component', () => {
    const game = createTestGame();
    game.hiddenAliens = [EAlienType.OUMUAMUA];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.boards[0];
    if (!isOumuamuaAlienBoard(board)) {
      throw new Error('expected oumuamua board');
    }
    board.discovered = true;
    board.oumuamuaTile = {
      spaceId: 'ring-3-cell-5',
      sectorId: 'sector-2',
      dataRemaining: 2,
      markerPlayerIds: ['p1'],
    };

    const publicState = projectGameState(game, game.activePlayer.id);
    const publicAlien = publicState.aliens[0];

    expect(publicAlien.board).toMatchObject({
      type: 'oumuamua',
      tile: {
        spaceId: 'ring-3-cell-5',
        sectorId: 'sector-2',
        dataRemaining: 2,
        markerPlayerIds: ['p1'],
      },
    });
  });

  it('projects Mascamites capsules as generic solar-system movable pieces', () => {
    const game = createTestGame();
    game.hiddenAliens = [EAlienType.MASCAMITES];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.boards[0];
    if (!isMascamitesAlienBoard(board)) {
      throw new Error('expected Mascamites board');
    }
    board.discovered = true;
    board.createCapsule({
      capsuleId: 'capsule-1',
      ownerId: 'p1',
      sampleTokenId: 'mascamites-credit-2',
      sourcePlanet: EPlanet.JUPITER,
      spaceId: 'ring-2-cell-1',
    });

    const publicState = projectGameState(game, 'p1');

    expect(publicState.solarSystem.movablePieces).toContainEqual({
      pieceId: 'capsule-1',
      pieceType: 'mascamites-capsule',
      playerId: 'p1',
      spaceId: 'ring-2-cell-1',
      movementTarget: { type: 'mascamites-capsule', id: 'capsule-1' },
    });
  });

  it('projects Mascamites board without leaking hidden sample identities', () => {
    const game = createTestGame();
    game.hiddenAliens = [EAlienType.MASCAMITES];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.boards[0];
    if (!isMascamitesAlienBoard(board)) {
      throw new Error('expected Mascamites board');
    }
    board.discovered = true;
    board.samplePools.jupiter = ['mascamites-credit-2', 'mascamites-energy-2'];
    board.samplePools.saturn = ['mascamites-card-2'];
    board.publicSamples = ['mascamites-vp-7'];
    board.capsules = [
      {
        capsuleId: 'capsule-1',
        ownerId: 'p1',
        sampleTokenId: 'mascamites-credit-2',
        sourcePlanet: EPlanet.JUPITER,
        spaceId: 'ring-2-cell-1',
        missionCardId: 'ET.1',
      },
    ];
    board.deliveredSamples = [
      {
        sampleTokenId: 'mascamites-vp-7',
        deliveredBy: 'p2',
        deliveredAtRound: 3,
        slotId: 'alien-0-mascamites-sample-blue-0',
      },
    ];
    board.addTraceSlot({
      slotId: 'alien-0-mascamites-sample-blue-0',
      alienIndex: board.alienIndex,
      traceColor: ETrace.BLUE,
      maxOccupants: 1,
      rewards: [{ type: 'VP', amount: 7 }],
      isDiscovery: false,
    });

    const publicState = projectGameState(game, 'p1');
    const publicAlien = publicState.aliens[0];

    if (!publicAlien.board || publicAlien.board.type !== 'mascamites') {
      throw new Error('expected Mascamites public board');
    }
    expect(publicAlien.board.samplePools).toEqual({
      jupiter: 2,
      saturn: 1,
    });
    expect(publicAlien.board.publicSamples).toEqual(['mascamites-vp-7']);
    expect(publicAlien.board.capsules).toEqual([
      {
        capsuleId: 'capsule-1',
        ownerId: 'p1',
        sourcePlanet: EPlanet.JUPITER,
        spaceId: 'ring-2-cell-1',
        missionCardId: 'ET.1',
      },
    ]);
    expect(publicAlien.board.deliveredSamples).toEqual([
      {
        sampleTokenId: 'mascamites-vp-7',
        deliveredBy: 'p2',
        deliveredAtRound: 3,
        slotId: 'alien-0-mascamites-sample-blue-0',
      },
    ]);
    expect(publicAlien.board.traceSlots).toEqual([
      expect.objectContaining({
        slotId: 'alien-0-mascamites-sample-blue-0',
        traceColor: ETrace.BLUE,
      }),
    ]);
    expect(JSON.stringify(publicAlien.board)).not.toContain(
      'mascamites-credit-2',
    );
    expect(JSON.stringify(publicAlien.board)).not.toContain(
      'mascamites-energy-2',
    );
    expect(JSON.stringify(publicAlien.board)).not.toContain(
      'mascamites-card-2',
    );
  });

  it('projects Exertians face-down cards without leaking card ids or danger values', () => {
    const game = createTestGame();
    game.hiddenAliens = [EAlienType.EXERTIANS];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.boards[0];
    if (!isExertiansAlienBoard(board)) {
      throw new Error('expected Exertians board');
    }
    board.discovered = true;
    board.playFaceDownCard('p1', 'ET.52', 'discovery');
    board.playFaceDownCard('p2', 'ET.53', 'milestone-20');

    const publicState = projectGameState(game, 'p1');
    const publicAlien = publicState.aliens[0];

    if (!publicAlien.board || publicAlien.board.type !== 'exertians') {
      throw new Error('expected Exertians public board');
    }
    expect(publicAlien.board.faceDownCards).toEqual([
      { ownerId: 'p1', source: 'discovery', revealed: false },
      { ownerId: 'p2', source: 'milestone-20', revealed: false },
    ]);
    expect(JSON.stringify(publicAlien.board)).not.toContain('ET.52');
    expect(JSON.stringify(publicAlien.board)).not.toContain('danger');
  });

  it('projects revealed Exertians face-down cards with their card ids', () => {
    const game = createTestGame();
    game.hiddenAliens = [EAlienType.EXERTIANS];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.boards[0];
    if (!isExertiansAlienBoard(board)) {
      throw new Error('expected Exertians board');
    }
    board.discovered = true;
    const played = board.playFaceDownCard('p1', 'ET.52', 'discovery');
    played.revealed = true;

    const publicState = projectGameState(game, 'p1');
    const publicAlien = publicState.aliens[0];

    if (!publicAlien.board || publicAlien.board.type !== 'exertians') {
      throw new Error('expected Exertians public board');
    }
    expect(publicAlien.board.faceDownCards).toEqual([
      {
        ownerId: 'p1',
        source: 'discovery',
        revealed: true,
        cardId: 'ET.52',
      },
    ]);
  });

  it('projects Centaurians message milestones as public board state', () => {
    const game = createTestGame();
    game.hiddenAliens = [EAlienType.CENTAURIANS];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.boards[0];
    if (!isCentauriansAlienBoard(board)) {
      throw new Error('expected Centaurians board');
    }
    board.discovered = true;
    board.messageMilestones = [
      {
        playerId: 'p1',
        threshold: 27,
        sourceCardId: null,
        resolved: false,
      },
      {
        playerId: 'p2',
        threshold: 34,
        sourceCardId: 'ET.31',
        resolved: false,
      },
    ];
    board.pendingMessagesByPlayer = { p1: [], p2: ['ET.31'] };
    board.rewardSlots[0]!.claimedByPlayerId = 'p1';

    const publicState = projectGameState(game, 'p1');
    const publicAlien = publicState.aliens[0];

    if (!publicAlien.board || publicAlien.board.type !== 'centaurians') {
      throw new Error('expected Centaurians public board');
    }
    expect(publicAlien.board.messageMilestones).toEqual([
      {
        playerId: 'p1',
        threshold: 27,
        sourceCardId: null,
        resolved: false,
      },
      {
        playerId: 'p2',
        threshold: 34,
        sourceCardId: 'ET.31',
        resolved: false,
      },
    ]);
    expect(publicAlien.board.pendingMessagesByPlayer).toEqual({
      p1: [],
      p2: ['ET.31'],
    });
    expect(publicAlien.board.rewardSlots[0]).toEqual(
      expect.objectContaining({
        slotId: 'any-trace',
        claimedByPlayerId: 'p1',
      }),
    );
  });
});
