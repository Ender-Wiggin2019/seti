import {
  CORE_RANDOM_ALIEN_TYPES,
} from '@seti/common/constant/alienLobby';
import { EAlienMap } from '@seti/common/types/BaseCard';
import type {
  IDebugReplayPresetDefinition,
  IDebugReplaySessionMetadata,
  IDebugReplaySessionRequest,
} from '@seti/common/types/protocol/debug';
import { EAlienType, EPhase } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { ETrace } from '@seti/common/types/element';
import { AlienState } from '@/engine/alien/index.js';
import type { AlienBoard } from '@/engine/alien/AlienBoard.js';
import { EventLog } from '@/engine/event/EventLog.js';
import type { Game } from '@/engine/Game.js';

const ANOMALY_DISCOVERY_PRESET_ID = 'anomaly-discovery';
const BEFORE_END_TURN_CHECKPOINT_ID = 'before-end-turn';
const ANOMALY_TRIGGER_PRESET_ID = 'anomaly-trigger-resolution';
const BEFORE_PASS_ROTATION_CHECKPOINT_ID = 'before-pass-rotation';

interface IDebugReplayPreset {
  definition: IDebugReplayPresetDefinition;
  apply: (game: Game, request: IDebugReplaySessionRequest) => {
    phase: EPhase;
    summary: string;
    alienIndex: number;
    selectedAlienType: EAlienType;
    currentPlayerId: string;
  };
}

const DEBUG_REPLAY_PRESETS: Readonly<Record<string, IDebugReplayPreset>> = {
  [ANOMALY_DISCOVERY_PRESET_ID]: {
    definition: {
      id: ANOMALY_DISCOVERY_PRESET_ID,
      label: 'Alien Discovery Replay',
      description:
        'Prepare a game at the checkpoint right before alien discovery resolves.',
      fields: [
        {
          id: 'alienType',
          label: 'Alien',
          kind: 'select',
          required: true,
          options: CORE_RANDOM_ALIEN_TYPES.map((alienType) => ({
            value: String(alienType),
            label: toTitleCase(EAlienMap[alienType] ?? String(alienType)),
          })),
        },
      ],
      checkpoints: [
        {
          id: BEFORE_END_TURN_CHECKPOINT_ID,
          label: 'Before End Turn',
          description:
            'The selected alien board is fully marked and waiting for end turn to resolve discovery.',
        },
      ],
    },
    apply: applyAnomalyDiscoveryReplay,
  },
  [ANOMALY_TRIGGER_PRESET_ID]: {
    definition: {
      id: ANOMALY_TRIGGER_PRESET_ID,
      label: 'Anomaly Trigger Replay',
      description:
        'Prepare a discovered Anomalies board so the next PASS rotates Earth onto a token and resolves the reward.',
      fields: [
        {
          id: 'alienType',
          label: 'Alien',
          kind: 'select',
          required: true,
          options: [
            {
              value: String(EAlienType.ANOMALIES),
              label: toTitleCase(EAlienMap[EAlienType.ANOMALIES] ?? 'Anomalies'),
            },
          ],
        },
      ],
      checkpoints: [
        {
          id: BEFORE_PASS_ROTATION_CHECKPOINT_ID,
          label: 'Before Pass Rotation',
          description:
            'The next PASS rotates Earth onto an anomaly token and resolves its reward through the real action pipeline.',
        },
      ],
    },
    apply: applyAnomalyTriggerReplay,
  },
};

export function listDebugReplayPresets(): IDebugReplayPresetDefinition[] {
  return Object.values(DEBUG_REPLAY_PRESETS).map((preset) => preset.definition);
}

export function applyDebugReplayPreset(
  game: Game,
  request: IDebugReplaySessionRequest,
): IDebugReplaySessionMetadata {
  const preset = DEBUG_REPLAY_PRESETS[request.presetId];
  if (!preset) {
    throw new Error(`Unsupported replay preset: ${request.presetId}`);
  }

  const applied = preset.apply(game, request);

  return {
    presetId: request.presetId,
    checkpointId: request.checkpointId,
    currentPlayerId: applied.currentPlayerId,
    phase: applied.phase,
    summary: applied.summary,
    alienIndex: applied.alienIndex,
    selectedAlienType: applied.selectedAlienType,
  };
}

function applyAnomalyDiscoveryReplay(
  game: Game,
  request: IDebugReplaySessionRequest,
): {
  phase: EPhase;
  summary: string;
  alienIndex: number;
  selectedAlienType: EAlienType;
  currentPlayerId: string;
} {
  if (request.checkpointId !== BEFORE_END_TURN_CHECKPOINT_ID) {
    throw new Error(`Unsupported replay checkpoint: ${request.checkpointId}`);
  }

  const selectedAlienType = parseAlienType(request.fieldValues.alienType);
  const companionAlienType = CORE_RANDOM_ALIEN_TYPES.find(
    (alienType) => alienType !== selectedAlienType,
  );
  if (companionAlienType === undefined) {
    throw new Error('Could not resolve companion alien for replay preset');
  }

  game.hiddenAliens = [selectedAlienType, companionAlienType];
  game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);

  resolveSetupTucks(game);

  const activePlayer = game.getActivePlayer();
  const board = game.alienState.getBoardByType(selectedAlienType);
  if (!board) {
    throw new Error(`Alien board not found for type ${selectedAlienType}`);
  }

  for (const slot of board.getDiscoverySlots()) {
    if (slot.occupants.length > 0) {
      continue;
    }
    game.alienState.applyTraceToSlot(
      activePlayer,
      game,
      slot.slotId,
      slot.traceColor,
    );
  }

  game.phase = EPhase.AWAIT_END_TURN;

  activePlayer.waitingFor = undefined;
  game.eventLog = new EventLog();

  return {
    phase: game.phase,
    summary: `Replay ready: ${toTitleCase(EAlienMap[selectedAlienType] ?? 'alien')} discovery will resolve on end turn.`,
    alienIndex: board.alienIndex,
    selectedAlienType,
    currentPlayerId: activePlayer.id,
  };
}

function applyAnomalyTriggerReplay(
  game: Game,
  request: IDebugReplaySessionRequest,
): {
  phase: EPhase;
  summary: string;
  alienIndex: number;
  selectedAlienType: EAlienType;
  currentPlayerId: string;
} {
  if (request.checkpointId !== BEFORE_PASS_ROTATION_CHECKPOINT_ID) {
    throw new Error(`Unsupported replay checkpoint: ${request.checkpointId}`);
  }

  const selectedAlienType = parseAlienType(request.fieldValues.alienType);
  if (selectedAlienType !== EAlienType.ANOMALIES) {
    throw new Error('Anomaly trigger replay currently supports Anomalies only');
  }

  const companionAlienType = CORE_RANDOM_ALIEN_TYPES.find(
    (alienType) => alienType !== selectedAlienType,
  );
  if (companionAlienType === undefined) {
    throw new Error('Could not resolve companion alien for replay preset');
  }

  game.hiddenAliens = [selectedAlienType, companionAlienType];
  game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
  resolveSetupTucks(game);

  const activePlayer = game.getActivePlayer();
  trimHandForPass(activePlayer);
  const board = game.alienState.getBoardByType(EAlienType.ANOMALIES);
  if (!board) {
    throw new Error('Anomalies board not found for replay preset');
  }

  for (const slot of board.getDiscoverySlots()) {
    if (slot.occupants.length === 0) {
      game.alienState.applyTraceToSlot(
        activePlayer,
        game,
        slot.slotId,
        slot.traceColor,
      );
    }
  }

  const pluginInput = game.alienState.discoverAlien(board, game);
  if (pluginInput !== undefined) {
    activePlayer.waitingFor = pluginInput;
  }

  normalizeAnomalyTokensForTriggerReplay(board);

  const columnSlot = board.getSlot(
    buildAnomalyColumnSlotId(board.alienIndex, ETrace.RED),
  );
  if (!columnSlot) {
    throw new Error('Anomaly column slot missing for RED');
  }
  board.placeTrace(
    columnSlot,
    { playerId: activePlayer.id },
    ETrace.RED,
  );

  game.phase = EPhase.AWAIT_MAIN_ACTION;
  game.hasRoundFirstPassOccurred = false;
  activePlayer.waitingFor = undefined;
  game.eventLog = new EventLog();

  return {
    phase: game.phase,
    summary:
      'Replay ready: PASS will rotate Earth onto a prepared anomaly token and resolve the reward.',
    alienIndex: board.alienIndex,
    selectedAlienType,
    currentPlayerId: activePlayer.id,
  };
}

function parseAlienType(rawAlienType: string | undefined): EAlienType {
  const alienType = Number(rawAlienType);
  if (!CORE_RANDOM_ALIEN_TYPES.includes(alienType as EAlienType)) {
    throw new Error(`Unsupported alienType for replay preset: ${rawAlienType}`);
  }
  return alienType as EAlienType;
}

function resolveSetupTucks(game: Game): void {
  for (const player of game.players) {
    while (player.waitingFor) {
      const model = player.waitingFor.toModel();
      if (model.type !== EPlayerInputType.CARD || model.cards.length === 0) {
        player.waitingFor = undefined;
        player.pendingSetupTucks = 0;
        break;
      }

      game.processInput(player.id, {
        type: EPlayerInputType.CARD,
        cardIds: [model.cards[0].id],
      });
    }
  }
}

function buildAnomalyColumnSlotId(alienIndex: number, color: string): string {
  return `alien-${alienIndex}-anomaly-column|${color}`;
}

function normalizeAnomalyTokensForTriggerReplay(
  board: AlienBoard,
): void {
  const existingTokenSlots = board.slots.filter((slot) =>
    slot.slotId.includes('anomaly-token'),
  );
  const templateRewards =
    existingTokenSlots[0]?.rewards.map((reward) => ({ ...reward })) ?? [
      { type: 'VP' as const, amount: 2 },
    ];

  for (let index = board.slots.length - 1; index >= 0; index -= 1) {
    if (board.slots[index]?.slotId.includes('anomaly-token')) {
      board.slots.splice(index, 1);
    }
  }

  for (let sectorIndex = 0; sectorIndex < 8; sectorIndex += 1) {
    board.addSlot({
      slotId: `alien-${board.alienIndex}-anomaly-token|${sectorIndex}|${ETrace.RED}`,
      alienIndex: board.alienIndex,
      traceColor: ETrace.RED,
      maxOccupants: 0,
      rewards: templateRewards.map((reward) => ({ ...reward })),
      isDiscovery: false,
    });
  }
}

function trimHandForPass(player: Game['players'][number]): void {
  while (player.hand.length > player.handLimitAfterPass) {
    player.hand.pop();
  }
}

function toTitleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
