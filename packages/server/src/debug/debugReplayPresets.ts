import { CORE_RANDOM_ALIEN_TYPES } from '@seti/common/constant/alienLobby';
import { EAlienMap } from '@seti/common/types/BaseCard';
import { ETrace } from '@seti/common/types/element';
import type {
  IDebugReplayPresetDefinition,
  IDebugReplaySessionMetadata,
  IDebugReplaySessionRequest,
} from '@seti/common/types/protocol/debug';
import { EAlienType, EPhase } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import {
  type AnomaliesAlienBoard,
  isAnomaliesAlienBoard,
  isCentauriansAlienBoard,
  isExertiansAlienBoard,
  isMascamitesAlienBoard,
} from '@/engine/alien/AlienBoard.js';
import { AlienState } from '@/engine/alien/index.js';
import { OumuamuaAlienPlugin } from '@/engine/alien/plugins/OumuamuaAlienPlugin.js';
import { EventLog } from '@/engine/event/EventLog.js';
import type { Game } from '@/engine/Game.js';
import {
  applyDeliverSampleScenario,
  applySpendSignalTokenScenario,
} from '@/testing/behaviorFlowScenario.js';

const ANOMALY_DISCOVERY_PRESET_ID = 'anomaly-discovery';
const BEFORE_END_TURN_CHECKPOINT_ID = 'before-end-turn';
const ANOMALY_TRIGGER_PRESET_ID = 'anomaly-trigger-resolution';
const BEFORE_PASS_ROTATION_CHECKPOINT_ID = 'before-pass-rotation';
const OUMUAMUA_PRESET_ID = 'oumuamua-debug';
const AFTER_OUMUAMUA_TILE_SIGNAL_CHECKPOINT_ID = 'after-tile-signal';
const OUMUAMUA_TRACE_COLUMNS_CHECKPOINT_ID = 'trace-columns';
const CENTAURIANS_PRESET_ID = 'centaurians-debug';
const CENTAURIANS_AFTER_DISCOVERY_CHECKPOINT_ID = 'after-discovery';
const EXERTIANS_PRESET_ID = 'exertians-debug';
const EXERTIANS_AFTER_DISCOVERY_CHECKPOINT_ID = 'after-discovery';
const MASCAMITES_PRESET_ID = 'mascamites-debug';
const MASCAMITES_AFTER_DISCOVERY_CHECKPOINT_ID = 'after-discovery';
const FREE_ACTION_PRESET_ID = 'free-action-debug';
const FREE_ACTION_SPEND_SIGNAL_TOKEN_CHECKPOINT_ID = 'spend-signal-token';
const FREE_ACTION_DELIVER_SAMPLE_CHECKPOINT_ID = 'deliver-sample';

interface IDebugReplayPreset {
  definition: IDebugReplayPresetDefinition;
  apply: (
    game: Game,
    request: IDebugReplaySessionRequest,
  ) => {
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
              label: toTitleCase(
                EAlienMap[EAlienType.ANOMALIES] ?? 'Anomalies',
              ),
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
  [OUMUAMUA_PRESET_ID]: {
    definition: {
      id: OUMUAMUA_PRESET_ID,
      label: 'Oumuamua Replay',
      description:
        'Prepare a discovered Oumuamua board with its tile, exofossils, and trace columns available for debugging.',
      fields: [],
      checkpoints: [
        {
          id: AFTER_OUMUAMUA_TILE_SIGNAL_CHECKPOINT_ID,
          label: 'After Tile Signal',
          description:
            'The Oumuamua tile has one player signal and two data remaining.',
        },
        {
          id: OUMUAMUA_TRACE_COLUMNS_CHECKPOINT_ID,
          label: 'Trace Columns',
          description:
            'The Oumuamua trace columns are initialized and the active player has exofossils to spend.',
        },
      ],
    },
    apply: applyOumuamuaReplay,
  },
  [CENTAURIANS_PRESET_ID]: {
    definition: {
      id: CENTAURIANS_PRESET_ID,
      label: 'Centaurians Replay',
      description:
        'Prepare a discovered Centaurians board with message milestones and reward slots initialized.',
      fields: [],
      checkpoints: [
        {
          id: CENTAURIANS_AFTER_DISCOVERY_CHECKPOINT_ID,
          label: 'After Discovery',
          description:
            'Centaurians is discovered and ready for message/milestone debugging.',
        },
      ],
    },
    apply: applyCentauriansReplay,
  },
  [EXERTIANS_PRESET_ID]: {
    definition: {
      id: EXERTIANS_PRESET_ID,
      label: 'Exertians Replay',
      description:
        'Prepare a discovered Exertians board with danger tiers and milestone tracks initialized.',
      fields: [],
      checkpoints: [
        {
          id: EXERTIANS_AFTER_DISCOVERY_CHECKPOINT_ID,
          label: 'After Discovery',
          description:
            'Exertians is discovered and ready for face-down/milestone debugging.',
        },
      ],
    },
    apply: applyExertiansReplay,
  },
  [MASCAMITES_PRESET_ID]: {
    definition: {
      id: MASCAMITES_PRESET_ID,
      label: 'Mascamites Replay',
      description:
        'Prepare a discovered Mascamites board with sample pools initialized for collection and delivery debugging.',
      fields: [],
      checkpoints: [
        {
          id: MASCAMITES_AFTER_DISCOVERY_CHECKPOINT_ID,
          label: 'After Discovery',
          description:
            'Mascamites sample pools are seeded and ready for capsule workflows.',
        },
      ],
    },
    apply: applyMascamitesReplay,
  },
  [FREE_ACTION_PRESET_ID]: {
    definition: {
      id: FREE_ACTION_PRESET_ID,
      label: 'Free Action Replay',
      description:
        'Prepare long setup states for special free-action UI coverage without exposing public lobby scenario presets.',
      fields: [],
      checkpoints: [
        {
          id: FREE_ACTION_SPEND_SIGNAL_TOKEN_CHECKPOINT_ID,
          label: 'Spend Signal Token',
          description:
            'The active player has a signal token and can enter SCAN before spending it through the real UI.',
        },
        {
          id: FREE_ACTION_DELIVER_SAMPLE_CHECKPOINT_ID,
          label: 'Deliver Sample',
          description:
            'Mascamites is discovered and the active player has one deliverable sample capsule.',
        },
      ],
    },
    apply: applyFreeActionReplay,
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
  if (!isAnomaliesAlienBoard(board)) {
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

  normalizeAnomalyTokensForTriggerReplay(game, board);

  const columnSlot = board.getSlot(
    buildAnomalyColumnSlotId(board.alienIndex, ETrace.RED),
  );
  if (!columnSlot) {
    throw new Error('Anomaly column slot missing for RED');
  }
  board.placeTrace(columnSlot, { playerId: activePlayer.id }, ETrace.RED);

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

function applyOumuamuaReplay(
  game: Game,
  request: IDebugReplaySessionRequest,
): {
  phase: EPhase;
  summary: string;
  alienIndex: number;
  selectedAlienType: EAlienType;
  currentPlayerId: string;
} {
  if (
    request.checkpointId !== AFTER_OUMUAMUA_TILE_SIGNAL_CHECKPOINT_ID &&
    request.checkpointId !== OUMUAMUA_TRACE_COLUMNS_CHECKPOINT_ID
  ) {
    throw new Error(`Unsupported replay checkpoint: ${request.checkpointId}`);
  }

  const companionAlienType = CORE_RANDOM_ALIEN_TYPES.find(
    (alienType) => alienType !== EAlienType.OUMUAMUA,
  );
  if (companionAlienType === undefined) {
    throw new Error('Could not resolve companion alien for replay preset');
  }

  game.hiddenAliens = [EAlienType.OUMUAMUA, companionAlienType];
  game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
  resolveSetupTucks(game);

  const activePlayer = game.getActivePlayer();
  activePlayer.resources.gain({ credits: 10, energy: 10, publicity: 10 });

  const board = game.alienState.getBoardByType(EAlienType.OUMUAMUA);
  if (!board) {
    throw new Error('Oumuamua board not found for replay preset');
  }

  const pluginInput = game.alienState.discoverAlien(board, game);
  if (pluginInput !== undefined) {
    activePlayer.waitingFor = pluginInput;
  }
  activePlayer.gainExofossils(4);

  const plugin = new OumuamuaAlienPlugin();
  if (request.checkpointId === AFTER_OUMUAMUA_TILE_SIGNAL_CHECKPOINT_ID) {
    plugin.markTileSignal(activePlayer, game);
  }

  game.phase = EPhase.AWAIT_MAIN_ACTION;
  activePlayer.waitingFor = undefined;
  game.eventLog = new EventLog();

  return {
    phase: game.phase,
    summary:
      request.checkpointId === AFTER_OUMUAMUA_TILE_SIGNAL_CHECKPOINT_ID
        ? 'Replay ready: Oumuamua tile has one signal marker and can continue toward completion.'
        : 'Replay ready: Oumuamua trace columns are available with exofossils to spend.',
    alienIndex: board.alienIndex,
    selectedAlienType: EAlienType.OUMUAMUA,
    currentPlayerId: activePlayer.id,
  };
}

function applyCentauriansReplay(
  game: Game,
  request: IDebugReplaySessionRequest,
): {
  phase: EPhase;
  summary: string;
  alienIndex: number;
  selectedAlienType: EAlienType;
  currentPlayerId: string;
} {
  if (request.checkpointId !== CENTAURIANS_AFTER_DISCOVERY_CHECKPOINT_ID) {
    throw new Error(`Unsupported replay checkpoint: ${request.checkpointId}`);
  }

  const { activePlayer, board } = discoverAlienWithNeutralMarkers(
    game,
    EAlienType.CENTAURIANS,
  );
  if (!isCentauriansAlienBoard(board)) {
    throw new Error('Centaurians board not found for replay preset');
  }

  game.phase = EPhase.AWAIT_MAIN_ACTION;
  activePlayer.waitingFor = undefined;
  game.eventLog = new EventLog();

  return {
    phase: game.phase,
    summary:
      'Replay ready: Centaurians milestones and reward slots are initialized.',
    alienIndex: board.alienIndex,
    selectedAlienType: EAlienType.CENTAURIANS,
    currentPlayerId: activePlayer.id,
  };
}

function applyExertiansReplay(
  game: Game,
  request: IDebugReplaySessionRequest,
): {
  phase: EPhase;
  summary: string;
  alienIndex: number;
  selectedAlienType: EAlienType;
  currentPlayerId: string;
} {
  if (request.checkpointId !== EXERTIANS_AFTER_DISCOVERY_CHECKPOINT_ID) {
    throw new Error(`Unsupported replay checkpoint: ${request.checkpointId}`);
  }

  const { activePlayer, board } = discoverAlienWithNeutralMarkers(
    game,
    EAlienType.EXERTIANS,
  );
  if (!isExertiansAlienBoard(board)) {
    throw new Error('Exertians board not found for replay preset');
  }

  game.phase = EPhase.AWAIT_MAIN_ACTION;
  activePlayer.waitingFor = undefined;
  game.eventLog = new EventLog();

  return {
    phase: game.phase,
    summary: 'Replay ready: Exertians danger tiers and milestones are set.',
    alienIndex: board.alienIndex,
    selectedAlienType: EAlienType.EXERTIANS,
    currentPlayerId: activePlayer.id,
  };
}

function applyMascamitesReplay(
  game: Game,
  request: IDebugReplaySessionRequest,
): {
  phase: EPhase;
  summary: string;
  alienIndex: number;
  selectedAlienType: EAlienType;
  currentPlayerId: string;
} {
  if (request.checkpointId !== MASCAMITES_AFTER_DISCOVERY_CHECKPOINT_ID) {
    throw new Error(`Unsupported replay checkpoint: ${request.checkpointId}`);
  }

  const { activePlayer, board } = discoverAlienWithNeutralMarkers(
    game,
    EAlienType.MASCAMITES,
  );
  if (!isMascamitesAlienBoard(board)) {
    throw new Error('Mascamites board not found for replay preset');
  }

  game.phase = EPhase.AWAIT_MAIN_ACTION;
  activePlayer.waitingFor = undefined;
  game.eventLog = new EventLog();

  return {
    phase: game.phase,
    summary: 'Replay ready: Mascamites sample pools are initialized.',
    alienIndex: board.alienIndex,
    selectedAlienType: EAlienType.MASCAMITES,
    currentPlayerId: activePlayer.id,
  };
}

function applyFreeActionReplay(
  game: Game,
  request: IDebugReplaySessionRequest,
): {
  phase: EPhase;
  summary: string;
  alienIndex: number;
  selectedAlienType: EAlienType;
  currentPlayerId: string;
} {
  switch (request.checkpointId) {
    case FREE_ACTION_SPEND_SIGNAL_TOKEN_CHECKPOINT_ID:
      return applySpendSignalTokenReplay(game);
    case FREE_ACTION_DELIVER_SAMPLE_CHECKPOINT_ID:
      return applyDeliverSampleReplay(game);
    default:
      throw new Error(`Unsupported replay checkpoint: ${request.checkpointId}`);
  }
}

function applySpendSignalTokenReplay(game: Game): {
  phase: EPhase;
  summary: string;
  alienIndex: number;
  selectedAlienType: EAlienType;
  currentPlayerId: string;
} {
  applySpendSignalTokenScenario(game);
  game.phase = EPhase.AWAIT_MAIN_ACTION;
  game.eventLog = new EventLog();

  const activePlayer = game.getActivePlayer();
  activePlayer.waitingFor = undefined;
  const board = game.alienState.getBoard(0);

  return {
    phase: game.phase,
    summary:
      'Replay ready: the active player can start SCAN and spend one signal token through the free-action bar.',
    alienIndex: board?.alienIndex ?? 0,
    selectedAlienType: board?.alienType ?? EAlienType.ANOMALIES,
    currentPlayerId: activePlayer.id,
  };
}

function applyDeliverSampleReplay(game: Game): {
  phase: EPhase;
  summary: string;
  alienIndex: number;
  selectedAlienType: EAlienType;
  currentPlayerId: string;
} {
  const companionAlienType = CORE_RANDOM_ALIEN_TYPES.find(
    (alienType) => alienType !== EAlienType.MASCAMITES,
  );
  if (companionAlienType === undefined) {
    throw new Error('Could not resolve companion alien for replay preset');
  }

  game.hiddenAliens = [EAlienType.MASCAMITES, companionAlienType];
  game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
  resolveSetupTucks(game);
  applyDeliverSampleScenario(game);
  game.phase = EPhase.AWAIT_MAIN_ACTION;
  game.eventLog = new EventLog();

  const activePlayer = game.getActivePlayer();
  activePlayer.waitingFor = undefined;
  const board = game.alienState.getBoardByType(EAlienType.MASCAMITES);
  if (!isMascamitesAlienBoard(board)) {
    throw new Error('Mascamites board not found for replay preset');
  }

  return {
    phase: game.phase,
    summary:
      'Replay ready: Mascamites has one deliverable sample capsule for the active player.',
    alienIndex: board.alienIndex,
    selectedAlienType: EAlienType.MASCAMITES,
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
  game: Game,
  board: AnomaliesAlienBoard,
): void {
  if (!game.solarSystem) {
    throw new Error('Solar system not found for anomaly replay preset');
  }

  const existingTokens = game.solarSystem.getAlienTokensByType(
    EAlienType.ANOMALIES,
  );
  const templateRewards = existingTokens[0]?.rewards.map((reward) => ({
    ...reward,
  })) ?? [{ type: 'VP' as const, amount: 2 }];

  for (let i = game.solarSystem.alienTokens.length - 1; i >= 0; i -= 1) {
    if (game.solarSystem.alienTokens[i].alienType === EAlienType.ANOMALIES) {
      game.solarSystem.alienTokens.splice(i, 1);
    }
  }

  for (let sectorIndex = 0; sectorIndex < 8; sectorIndex += 1) {
    game.solarSystem.addAlienToken({
      tokenId: `alien-${board.alienIndex}-anomaly-token|${sectorIndex}|${ETrace.RED}`,
      alienType: EAlienType.ANOMALIES,
      sectorIndex,
      traceColor: ETrace.RED,
      rewards: templateRewards.map((reward) => ({ ...reward })),
    });
  }
}

function discoverAlienWithNeutralMarkers(
  game: Game,
  alienType: EAlienType,
): {
  activePlayer: Game['players'][number];
  board: NonNullable<ReturnType<Game['alienState']['getBoardByType']>>;
} {
  const companionAlienType = CORE_RANDOM_ALIEN_TYPES.find(
    (candidate) => candidate !== alienType,
  );
  if (companionAlienType === undefined) {
    throw new Error('Could not resolve companion alien for replay preset');
  }

  game.hiddenAliens = [alienType, companionAlienType];
  game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
  resolveSetupTucks(game);

  const activePlayer = game.getActivePlayer();
  const board = game.alienState.getBoardByType(alienType);
  if (!board) {
    throw new Error(`Alien board not found for type ${alienType}`);
  }

  for (const slot of board.getDiscoverySlots()) {
    if (slot.occupants.length > 0) {
      continue;
    }
    board.placeTrace(slot, 'neutral', slot.traceColor);
  }

  const pluginInput = game.alienState.discoverAlien(board, game);
  if (pluginInput !== undefined) {
    activePlayer.waitingFor = pluginInput;
  }

  return { activePlayer, board };
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
