import { ANALYZE_ENERGY_COST } from '@seti/common/constant/actionCosts';
import { RESEARCH_PUBLICITY_COST } from '@seti/common/types/tech';

export enum EOrganizationId {
  COSMOS_STRATEGY_GROUP = 'cosmos-strategy-group',
  DEEP_SKY_SURVEY = 'deep-sky-survey',
  FENWICK_RESEARCH_CENTER = 'fenwick-research-center',
  FUTURESPAN_INSTITUTE = 'futurespan-institute',
  HELION_ASSEMBLY = 'helion-assembly',
  MISSION_RELAY = 'mission-relay',
  ORBITAL_DYNAMICS = 'orbital-dynamics',
  SENTINEL_PROBE_NETWORK = 'sentinel-probe-network',
  STRATUS_CORE = 'stratus-core',
  TURING_SYSTEMS = 'turing-systems',
  XENOLAB = 'xenolab',
}

export type TOrganizationComplexity =
  | 'setup-only'
  | 'passive'
  | 'once-per-round'
  | 'complex';

export interface IOrganizationStartResources {
  credit: number;
  energy: number;
  card: number;
  publicity: number;
  data: number;
}

export interface IOrganizationIncome {
  credit: number;
  energy: number;
  card: number;
  publicity: number;
  data: number;
  signalToken: number;
}

export interface IOrganizationSetupData {
  resources: IOrganizationStartResources;
  tuckIncome: number;
  probes: number;
}

export interface IOrganizationFrontendReference {
  type: string;
  displayName: string;
  image: string;
}

export interface IOrganizationAbilityText {
  setup?: string;
  passive?: string;
  freeAction?: string;
  mainAction?: string;
}

export type TOrganizationState = Partial<
  Record<EOrganizationId, Record<string, unknown>>
>;

export type TOrganizationRoundUsage = Partial<Record<EOrganizationId, boolean>>;

export interface IPlayerActionCostConfig {
  analyzeDataEnergy: number;
  researchTechPublicity: number;
}

export const DEFAULT_PLAYER_ACTION_COSTS: IPlayerActionCostConfig = {
  analyzeDataEnergy: ANALYZE_ENERGY_COST,
  researchTechPublicity: RESEARCH_PUBLICITY_COST,
};

export interface IOrganizationData {
  id: EOrganizationId;
  name: string;
  localizedName: string;
  frontendReference: IOrganizationFrontendReference;
  abilityText: IOrganizationAbilityText;
  referenceLogicSummary: string;
  complexity: TOrganizationComplexity;
  resources: IOrganizationStartResources;
  tuckIncome: number;
  probes: number;
  income: IOrganizationIncome;
  setup: IOrganizationSetupData;
}
