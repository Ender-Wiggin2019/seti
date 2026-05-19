import { describe, expect, it } from 'vitest';
import {
  createOrganizationSetupCandidates,
  ORGANIZATIONS,
  ORGANIZATIONS_BY_ID,
} from '@/data/organizations';
import { EOrganizationId } from '@/types/organization';

const EXPECTED_SETUP = {
  [EOrganizationId.COSMOS_STRATEGY_GROUP]: {
    name: 'Cosmos Strategy Group',
    localizedName: '宇宙战略集团',
    frontendReference: {
      type: 'cards',
      displayName: 'Cosmos Strategy Group',
      image: 'corporations/Cosmos Strategy Group.jpg',
    },
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
  },
  [EOrganizationId.DEEP_SKY_SURVEY]: {
    name: 'Deep Sky Survey',
    localizedName: '深空探测',
    frontendReference: {
      type: 'look',
      displayName: 'Deep Sky Survey',
      image: 'corporations/Deep Sky Survey.jpg',
    },
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
  },
  [EOrganizationId.FENWICK_RESEARCH_CENTER]: {
    name: 'Fenwick Research Center',
    localizedName: '芬威克研究中心',
    frontendReference: {
      type: 'publ',
      displayName: 'NovaTek Industries',
      image: 'corporations/Fenwick Research Center.jpg',
    },
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
  },
  [EOrganizationId.FUTURESPAN_INSTITUTE]: {
    name: 'Futurespan Institute',
    localizedName: '未来跨度研究所',
    frontendReference: {
      type: 'sponsoring',
      displayName: 'FutureSpan Institute',
      image: 'corporations/Futurespan Institute.jpg',
    },
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
  },
  [EOrganizationId.HELION_ASSEMBLY]: {
    name: 'Helion Assembly',
    localizedName: '赫利昂联合体',
    frontendReference: {
      type: 'techSeller',
      displayName: 'Virelon Technologies',
      image: 'corporations/Helion Assembly.jpg',
    },
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
  },
  [EOrganizationId.MISSION_RELAY]: {
    name: 'Mission Relay',
    localizedName: '任务中继站',
    frontendReference: {
      type: 'missions',
      displayName: 'Mission Broadcast',
      image: 'corporations/Mission Relay.jpg',
    },
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
  },
  [EOrganizationId.ORBITAL_DYNAMICS]: {
    name: 'Orbital Dynamics',
    localizedName: '寰宇动力',
    frontendReference: {
      type: 'probes',
      displayName: 'Orbital Dynamics',
      image: 'corporations/Orbital Dynamics.jpg',
    },
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
  },
  [EOrganizationId.SENTINEL_PROBE_NETWORK]: {
    name: 'Sentinel Probe Network',
    localizedName: '哨兵探测网络',
    frontendReference: {
      type: 'probeSignal',
      displayName: 'Sentinel Probe Network',
      image: 'corporations/Sentinel Probe Network.jpg',
    },
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
  },
  [EOrganizationId.STRATUS_CORE]: {
    name: 'Stratus Core',
    localizedName: '层云核心',
    frontendReference: {
      type: 'offerEffects',
      displayName: 'Stratus Core',
      image: 'corporations/Stratus Core.jpg',
    },
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
  },
  [EOrganizationId.TURING_SYSTEMS]: {
    name: 'Turing Systems',
    localizedName: '图灵系统',
    frontendReference: {
      type: 'testTech',
      displayName: 'Axion Intelligence',
      image: 'corporations/Turing Systems.jpg',
    },
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
  },
  [EOrganizationId.XENOLAB]: {
    name: 'Xenolab',
    localizedName: '异星实验室',
    frontendReference: {
      type: 'traces',
      displayName: 'XenoLab',
      image: 'corporations/Xenolab.jpg',
    },
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
  },
} as const;

describe('Space Agency organization metadata', () => {
  it('exports all organization ids in deterministic order', () => {
    expect(ORGANIZATIONS.map((organization) => organization.id)).toEqual([
      EOrganizationId.COSMOS_STRATEGY_GROUP,
      EOrganizationId.DEEP_SKY_SURVEY,
      EOrganizationId.FENWICK_RESEARCH_CENTER,
      EOrganizationId.FUTURESPAN_INSTITUTE,
      EOrganizationId.HELION_ASSEMBLY,
      EOrganizationId.MISSION_RELAY,
      EOrganizationId.ORBITAL_DYNAMICS,
      EOrganizationId.SENTINEL_PROBE_NETWORK,
      EOrganizationId.STRATUS_CORE,
      EOrganizationId.TURING_SYSTEMS,
      EOrganizationId.XENOLAB,
    ]);
  });

  it('matches the documented setup resources and income values', () => {
    for (const organization of ORGANIZATIONS) {
      expect(organization).toMatchObject(EXPECTED_SETUP[organization.id]);
    }
  });

  it('matches documented localized names and frontend references', () => {
    for (const organization of ORGANIZATIONS) {
      expect(organization).toMatchObject({
        localizedName: EXPECTED_SETUP[organization.id].localizedName,
        frontendReference: EXPECTED_SETUP[organization.id].frontendReference,
      });
    }
  });

  it('marks implemented SA-5 organization behavior with non setup-only complexity', () => {
    const expectedComplexity: Record<
      EOrganizationId,
      (typeof ORGANIZATIONS)[number]['complexity']
    > = {
      [EOrganizationId.COSMOS_STRATEGY_GROUP]: 'complex',
      [EOrganizationId.DEEP_SKY_SURVEY]: 'passive',
      [EOrganizationId.FENWICK_RESEARCH_CENTER]: 'once-per-round',
      [EOrganizationId.FUTURESPAN_INSTITUTE]: 'complex',
      [EOrganizationId.HELION_ASSEMBLY]: 'complex',
      [EOrganizationId.MISSION_RELAY]: 'complex',
      [EOrganizationId.ORBITAL_DYNAMICS]: 'once-per-round',
      [EOrganizationId.SENTINEL_PROBE_NETWORK]: 'once-per-round',
      [EOrganizationId.STRATUS_CORE]: 'once-per-round',
      [EOrganizationId.TURING_SYSTEMS]: 'complex',
      [EOrganizationId.XENOLAB]: 'complex',
    };

    for (const [organizationId, complexity] of Object.entries(
      expectedComplexity,
    )) {
      expect(
        ORGANIZATIONS_BY_ID[organizationId as EOrganizationId].complexity,
      ).toBe(complexity);
    }
  });

  it('keeps tuck income separate from starting resources and income', () => {
    const helion = ORGANIZATIONS_BY_ID[EOrganizationId.HELION_ASSEMBLY];

    expect(helion.setup.tuckIncome).toBe(0);
    expect(helion.setup.resources).not.toHaveProperty('tuckIncome');
    expect(helion.income).not.toHaveProperty('tuckIncome');
  });

  it('does not expose unimplemented ability behavior in common metadata', () => {
    for (const organization of ORGANIZATIONS) {
      expect(organization).not.toHaveProperty('eventListeners');
      expect(organization).not.toHaveProperty('oncePerRoundFreeAction');
      expect(organization).not.toHaveProperty('passiveEffects');
      expect(organization).not.toHaveProperty('missions');
      expect(organization).not.toHaveProperty('endGameScoring');
    }
  });

  it('derives setup-choice candidates from common organization data', () => {
    expect(createOrganizationSetupCandidates()).toEqual(
      ORGANIZATIONS.map((organization) => ({
        id: organization.id,
        label: organization.name,
        permission: { canChoose: true },
      })),
    );
  });
});
