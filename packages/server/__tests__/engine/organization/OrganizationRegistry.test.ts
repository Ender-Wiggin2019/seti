import { EOrganizationId } from '@seti/common/types/organization';
import { OrganizationRegistry } from '@/engine/organization/OrganizationRegistry.js';

describe('OrganizationRegistry', () => {
  it('creates organization runtimes for every common organization id', () => {
    expect(OrganizationRegistry.getAllIds()).toEqual(
      Object.values(EOrganizationId),
    );

    const organization = OrganizationRegistry.create(
      EOrganizationId.ORBITAL_DYNAMICS,
    );

    expect(organization.id).toBe(EOrganizationId.ORBITAL_DYNAMICS);
    expect(organization.name).toBe('Orbital Dynamics');
  });

  it('creates a concrete organization class for every organization id', () => {
    const expectedClassNames: Record<EOrganizationId, string> = {
      [EOrganizationId.COSMOS_STRATEGY_GROUP]: 'CosmosStrategyGroup',
      [EOrganizationId.DEEP_SKY_SURVEY]: 'DeepSkySurvey',
      [EOrganizationId.FENWICK_RESEARCH_CENTER]: 'FenwickResearchCenter',
      [EOrganizationId.FUTURESPAN_INSTITUTE]: 'FuturespanInstitute',
      [EOrganizationId.HELION_ASSEMBLY]: 'HelionAssembly',
      [EOrganizationId.MISSION_RELAY]: 'MissionRelay',
      [EOrganizationId.ORBITAL_DYNAMICS]: 'OrbitalDynamics',
      [EOrganizationId.SENTINEL_PROBE_NETWORK]: 'SentinelProbeNetwork',
      [EOrganizationId.STRATUS_CORE]: 'StratusCore',
      [EOrganizationId.TURING_SYSTEMS]: 'TuringSystems',
      [EOrganizationId.XENOLAB]: 'Xenolab',
    };

    for (const organizationId of Object.values(EOrganizationId)) {
      expect(OrganizationRegistry.create(organizationId).constructor.name).toBe(
        expectedClassNames[organizationId],
      );
    }
  });

  it('rejects unknown organization ids', () => {
    expect(() =>
      OrganizationRegistry.create('missing-organization' as EOrganizationId),
    ).toThrow('Unknown organization id');
  });
});
