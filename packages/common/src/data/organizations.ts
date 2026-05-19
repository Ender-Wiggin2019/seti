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
    localizedName: '宇宙战略集团',
    frontendReference: {
      type: 'cards',
      displayName: 'Cosmos Strategy Group',
      image: 'corporations/Cosmos Strategy Group.jpg',
    },
    complexity: 'complex',
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
    localizedName: '深空探测',
    frontendReference: {
      type: 'look',
      displayName: 'Deep Sky Survey',
      image: 'corporations/Deep Sky Survey.jpg',
    },
    complexity: 'passive',
    resources: { credit: 3, energy: 2, card: 0, publicity: 3, data: 1 },
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
    localizedName: '芬威克研究中心',
    frontendReference: {
      type: 'publ',
      displayName: 'NovaTek Industries',
      image: 'corporations/Fenwick Research Center.jpg',
    },
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
    localizedName: '未来跨度研究所',
    frontendReference: {
      type: 'sponsoring',
      displayName: 'FutureSpan Institute',
      image: 'corporations/Futurespan Institute.jpg',
    },
    complexity: 'complex',
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
    localizedName: '赫利昂联合体',
    frontendReference: {
      type: 'techSeller',
      displayName: 'Virelon Technologies',
      image: 'corporations/Helion Assembly.jpg',
    },
    complexity: 'complex',
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
    localizedName: '任务中继站',
    frontendReference: {
      type: 'missions',
      displayName: 'Mission Broadcast',
      image: 'corporations/Mission Relay.jpg',
    },
    complexity: 'complex',
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
    localizedName: '寰宇动力',
    frontendReference: {
      type: 'probes',
      displayName: 'Orbital Dynamics',
      image: 'corporations/Orbital Dynamics.jpg',
    },
    complexity: 'once-per-round',
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
    localizedName: '哨兵探测网络',
    frontendReference: {
      type: 'probeSignal',
      displayName: 'Sentinel Probe Network',
      image: 'corporations/Sentinel Probe Network.jpg',
    },
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
    localizedName: '层云核心',
    frontendReference: {
      type: 'offerEffects',
      displayName: 'Stratus Core',
      image: 'corporations/Stratus Core.jpg',
    },
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
    localizedName: '图灵系统',
    frontendReference: {
      type: 'testTech',
      displayName: 'Axion Intelligence',
      image: 'corporations/Turing Systems.jpg',
    },
    complexity: 'complex',
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
    localizedName: '异星实验室',
    frontendReference: {
      type: 'traces',
      displayName: 'XenoLab',
      image: 'corporations/Xenolab.jpg',
    },
    complexity: 'complex',
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
