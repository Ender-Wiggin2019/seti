import type { EPlanet } from '@seti/common/types/protocol/enums';
import type { TPublicSlotReward } from '@seti/common/types/protocol/gameState';

export type TSoloDifficulty = 1 | 2 | 3 | 4 | 5;
export type TRivalBoardConfigId =
  | 'rival-board-1'
  | 'rival-board-2'
  | 'rival-board-3'
  | 'rival-board-4';

export enum ERivalActionCardTier {
  BASIC = 'basic',
  ADVANCED = 'advanced',
  SPECIES_SPECIAL = 'species-special',
}

export enum ERivalDecisionDirection {
  LEFT = 'left',
  RIGHT = 'right',
}

export enum ERivalActionKind {
  ANALYZE_DATA = 'analyze-data',
  LAUNCH_PROBE = 'launch-probe',
  RESEARCH_TECH = 'research-tech',
  PROBE_PLACEMENT = 'probe-placement',
  SCAN = 'scan',
  SPECIES_REPLACEMENT_CHECK = 'species-replacement-check',
  MARK_TRACE = 'mark-trace',
  MARK_ANY_TRACE = 'mark-any-trace',
  PLAY_DANGER_CARD = 'play-danger-card',
  START_COUNTDOWN = 'start-countdown',
}

export enum ERivalProbePlacement {
  ORBITER = 'orbiter',
  LANDER = 'lander',
}

export enum ERivalProbeTarget {
  OUMUAMUA = 'oumuamua',
}

export enum ERivalTelescopeMode {
  DEFAULT = 'default',
  EARTH = 'earth',
  OUMUAMUA = 'oumuamua',
}

export enum ERivalObjectiveTrigger {
  PROBE_LAUNCHED = 'probe-launched',
  SCAN_PERFORMED = 'scan-performed',
  TECH_PROBE = 'tech-probe',
  TECH_SCAN = 'tech-scan',
  TECH_COMPUTER = 'tech-computer',
  TECH_ANY = 'tech-any',
  TRACE_BLUE = 'trace-blue',
  PROBE_VISITED_ASTEROIDS = 'probe-visited-asteroids',
  PROBE_VISITED_COMET = 'probe-visited-comet',
  CARD_COST_3 = 'card-cost-3',
  MISSION_COMPLETED = 'mission-completed',
  PROBE_LANDED = 'probe-landed',
  PROBE_ORBITED = 'probe-orbited',
  PLANET_VENUS = 'planet-venus',
  PLANET_MERCURY = 'planet-mercury',
  PLANET_JUPITER = 'planet-jupiter',
  PLANET_SATURN = 'planet-saturn',
  PLANET_MARS = 'planet-mars',
  PLANET_NEPTUNE = 'planet-neptune',
  PLANET_URANUS = 'planet-uranus',
  SECTOR_DOMINANCE = 'sector-dominance',
  SECTOR_DOMINANCE_YELLOW = 'sector-dominance-yellow',
  SECTOR_DOMINANCE_RED = 'sector-dominance-red',
  SECTOR_DOMINANCE_BLUE = 'sector-dominance-blue',
  SECTOR_DOMINANCE_BLACK = 'sector-dominance-black',
}

export type TRivalActionCardId = `S.${number}`;
export type TRivalObjectiveId = `SOLO.${number}`;
export type TRivalObjectiveTaskMarkers = Partial<
  Record<TRivalObjectiveId, number[]>
>;
export type TRivalObjectiveTriggerKey =
  | ERivalObjectiveTrigger
  | `either:${string}`;

export interface IRivalActionCandidateDefinition {
  kind: ERivalActionKind;
  effects?: readonly TPublicSlotReward[];
  paid?: boolean;
  movement?: number;
  planets?: readonly EPlanet[];
  alienIndex?: number;
  probeTarget?: ERivalProbeTarget;
  probePlacement?: ERivalProbePlacement;
  telescopeMode?: ERivalTelescopeMode;
  collectMascamitesSample?: boolean;
}

export interface IRivalActionCardDefinition {
  id: TRivalActionCardId;
  deckTier: ERivalActionCardTier;
  decisionDirection: ERivalDecisionDirection;
  candidates: readonly IRivalActionCandidateDefinition[];
}

export interface IPublicRivalComputerState {
  filledSlots: boolean[];
  dataPool: number;
}

export interface IPublicRivalActionDeckState {
  drawPileSize: number;
  discardPileSize: number;
  advancedReserveSize: number;
  removedCardIds: TRivalActionCardId[];
  currentCardId: TRivalActionCardId | null;
}

export interface IPublicRivalState {
  rivalPlayerId: string;
  difficulty: TSoloDifficulty;
  progress: number;
  progressSlot: number;
  boardConfigId: TRivalBoardConfigId;
  computer: IPublicRivalComputerState;
  actionDeck: IPublicRivalActionDeckState;
  revealedObjectiveIds: TRivalObjectiveId[];
  completedObjectiveIds: TRivalObjectiveId[];
  objectiveTaskMarkers: TRivalObjectiveTaskMarkers;
}
