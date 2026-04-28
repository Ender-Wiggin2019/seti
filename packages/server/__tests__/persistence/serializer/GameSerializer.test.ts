import { getAvailableMainActions } from '@seti/common/rules';
import {
  EAlienType,
  EMainAction,
  EPlanet,
  ETrace,
} from '@seti/common/types/protocol/enums';
import {
  isAnomaliesAlienBoard,
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

describe('GameSerializer', () => {
  it('serializes core state and RNG snapshot', () => {
    const game = createTestGame();
    const dto = serializeGame(game, 7);

    expect(dto.gameId).toBe(game.id);
    expect(dto.version).toBe(7);
    expect(dto.seed).toBe(game.seed);
    expect(typeof dto.rngState).toBe('number');
    expect(dto.players).toHaveLength(2);
    expect(dto.mainDeck.drawPile.length + dto.mainDeck.discardPile.length).toBe(
      game.mainDeck.totalSize,
    );
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
});
