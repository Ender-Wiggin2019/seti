import { ETech } from '@seti/common/types/element';
import { EAlienType } from '@seti/common/types/protocol/enums';
import type { TPublicSlotReward } from '@seti/common/types/protocol/gameState';
import {
  ERivalObjectiveTrigger,
  TRivalActionCardId,
  type TRivalBoardConfigId,
  TRivalObjectiveId,
  type TRivalObjectiveTriggerKey,
  TSoloDifficulty,
} from '@seti/common/types/protocol/solo';
import type { TTechCategory } from '@seti/common/types/tech';

export interface IRivalObjectiveStackComposition {
  level1: number;
  level2: number;
  level3: number;
}

export interface IRivalBoardConfig {
  difficulty: TSoloDifficulty;
  boardConfigId: TRivalBoardConfigId;
  initialProgress: number;
  objectiveStack: IRivalObjectiveStackComposition;
}

export enum ERivalObjectiveTaskKind {
  MIN_SCORE = 'min-score',
  MIN_DATA_POOL = 'min-data-pool',
  MIN_PUBLICITY = 'min-publicity',
  TRIGGER = 'trigger',
}

export interface IRivalObjectiveTaskDefinition {
  kind: ERivalObjectiveTaskKind;
  amount?: number;
  triggerKey?: TRivalObjectiveTriggerKey;
}

export interface IRivalObjectiveDefinition {
  id: TRivalObjectiveId;
  level: keyof IRivalObjectiveStackComposition;
  tasks: readonly IRivalObjectiveTaskDefinition[];
}

export const SOLO_DIFFICULTIES: readonly TSoloDifficulty[] = [1, 2, 3, 4, 5];

const LEGACY_RIVAL_BOARD_CONFIG_IDS: Record<string, TRivalBoardConfigId> = {
  automaBoard1: 'rival-board-1',
  automaBoard2: 'rival-board-2',
  automaBoard3: 'rival-board-3',
  automaBoard4: 'rival-board-4',
};

export function normalizeRivalBoardConfigId(
  boardConfigId: string,
): TRivalBoardConfigId {
  if (boardConfigId in LEGACY_RIVAL_BOARD_CONFIG_IDS) {
    return LEGACY_RIVAL_BOARD_CONFIG_IDS[boardConfigId];
  }
  if (
    boardConfigId === 'rival-board-1' ||
    boardConfigId === 'rival-board-2' ||
    boardConfigId === 'rival-board-3' ||
    boardConfigId === 'rival-board-4'
  ) {
    return boardConfigId;
  }
  return 'rival-board-1';
}

export const RIVAL_COMPUTER_SLOT_REWARDS: readonly (TPublicSlotReward | null)[] =
  [
    null,
    { type: 'PUBLICITY', amount: 1 },
    null,
    { type: 'CUSTOM', effectId: 'RIVAL_PROGRESS_4' },
    null,
    null,
  ];

export const RIVAL_BOARD_CONFIGS: Record<TSoloDifficulty, IRivalBoardConfig> = {
  1: {
    difficulty: 1,
    boardConfigId: 'rival-board-1',
    initialProgress: 0,
    objectiveStack: { level1: 0, level2: 0, level3: 0 },
  },
  2: {
    difficulty: 2,
    boardConfigId: 'rival-board-1',
    initialProgress: 0,
    objectiveStack: { level1: 2, level2: 3, level3: 5 },
  },
  3: {
    difficulty: 3,
    boardConfigId: 'rival-board-2',
    initialProgress: 12,
    objectiveStack: { level1: 2, level2: 4, level3: 6 },
  },
  4: {
    difficulty: 4,
    boardConfigId: 'rival-board-3',
    initialProgress: 15,
    objectiveStack: { level1: 2, level2: 6, level3: 7 },
  },
  5: {
    difficulty: 5,
    boardConfigId: 'rival-board-4',
    initialProgress: 19,
    objectiveStack: { level1: 2, level2: 7, level3: 8 },
  },
};

export const RIVAL_TECH_CATEGORY_ORDER_BY_BOARD: Record<
  TRivalBoardConfigId,
  readonly TTechCategory[]
> = {
  'rival-board-1': [ETech.COMPUTER, ETech.SCAN, ETech.PROBE],
  'rival-board-2': [ETech.SCAN, ETech.PROBE, ETech.COMPUTER],
  'rival-board-3': [ETech.COMPUTER, ETech.SCAN, ETech.PROBE],
  'rival-board-4': [ETech.PROBE, ETech.COMPUTER, ETech.SCAN],
};

export const RIVAL_SPECIES_ACTION_CARD_BY_ALIEN: Partial<
  Record<EAlienType, TRivalActionCardId>
> = {
  [EAlienType.MASCAMITES]: 'S.15',
  [EAlienType.ANOMALIES]: 'S.16',
  [EAlienType.OUMUAMUA]: 'S.17',
  [EAlienType.CENTAURIANS]: 'S.18',
  [EAlienType.EXERTIANS]: 'S.19',
};

export const RIVAL_OBJECTIVE_IDS_BY_LEVEL: Record<
  keyof IRivalObjectiveStackComposition,
  readonly TRivalObjectiveId[]
> = {
  level1: ['SOLO.1', 'SOLO.2', 'SOLO.3', 'SOLO.4'],
  level2: [
    'SOLO.5',
    'SOLO.6',
    'SOLO.7',
    'SOLO.8',
    'SOLO.9',
    'SOLO.10',
    'SOLO.11',
    'SOLO.12',
    'SOLO.13',
    'SOLO.14',
    'SOLO.15',
  ],
  level3: [
    'SOLO.16',
    'SOLO.17',
    'SOLO.18',
    'SOLO.19',
    'SOLO.20',
    'SOLO.21',
    'SOLO.22',
    'SOLO.23',
    'SOLO.24',
  ],
};

const trigger = (
  triggerKey: TRivalObjectiveTriggerKey,
): IRivalObjectiveTaskDefinition => ({
  kind: ERivalObjectiveTaskKind.TRIGGER,
  triggerKey,
});

const either = (
  ...triggerKeys: readonly ERivalObjectiveTrigger[]
): IRivalObjectiveTaskDefinition => trigger(`either:${triggerKeys.join('|')}`);

export const RIVAL_OBJECTIVE_DEFINITIONS: readonly IRivalObjectiveDefinition[] =
  [
    {
      id: 'SOLO.1',
      level: 'level1',
      tasks: [{ kind: ERivalObjectiveTaskKind.MIN_SCORE, amount: 16 }],
    },
    {
      id: 'SOLO.2',
      level: 'level1',
      tasks: [
        either(
          ERivalObjectiveTrigger.PROBE_LANDED,
          ERivalObjectiveTrigger.SECTOR_DOMINANCE,
        ),
      ],
    },
    {
      id: 'SOLO.3',
      level: 'level1',
      tasks: [{ kind: ERivalObjectiveTaskKind.MIN_DATA_POOL, amount: 5 }],
    },
    {
      id: 'SOLO.4',
      level: 'level1',
      tasks: [{ kind: ERivalObjectiveTaskKind.MIN_PUBLICITY, amount: 9 }],
    },
    {
      id: 'SOLO.5',
      level: 'level2',
      tasks: [
        trigger(ERivalObjectiveTrigger.TECH_PROBE),
        trigger(ERivalObjectiveTrigger.MISSION_COMPLETED),
      ],
    },
    {
      id: 'SOLO.6',
      level: 'level2',
      tasks: [
        trigger(ERivalObjectiveTrigger.TECH_COMPUTER),
        trigger(ERivalObjectiveTrigger.TRACE_BLUE),
      ],
    },
    {
      id: 'SOLO.7',
      level: 'level2',
      tasks: [
        trigger(ERivalObjectiveTrigger.PROBE_VISITED_ASTEROIDS),
        trigger(ERivalObjectiveTrigger.TRACE_BLUE),
      ],
    },
    {
      id: 'SOLO.8',
      level: 'level2',
      tasks: [
        either(
          ERivalObjectiveTrigger.SECTOR_DOMINANCE_YELLOW,
          ERivalObjectiveTrigger.SECTOR_DOMINANCE_RED,
        ),
      ],
    },
    {
      id: 'SOLO.9',
      level: 'level2',
      tasks: [
        either(
          ERivalObjectiveTrigger.SECTOR_DOMINANCE_YELLOW,
          ERivalObjectiveTrigger.SECTOR_DOMINANCE_BLUE,
        ),
      ],
    },
    {
      id: 'SOLO.10',
      level: 'level2',
      tasks: [
        either(
          ERivalObjectiveTrigger.SECTOR_DOMINANCE_BLUE,
          ERivalObjectiveTrigger.SECTOR_DOMINANCE_RED,
        ),
      ],
    },
    {
      id: 'SOLO.11',
      level: 'level2',
      tasks: [
        either(
          ERivalObjectiveTrigger.PLANET_VENUS,
          ERivalObjectiveTrigger.PLANET_MERCURY,
        ),
      ],
    },
    {
      id: 'SOLO.12',
      level: 'level2',
      tasks: [
        either(
          ERivalObjectiveTrigger.PLANET_JUPITER,
          ERivalObjectiveTrigger.PLANET_SATURN,
        ),
      ],
    },
    {
      id: 'SOLO.13',
      level: 'level2',
      tasks: [
        either(
          ERivalObjectiveTrigger.PLANET_MARS,
          ERivalObjectiveTrigger.PLANET_NEPTUNE,
          ERivalObjectiveTrigger.PLANET_URANUS,
        ),
      ],
    },
    {
      id: 'SOLO.14',
      level: 'level2',
      tasks: [
        trigger(ERivalObjectiveTrigger.TECH_SCAN),
        trigger(ERivalObjectiveTrigger.MISSION_COMPLETED),
      ],
    },
    {
      id: 'SOLO.15',
      level: 'level2',
      tasks: [
        trigger(ERivalObjectiveTrigger.PROBE_VISITED_COMET),
        trigger(ERivalObjectiveTrigger.CARD_COST_3),
      ],
    },
    {
      id: 'SOLO.16',
      level: 'level3',
      tasks: [
        trigger(ERivalObjectiveTrigger.PROBE_LAUNCHED),
        { kind: ERivalObjectiveTaskKind.MIN_PUBLICITY, amount: 9 },
      ],
    },
    {
      id: 'SOLO.17',
      level: 'level3',
      tasks: [
        trigger(ERivalObjectiveTrigger.TRACE_BLUE),
        trigger(ERivalObjectiveTrigger.TRACE_BLUE),
      ],
    },
    {
      id: 'SOLO.18',
      level: 'level3',
      tasks: [
        trigger(ERivalObjectiveTrigger.TECH_PROBE),
        trigger(ERivalObjectiveTrigger.PROBE_LANDED),
      ],
    },
    {
      id: 'SOLO.19',
      level: 'level3',
      tasks: [trigger(ERivalObjectiveTrigger.SECTOR_DOMINANCE_BLACK)],
    },
    {
      id: 'SOLO.20',
      level: 'level3',
      tasks: [trigger(ERivalObjectiveTrigger.PROBE_ORBITED)],
    },
    {
      id: 'SOLO.21',
      level: 'level3',
      tasks: [
        trigger(ERivalObjectiveTrigger.TECH_COMPUTER),
        trigger(ERivalObjectiveTrigger.TECH_ANY),
      ],
    },
    {
      id: 'SOLO.22',
      level: 'level3',
      tasks: [
        trigger(ERivalObjectiveTrigger.PROBE_LAUNCHED),
        trigger(ERivalObjectiveTrigger.SCAN_PERFORMED),
        trigger(ERivalObjectiveTrigger.TRACE_BLUE),
      ],
    },
    {
      id: 'SOLO.23',
      level: 'level3',
      tasks: [
        trigger(ERivalObjectiveTrigger.SCAN_PERFORMED),
        trigger(ERivalObjectiveTrigger.SCAN_PERFORMED),
      ],
    },
    {
      id: 'SOLO.24',
      level: 'level3',
      tasks: [
        trigger(ERivalObjectiveTrigger.TECH_SCAN),
        trigger(ERivalObjectiveTrigger.SECTOR_DOMINANCE),
      ],
    },
  ];
