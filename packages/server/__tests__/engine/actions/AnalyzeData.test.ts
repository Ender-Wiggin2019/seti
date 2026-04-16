import type { IComputerColumnConfig } from '@seti/common/types/computer';
import {
  EAlienType,
  EMainAction,
  ETrace,
} from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { AnalyzeDataAction } from '@/engine/actions/AnalyzeData.js';
import { Game } from '@/engine/Game.js';
import type { IGame } from '@/engine/IGame.js';
import { EComputerRow } from '@/engine/player/Computer.js';
import { Player } from '@/engine/player/Player.js';

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
    mainDeck: { draw: () => undefined, discard: () => undefined },
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

    it('integration: completing Anomalies discovery via analyze data applies the discovery plugin effect', () => {
      const { game, player } = createIntegrationGame('seed-16');
      expect(game.hiddenAliens[0]).toBe(EAlienType.ANOMALIES);

      game.alienState.applyTrace(player, game, ETrace.RED, 0, false);
      game.alienState.applyTrace(player, game, ETrace.YELLOW, 0, false);
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

      const anomaliesBoard = game.alienState.getBoard(0);
      expect(anomaliesBoard?.discovered).toBe(true);
      expect(
        anomaliesBoard?.slots.some((slot) =>
          slot.slotId.includes('anomaly-column'),
        ),
      ).toBe(true);
      expect(
        anomaliesBoard?.slots.some((slot) =>
          slot.slotId.includes('anomaly-token'),
        ),
      ).toBe(true);
    });
  });
});
