import {
  EOrganizationId,
  type IOrganizationData,
  type TOrganizationComplexity,
} from '@seti/common/types/organization';

interface IOrganizationDefinition
  extends Omit<IOrganizationData, 'complexity' | 'setup'> {
  complexity?: TOrganizationComplexity;
}

export interface IOrganizationSetupChoiceCandidate {
  id: EOrganizationId;
  label: string;
  permission: { canChoose: true };
}

function defineOrganization(
  definition: IOrganizationDefinition,
): IOrganizationData {
  return {
    ...definition,
    complexity: definition.complexity ?? 'setup-only',
    setup: {
      resources: definition.resources,
      tuckIncome: definition.tuckIncome,
      probes: definition.probes,
    },
  };
}

export const ORGANIZATIONS: readonly IOrganizationData[] = [
  defineOrganization({
    id: EOrganizationId.COSMOS_STRATEGY_GROUP,
    name: 'Cosmos Strategy Group',
    resources: { credit: 4, energy: 2, card: 1, publicity: 1, data: 0 },
    tuckIncome: 2,
    probes: 0,
    income: {
      credit: 2,
      energy: 1,
      card: 1,
      publicity: 0,
      data: 0,
      signalToken: 0,
    },
  }),
  defineOrganization({
    id: EOrganizationId.DEEP_SKY_SURVEY,
    name: 'Deep Sky Survey',
    complexity: 'passive',
    resources: { credit: 3, energy: 2, card: 1, publicity: 4, data: 1 },
    tuckIncome: 2,
    probes: 0,
    income: {
      credit: 2,
      energy: 2,
      card: 1,
      publicity: 0,
      data: 0,
      signalToken: 1,
    },
  }),
  defineOrganization({
    id: EOrganizationId.FENWICK_RESEARCH_CENTER,
    name: 'Fenwick Research Center',
    complexity: 'once-per-round',
    resources: { credit: 3, energy: 1, card: 0, publicity: 4, data: 0 },
    tuckIncome: 3,
    probes: 0,
    income: {
      credit: 3,
      energy: 1,
      card: 0,
      publicity: 1,
      data: 0,
      signalToken: 0,
    },
  }),
  defineOrganization({
    id: EOrganizationId.FUTURESPAN_INSTITUTE,
    name: 'Futurespan Institute',
    resources: { credit: 3, energy: 3, card: 1, publicity: 3, data: 0 },
    tuckIncome: 2,
    probes: 0,
    income: {
      credit: 2,
      energy: 1,
      card: 1,
      publicity: 0,
      data: 0,
      signalToken: 0,
    },
  }),
  defineOrganization({
    id: EOrganizationId.HELION_ASSEMBLY,
    name: 'Helion Assembly',
    resources: { credit: 3, energy: 2, card: 0, publicity: 7, data: 0 },
    tuckIncome: 0,
    probes: 0,
    income: {
      credit: 3,
      energy: 1,
      card: 1,
      publicity: 1,
      data: 0,
      signalToken: 0,
    },
  }),
  defineOrganization({
    id: EOrganizationId.MISSION_RELAY,
    name: 'Mission Relay',
    complexity: 'passive',
    resources: { credit: 3, energy: 2, card: 2, publicity: 2, data: 0 },
    tuckIncome: 3,
    probes: 0,
    income: {
      credit: 1,
      energy: 1,
      card: 1,
      publicity: 0,
      data: 0,
      signalToken: 0,
    },
  }),
  defineOrganization({
    id: EOrganizationId.ORBITAL_DYNAMICS,
    name: 'Orbital Dynamics',
    resources: { credit: 2, energy: 2, card: 0, publicity: 3, data: 0 },
    tuckIncome: 2,
    probes: 2,
    income: {
      credit: 3,
      energy: 1,
      card: 1,
      publicity: 0,
      data: 0,
      signalToken: 0,
    },
  }),
  defineOrganization({
    id: EOrganizationId.SENTINEL_PROBE_NETWORK,
    name: 'Sentinel Probe Network',
    complexity: 'once-per-round',
    resources: { credit: 4, energy: 2, card: 0, publicity: 3, data: 0 },
    tuckIncome: 1,
    probes: 0,
    income: {
      credit: 3,
      energy: 1,
      card: 1,
      publicity: 0,
      data: 0,
      signalToken: 1,
    },
  }),
  defineOrganization({
    id: EOrganizationId.STRATUS_CORE,
    name: 'Stratus Core',
    complexity: 'once-per-round',
    resources: { credit: 3, energy: 2, card: 1, publicity: 3, data: 0 },
    tuckIncome: 3,
    probes: 0,
    income: {
      credit: 2,
      energy: 1,
      card: 1,
      publicity: 0,
      data: 0,
      signalToken: 0,
    },
  }),
  defineOrganization({
    id: EOrganizationId.TURING_SYSTEMS,
    name: 'Turing Systems',
    resources: { credit: 4, energy: 2, card: 1, publicity: 2, data: 0 },
    tuckIncome: 2,
    probes: 0,
    income: {
      credit: 2,
      energy: 2,
      card: 1,
      publicity: 0,
      data: 1,
      signalToken: 0,
    },
  }),
  defineOrganization({
    id: EOrganizationId.XENOLAB,
    name: 'Xenolab',
    resources: { credit: 2, energy: 2, card: 1, publicity: 1, data: 0 },
    tuckIncome: 3,
    probes: 0,
    income: {
      credit: 2,
      energy: 1,
      card: 1,
      publicity: 0,
      data: 0,
      signalToken: 0,
    },
  }),
] as const;

export const ORGANIZATIONS_BY_ID: Readonly<
  Record<EOrganizationId, IOrganizationData>
> = Object.freeze(
  Object.fromEntries(
    ORGANIZATIONS.map((organization) => [organization.id, organization]),
  ) as Record<EOrganizationId, IOrganizationData>,
);

export function createOrganizationSetupCandidates(): IOrganizationSetupChoiceCandidate[] {
  return ORGANIZATIONS.map((organization) => ({
    id: organization.id,
    label: organization.name,
    permission: { canChoose: true },
  }));
}
