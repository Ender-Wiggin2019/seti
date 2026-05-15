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
  },
  [EOrganizationId.FENWICK_RESEARCH_CENTER]: {
    name: 'Fenwick Research Center',
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

  it('marks implemented SA-5 organization behavior with non setup-only complexity', () => {
    expect(
      ORGANIZATIONS_BY_ID[EOrganizationId.DEEP_SKY_SURVEY].complexity,
    ).toBe('passive');
    expect(
      ORGANIZATIONS_BY_ID[EOrganizationId.FENWICK_RESEARCH_CENTER].complexity,
    ).toBe('once-per-round');
    expect(
      ORGANIZATIONS_BY_ID[EOrganizationId.SENTINEL_PROBE_NETWORK].complexity,
    ).toBe('once-per-round');
    expect(ORGANIZATIONS_BY_ID[EOrganizationId.STRATUS_CORE].complexity).toBe(
      'once-per-round',
    );
    expect(
      ORGANIZATIONS_BY_ID[EOrganizationId.ORBITAL_DYNAMICS].complexity,
    ).toBe('setup-only');
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
