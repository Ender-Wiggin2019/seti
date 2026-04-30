import type { IComputerColumnConfig } from '@seti/common/types/computer';
import {
  EAlienType,
  EMainAction,
  ETrace,
} from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { AnalyzeDataAction } from '@/engine/actions/AnalyzeData.js';
import { isAnomaliesAlienBoard } from '@/engine/alien/AlienBoard.js';
import { AlienState } from '@/engine/alien/AlienState.js';
import { PlaceDataFreeAction } from '@/engine/freeActions/PlaceData.js';
import { Game } from '@/engine/Game.js';
import type { IGame } from '@/engine/IGame.js';
import { EComputerRow } from '@/engine/player/Computer.js';
import { Player } from '@/engine/player/Player.js';
import { resolveSetupTucks } from '../../helpers/TestGameBuilder.js';
import { placeTraceForTestSetup } from '../../helpers/traceTestUtils.js';

const SIMPLE_3_COL: IComputerColumnConfig[] = [
  { topReward: null, techSlotAvailable: true },
  { topReward: null, techSlotAvailable: true },
  { topReward: null, techSlotAvailable: true },
];

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createMockGame(): IGame {
  return {
    solarSystem: null,
    planetaryBoard: null,
    techBoard: null,
    sectors: [],
    mainDeck: {
      drawWithReshuffle: () => undefined,
      discard: () => undefined,
    },
    cardRow: [],
    endOfRoundStacks: [],
    hiddenAliens: [],
    neutralMilestones: [],
    roundRotationReminderIndex: 0,
    hasRoundFirstPassOccurred: false,
    rotationCounter: 0,
  } as unknown as IGame;
}

function createPlayer(overrides: Record<string, unknown> = {}): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { credits: 4, energy: 3, publicity: 4 },
    computerColumnConfigs: SIMPLE_3_COL,
    ...overrides,
  });
}

function fillTopComputer(player: Player): void {
  for (let i = 0; i < player.computer.columnCount; i += 1) {
    player.computer.placeData({ row: EComputerRow.TOP, index: i });
  }
}

function createIntegrationGame(seed: string) {
  const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, seed, seed);
  resolveSetupTucks(game);
  const player = game.players.find((candidate) => candidate.id === 'p1');
  if (!player) {
    throw new Error('p1 not found');
  }
  return { game, player: player as Player };
}

describe('AnalyzeDataAction', () => {
  describe('canExecute', () => {
    it('returns true when computer is full and energy >= 1', () => {
      const game = createMockGame();
      const player = createPlayer();
      fillTopComputer(player);
      expect(AnalyzeDataAction.canExecute(player, game)).toBe(true);
    });

    it('returns false when computer is not full', () => {
      const game = createMockGame();
      const player = createPlayer();
      expect(AnalyzeDataAction.canExecute(player, game)).toBe(false);
    });

    it('returns false when there is no energy', () => {
      const game = createMockGame();
      const player = createPlayer({
        resources: { credits: 4, energy: 0, publicity: 4 },
      });
      fillTopComputer(player);
      expect(AnalyzeDataAction.canExecute(player, game)).toBe(false);
    });

    it('returns false when computer is only partially full', () => {
      const game = createMockGame();
      const player = createPlayer();
      player.computer.placeData({ row: EComputerRow.TOP, index: 0 });
      player.computer.placeData({ row: EComputerRow.TOP, index: 1 });
      expect(AnalyzeDataAction.canExecute(player, game)).toBe(false);
    });

    it('returns true with exactly 1 energy when computer is full', () => {
      const game = createMockGame();
      const player = createPlayer({
        resources: { credits: 4, energy: 1, publicity: 4 },
      });
      fillTopComputer(player);
      expect(AnalyzeDataAction.canExecute(player, game)).toBe(true);
    });
  });

  describe('execute', () => {
    it('spends 1 energy', () => {
      const game = createMockGame();
      const player = createPlayer({
        resources: { credits: 4, energy: 3, publicity: 4 },
      });
      fillTopComputer(player);
      const before = player.resources.energy;
      AnalyzeDataAction.execute(player, game);
      expect(player.resources.energy).toBe(before - 1);
    });

    it('clears computer data', () => {
      const game = createMockGame();
      const player = createPlayer();
      fillTopComputer(player);
      AnalyzeDataAction.execute(player, game);
      expect(player.computer.getPlacedCount()).toBe(0);
      expect(player.computer.isFull()).toBe(false);
    });

    it('returns dataCleared count matching placed data before clear', () => {
      const game = createMockGame();
      const player = createPlayer();
      fillTopComputer(player);
      const result = AnalyzeDataAction.execute(player, game);
      expect(result.dataCleared).toBe(3);
    });

    it('throws when the action is illegal', () => {
      const game = createMockGame();
      const player = createPlayer();
      expect(() => AnalyzeDataAction.execute(player, game)).toThrow();
    });

    it('integration: analyze data clears the connected computer and prompts for a blue trace placement', () => {
      const { game, player } = createIntegrationGame('analyze-data-blue-trace');
      fillTopComputer(player);
      const energyBefore = player.resources.energy;

      game.processMainAction(player.id, { type: EMainAction.ANALYZE_DATA });

      expect(player.resources.energy).toBe(energyBefore - 1);
      expect(player.computer.getPlacedCount()).toBe(0);
      expect(player.waitingFor?.toModel().type).toBe(EPlayerInputType.OPTION);
    });

    it('integration: analyze data leaves the data pool and stash untouched while clearing computer data', () => {
      const { game, player } = createIntegrationGame(
        'analyze-data-pool-unchanged',
      );
      player.resources.gain({ data: 2 });
      fillTopComputer(player);
      const dataStateBefore = player.data.getState();

      game.processMainAction(player.id, { type: EMainAction.ANALYZE_DATA });

      expect(player.dataPool.count).toBe(dataStateBefore.pool);
      expect(player.data.getState().stash).toBe(dataStateBefore.stash);
      expect(player.computer.getPlacedCount()).toBe(0);
      expect(player.data.getState().computer).toBe(0);
    });

    it('integration: choosing a blue discovery slot grants +5 VP and +1 publicity on the left alien board', () => {
      const { game, player } = createIntegrationGame(
        'analyze-data-discovery-reward',
      );
      fillTopComputer(player);
      const scoreBefore = player.score;
      const publicityBefore = player.resources.publicity;

      game.processMainAction(player.id, { type: EMainAction.ANALYZE_DATA });

      const optionModel = player.waitingFor?.toModel() as {
        type: EPlayerInputType;
        options: Array<{ id: string }>;
      };
      const discoverySlotId = `alien-0-discovery-${ETrace.BLUE}`;
      expect(
        optionModel.options.some((option) => option.id === discoverySlotId),
      ).toBe(true);

      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: discoverySlotId,
      });

      expect(player.score).toBe(scoreBefore + 5);
      expect(player.resources.publicity).toBe(publicityBefore + 1);
    });

    it('integration: when blue discovery slots are occupied, analyze data falls back to overflow placement', () => {
      const { game, player } = createIntegrationGame(
        'analyze-data-overflow-choice',
      );
      const otherPlayer = game.players[1] as Player;

      placeTraceForTestSetup(
        game.alienState,
        otherPlayer,
        game,
        ETrace.BLUE,
        0,
      );
      placeTraceForTestSetup(
        game.alienState,
        otherPlayer,
        game,
        ETrace.BLUE,
        1,
      );
      fillTopComputer(player);
      const scoreBefore = player.score;
      const publicityBefore = player.resources.publicity;

      game.processMainAction(player.id, { type: EMainAction.ANALYZE_DATA });

      const optionModel = player.waitingFor?.toModel() as {
        type: EPlayerInputType;
        options: Array<{ id: string }>;
      };
      expect(
        optionModel.options.some((option) =>
          option.id.endsWith(`discovery-${ETrace.BLUE}`),
        ),
      ).toBe(false);
      expect(
        optionModel.options.some(
          (option) => option.id === `alien-0-overflow-${ETrace.BLUE}`,
        ),
      ).toBe(true);
      expect(
        optionModel.options.some(
          (option) => option.id === `alien-1-overflow-${ETrace.BLUE}`,
        ),
      ).toBe(true);

      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: `alien-0-overflow-${ETrace.BLUE}`,
      });

      expect(player.score).toBe(scoreBefore + 3);
      expect(player.resources.publicity).toBe(publicityBefore);
    });

    it('integration: top row can be full while bottom slots stay empty and the action remains legal', () => {
      const { game, player } = createIntegrationGame(
        'analyze-data-bottom-empty',
      );
      player.computer.placeTech(0, {
        techId: 'comp-0' as never,
        bottomReward: { credits: 1 },
      });
      fillTopComputer(player);

      expect(player.computer.getBottomSlotStates()[0]).toBe(false);
      expect(AnalyzeDataAction.canExecute(player, game)).toBe(true);
    });

    it('integration: after analyze data clears the computer, the player can immediately place new data', () => {
      const { game, player } = createIntegrationGame('analyze-data-place-next');
      player.resources.gain({ data: 1 });
      fillTopComputer(player);

      game.processMainAction(player.id, { type: EMainAction.ANALYZE_DATA });
      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: `alien-0-discovery-${ETrace.BLUE}`,
      });

      expect(PlaceDataFreeAction.canExecute(player, game)).toBe(true);
      const placeResult = PlaceDataFreeAction.execute(player, game);
      expect(placeResult.row).toBe('top');
      expect(placeResult.index).toBe(0);
      expect(player.computer.getPlacedCount()).toBe(1);
    });

    it('integration: completing Anomalies discovery via analyze data applies the discovery plugin effect', () => {
      const { game, player } = createIntegrationGame('seed-16');
      game.hiddenAliens = [EAlienType.ANOMALIES, EAlienType.CENTAURIANS];
      game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);

      placeTraceForTestSetup(game.alienState, player, game, ETrace.RED, 0);
      placeTraceForTestSetup(game.alienState, player, game, ETrace.YELLOW, 0);
      fillTopComputer(player);

      game.processMainAction(player.id, { type: EMainAction.ANALYZE_DATA });

      const optionModel = player.waitingFor?.toModel() as {
        type: EPlayerInputType;
        options: Array<{ id: string }>;
      };
      const blueDiscoverySlotId = `alien-0-discovery-${ETrace.BLUE}`;

      expect(optionModel.type).toBe(EPlayerInputType.OPTION);
      expect(
        optionModel.options.some((option) => option.id === blueDiscoverySlotId),
      ).toBe(true);

      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: blueDiscoverySlotId,
      });
      game.processEndTurn(player.id);

      const anomaliesBoard = game.alienState.getBoard(0);
      expect(anomaliesBoard?.discovered).toBe(true);
      expect(isAnomaliesAlienBoard(anomaliesBoard)).toBe(true);
      expect(
        anomaliesBoard?.slots.some((slot) =>
          slot.slotId.includes('anomaly-column'),
        ),
      ).toBe(true);
      if (!isAnomaliesAlienBoard(anomaliesBoard)) {
        throw new Error('expected anomalies board');
      }
      expect(
        game.solarSystem?.getAlienTokensByType(EAlienType.ANOMALIES).length,
      ).toBeGreaterThan(0);
    });

    it('returns false when the computer is completely empty', () => {
      const game = createMockGame();
      const player = createPlayer();

      expect(player.computer.getPlacedCount()).toBe(0);
      expect(AnalyzeDataAction.canExecute(player, game)).toBe(false);
    });
  });
});
