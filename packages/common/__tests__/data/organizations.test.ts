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
    abilityText: {
      passive:
        "When you play a card as a main action, you may mark one matching reward space if the card's sector color matches an unmarked space on this organization. Yellow or black cards can mark the credit space, red or black cards can mark the publicity space, and blue or black cards can mark the data space.",
      freeAction:
        'Once per round, gain 1 card from either the card row or the top of the deck, then clear all reward spaces marked on this organization.',
    },
    referenceLogicSummary:
      'Setup grants resources and income. Main-action card colors mark and immediately grant matching reward spaces. The once-per-round free action gains a card and clears marked reward spaces; round reset only restores the use token.',
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
    abilityText: {
      passive: "You don't need energy to perform Analyze Data.",
      freeAction:
        'Once per round, switch a card from your hand with a card on the card row.',
    },
    referenceLogicSummary:
      'Setup grants no starting card. Analyze Data costs no energy. The once-per-round free action swaps exactly one hand card with one card-row card, and round reset restores the use token.',
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
    abilityText: {
      passive: 'You only need 5 publicity to research tech.',
      freeAction:
        "Once per round, spend 1 publicity to gain any card from the card row or a random card from the main deck, then gain that card's free-action corner bonus.",
    },
    referenceLogicSummary:
      'Tech research uses a 5-publicity threshold. The once-per-round free action spends 1 publicity, gains a row or deck card, resolves its free-action corner, and resets next round.',
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
    abilityText: {
      freeAction:
        "Prepare one card from your hand by placing it on this organization and setting the countdown to that card's credit cost x 10 + 5. Once per round while the token is on the scoring track, move it 3 spaces farther ahead and gain 1 card.",
      mainAction:
        'Once your score marker reaches or passes the Futurespan token, play the prepared card as a main action without paying its credit cost, then return the token.',
    },
    referenceLogicSummary:
      'Sponsor selection stores a hand card and creates a cost-based countdown. Score gains reduce the countdown, the unlocked card can be played for free, and the delay power increases the countdown by 3 while gaining a card.',
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
    abilityText: {
      passive:
        'When you develop a tech, you may mark the matching reward space on this organization and gain its reward. Probe/orange tech grants 1 energy, scan/purple tech grants 1 signal token, and computer/blue tech grants 1 data.',
      freeAction:
        'Once per round, destroy one of your probe/orange or scan/purple techs, then tuck one card from your hand for income and clear all reward spaces marked on this organization.',
    },
    referenceLogicSummary:
      'Developed tech categories can mark and immediately grant one matching reward. The free action clears marks, disables one non-computer tech, tucks one hand card for income, and resets next round.',
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
    abilityText: {
      setup:
        'At the start of the game, mark the lowest-scoring space on the mission gold scoring tile.',
      passive: 'When you play a card with a mission, gain 1 publicity.',
      freeAction:
        "Once per round, spend 2 publicity to gain any card from the card row or a random card from the main deck, then immediately gain the resource matching that card's income corner.",
    },
    referenceLogicSummary:
      'Setup marks the mission gold scoring tile. Mission cards grant publicity when played. The once-per-round power spends 2 publicity, gains a row or deck card, resolves its income corner, and resets next round.',
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
    abilityText: {
      passive: 'Your probe capacity is 1 higher.',
      freeAction:
        'Once per round, move at most 2 different probes of yours with 1 step each.',
    },
    referenceLogicSummary:
      'Setup launches 2 probes and increases probe capacity by 1. The once-per-round free action moves up to 2 different probes one step each, then resets next round.',
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
    abilityText: {
      passive: "When you launch a probe, mark a signal in that probe's sector.",
      freeAction:
        "Once per round, after you play and fully resolve a non-alien card as a main action this turn, gain that card's free-action corner effect.",
    },
    referenceLogicSummary:
      'Probe launches mark a signal in the launched sector. The last fully resolved own non-alien main-action card corner is stored, replayed by the once-per-round power, and cleared by turn or round management.',
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
    abilityText: {
      freeAction:
        'Once per round, gain the free-action corner effects of all 3 cards in the card row without discarding those cards.',
    },
    referenceLogicSummary:
      'The once-per-round free action resolves all current card-row free-action corners in row order while keeping the offered cards in place, then resets next round.',
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
    abilityText: {
      passive: 'When you research a computer/blue tech, gain 1 publicity.',
      freeAction:
        "Once per round, choose any probe or scan tech. Until the end of this turn, you may use that tech's ability as if you had researched it. This does not count as researching the tech and does not grant its immediate bonuses.",
    },
    referenceLogicSummary:
      'Computer tech research grants publicity. The once-per-round free action temporarily adds a selected probe or scan tech to effective techs, grants no immediate bonuses, and expires at turn end.',
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
    abilityText: {
      mainAction:
        'Xenolab starts with three active action tiles. You may use an active tile as a discounted main action, then flip that tile inactive: spend 1 credit to launch a probe, spend 2 energy to scan, or spend 4 publicity to research any tech.',
      passive:
        'When you gain the trace shown on an inactive tile, flip that tile back active. The trace is still gained normally and is not spent.',
    },
    referenceLogicSummary:
      'Setup creates three active action tiles. Direct organization use is prevented; active tiles provide discounted launch, scan, or research main actions, flip inactive on use, and reactivate when the matching trace is gained.',
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

const ORGANIZATION_IDS = [
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
] as const;

const ORGANIZATION_CASES = ORGANIZATION_IDS.map((organizationId) => ({
  organizationId,
  organizationName: EXPECTED_SETUP[organizationId].name,
}));

const EXPECTED_COMPLEXITY: Record<
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

describe('Space Agency organization metadata', () => {
  it('exports all organization ids in deterministic order', () => {
    expect(ORGANIZATIONS.map((organization) => organization.id)).toEqual(
      ORGANIZATION_IDS,
    );
  });

  it.each(ORGANIZATION_CASES)(
    'matches documented setup resources and income values for $organizationName',
    ({ organizationId }) => {
      expect(ORGANIZATIONS_BY_ID[organizationId]).toMatchObject(
        EXPECTED_SETUP[organizationId],
      );
    },
  );

  it.each(ORGANIZATION_CASES)(
    'matches documented localized names and frontend references for $organizationName',
    ({ organizationId }) => {
      expect(ORGANIZATIONS_BY_ID[organizationId]).toMatchObject({
        localizedName: EXPECTED_SETUP[organizationId].localizedName,
        frontendReference: EXPECTED_SETUP[organizationId].frontendReference,
      });
    },
  );

  it.each(ORGANIZATION_CASES)(
    'exposes documented ability text and reference summaries for $organizationName',
    ({ organizationId }) => {
      const organization = ORGANIZATIONS_BY_ID[organizationId];
      const expected = EXPECTED_SETUP[organizationId];

      expect(organization.abilityText).toEqual(expected.abilityText);
      expect(organization.referenceLogicSummary).toBe(
        expected.referenceLogicSummary,
      );
    },
  );

  it.each(ORGANIZATION_CASES)(
    'marks implemented SA-5 organization behavior with non setup-only complexity for $organizationName',
    ({ organizationId }) => {
      expect(ORGANIZATIONS_BY_ID[organizationId].complexity).toBe(
        EXPECTED_COMPLEXITY[organizationId],
      );
    },
  );

  it('keeps tuck income separate from starting resources and income', () => {
    const helion = ORGANIZATIONS_BY_ID[EOrganizationId.HELION_ASSEMBLY];

    expect(helion.setup.tuckIncome).toBe(0);
    expect(helion.setup.resources).not.toHaveProperty('tuckIncome');
    expect(helion.income).not.toHaveProperty('tuckIncome');
  });

  it.each(ORGANIZATION_CASES)(
    'does not expose unimplemented ability behavior in common metadata for $organizationName',
    ({ organizationId }) => {
      const organization = ORGANIZATIONS_BY_ID[organizationId];

      expect(organization).not.toHaveProperty('eventListeners');
      expect(organization).not.toHaveProperty('oncePerRoundFreeAction');
      expect(organization).not.toHaveProperty('passiveEffects');
      expect(organization).not.toHaveProperty('missions');
      expect(organization).not.toHaveProperty('endGameScoring');
    },
  );

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
