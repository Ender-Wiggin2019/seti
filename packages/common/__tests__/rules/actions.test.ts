import { describe, expect, it } from 'vitest';
import {
  canAnalyzeData,
  canLand,
  canLaunchProbe,
  canOrbit,
  canPlayCard,
  canResearchTechAction,
  canScan,
  getAvailableMainActions,
} from '@/rules/actions';
import { EResource, ETech } from '@/types/element';
import { EMainAction, EPhase, EPlanet } from '@/types/protocol/enums';
import type {
  IPublicGameState,
  IPublicPlayerState,
  IPublicTechBoard,
} from '@/types/protocol/gameState';

function createPlayer(
  overrides?: Partial<IPublicPlayerState>,
): IPublicPlayerState {
  return {
    playerId: 'p1',
    playerName: 'Alice',
    seatIndex: 0,
    color: 'red',
    score: 0,
    handSize: 4,
    resources: {
      [EResource.CREDIT]: 4,
      [EResource.ENERGY]: 3,
      [EResource.DATA]: 0,
      [EResource.PUBLICITY]: 6,
    },
    traces: {},
    tracesByAlien: {},
    computer: {
      columns: [
        {
          topFilled: false,
          topReward: null,
          techId: null,
          hasBottomSlot: false,
          bottomFilled: false,
          bottomReward: null,
          techSlotAvailable: true,
        },
        {
          topFilled: false,
          topReward: null,
          techId: null,
          hasBottomSlot: false,
          bottomFilled: false,
          bottomReward: null,
          techSlotAvailable: true,
        },
        {
          topFilled: false,
          topReward: null,
          techId: null,
          hasBottomSlot: false,
          bottomFilled: false,
          bottomReward: null,
          techSlotAvailable: true,
        },
      ],
    },
    dataPoolCount: 0,
    dataPoolMax: 6,
    pieces: { probes: 3, orbiters: 3, landers: 3, signalMarkers: 5 },
    techs: [],
    passed: false,
    movementPoints: 0,
    dataStashCount: 0,
    probesInSpace: 0,
    probeSpaceLimit: 1,
    creditIncome: 4,
    energyIncome: 3,
    cardIncome: 0,
    ...overrides,
  };
}

function createTechBoard(): IPublicTechBoard {
  const stacks = [];
  for (const cat of [ETech.PROBE, ETech.SCAN, ETech.COMPUTER] as const) {
    for (let level = 0; level < 4; level++) {
      stacks.push({
        tech: cat,
        level,
        remainingTiles: 4,
        firstTakeBonusAvailable: true,
      });
    }
  }
  return { stacks };
}

function createGameState(
  overrides?: Partial<IPublicGameState>,
): IPublicGameState {
  return {
    gameId: 'g1',
    round: 1,
    phase: EPhase.AWAIT_MAIN_ACTION,
    currentPlayerId: 'p1',
    startPlayerId: 'p1',
    players: [],
    solarSystem: {
      spaces: ['planet-space-1'],
      adjacency: {},
      probes: [{ playerId: 'p1', spaceId: 'planet-space-1' }],
      discs: [],
    },
    sectors: [],
    planetaryBoard: {
      planets: {
        [EPlanet.MERCURY]: {
          orbitSlots: [],
          landingSlots: [],
          firstOrbitClaimed: false,
          firstLandDataBonusTaken: [false],
          moonOccupant: null,
          moonUnlocked: false,
          planetSpaceId: 'planet-space-1',
        },
      },
    },
    techBoard: createTechBoard(),
    cardRow: [],
    aliens: [],
    recentEvents: [],
    milestones: { goldMilestones: [], neutralMilestones: [] },
    goldScoringTiles: [],
    ...overrides,
  };
}

describe('action rules', () => {
  describe('canLaunchProbe', () => {
    it('returns true with sufficient credits', () => {
      expect(
        canLaunchProbe(createPlayer({ probesInSpace: 0, probeSpaceLimit: 1 })),
      ).toBe(true);
    });

    it('returns false with insufficient credits', () => {
      const player = createPlayer({
        resources: {
          [EResource.CREDIT]: 1,
          [EResource.ENERGY]: 3,
          [EResource.DATA]: 0,
          [EResource.PUBLICITY]: 6,
        },
        probesInSpace: 0,
        probeSpaceLimit: 1,
      });
      expect(canLaunchProbe(player)).toBe(false);
    });
  });

  describe('canOrbit', () => {
    it('returns true with enough credit and energy', () => {
      expect(canOrbit(createPlayer(), createGameState())).toBe(true);
    });

    it('returns false without credit', () => {
      const player = createPlayer({
        resources: {
          [EResource.CREDIT]: 0,
          [EResource.ENERGY]: 3,
          [EResource.DATA]: 0,
          [EResource.PUBLICITY]: 6,
        },
      });
      expect(canOrbit(player, createGameState())).toBe(false);
    });

    it('returns false without energy', () => {
      const player = createPlayer({
        resources: {
          [EResource.CREDIT]: 4,
          [EResource.ENERGY]: 0,
          [EResource.DATA]: 0,
          [EResource.PUBLICITY]: 6,
        },
      });
      expect(canOrbit(player, createGameState())).toBe(false);
    });
  });

  describe('canLand', () => {
    it('returns true with enough energy', () => {
      expect(canLand(createPlayer(), createGameState())).toBe(true);
    });

    it('returns false with insufficient energy', () => {
      const player = createPlayer({
        resources: {
          [EResource.CREDIT]: 4,
          [EResource.ENERGY]: 1,
          [EResource.DATA]: 0,
          [EResource.PUBLICITY]: 6,
        },
      });
      expect(canLand(player, createGameState())).toBe(false);
    });
  });

  describe('canScan', () => {
    it('returns true with 1 credit and 2 energy', () => {
      expect(canScan(createPlayer())).toBe(true);
    });

    it('returns false without enough credit', () => {
      const player = createPlayer({
        resources: {
          [EResource.CREDIT]: 0,
          [EResource.ENERGY]: 3,
          [EResource.DATA]: 0,
          [EResource.PUBLICITY]: 6,
        },
      });
      expect(canScan(player)).toBe(false);
    });

    it('returns false without enough energy', () => {
      const player = createPlayer({
        resources: {
          [EResource.CREDIT]: 4,
          [EResource.ENERGY]: 1,
          [EResource.DATA]: 0,
          [EResource.PUBLICITY]: 6,
        },
      });
      expect(canScan(player)).toBe(false);
    });
  });

  describe('canAnalyzeData', () => {
    it('returns true when top row is full and energy >= 1', () => {
      const player = createPlayer({
        computer: {
          columns: [
            {
              topFilled: true,
              topReward: null,
              techId: null,
              hasBottomSlot: false,
              bottomFilled: false,
              bottomReward: null,
              techSlotAvailable: true,
            },
            {
              topFilled: true,
              topReward: null,
              techId: null,
              hasBottomSlot: false,
              bottomFilled: false,
              bottomReward: null,
              techSlotAvailable: true,
            },
            {
              topFilled: true,
              topReward: null,
              techId: null,
              hasBottomSlot: false,
              bottomFilled: false,
              bottomReward: null,
              techSlotAvailable: true,
            },
          ],
        },
      });
      expect(canAnalyzeData(player)).toBe(true);
    });

    it('returns false when top row is not full', () => {
      const player = createPlayer({
        computer: {
          columns: [
            {
              topFilled: true,
              topReward: null,
              techId: null,
              hasBottomSlot: false,
              bottomFilled: false,
              bottomReward: null,
              techSlotAvailable: true,
            },
            {
              topFilled: false,
              topReward: null,
              techId: null,
              hasBottomSlot: false,
              bottomFilled: false,
              bottomReward: null,
              techSlotAvailable: true,
            },
            {
              topFilled: false,
              topReward: null,
              techId: null,
              hasBottomSlot: false,
              bottomFilled: false,
              bottomReward: null,
              techSlotAvailable: true,
            },
          ],
        },
      });
      expect(canAnalyzeData(player)).toBe(false);
    });

    it('returns false without energy', () => {
      const player = createPlayer({
        resources: {
          [EResource.CREDIT]: 4,
          [EResource.ENERGY]: 0,
          [EResource.DATA]: 0,
          [EResource.PUBLICITY]: 6,
        },
        computer: {
          columns: [
            {
              topFilled: true,
              topReward: null,
              techId: null,
              hasBottomSlot: false,
              bottomFilled: false,
              bottomReward: null,
              techSlotAvailable: true,
            },
            {
              topFilled: true,
              topReward: null,
              techId: null,
              hasBottomSlot: false,
              bottomFilled: false,
              bottomReward: null,
              techSlotAvailable: true,
            },
            {
              topFilled: true,
              topReward: null,
              techId: null,
              hasBottomSlot: false,
              bottomFilled: false,
              bottomReward: null,
              techSlotAvailable: true,
            },
          ],
        },
      });
      expect(canAnalyzeData(player)).toBe(false);
    });
  });

  describe('canPlayCard', () => {
    it('returns true when player has cards in hand', () => {
      expect(canPlayCard(createPlayer())).toBe(true);
    });

    it('returns false when hand is empty', () => {
      expect(canPlayCard(createPlayer({ handSize: 0 }))).toBe(false);
    });
  });

  describe('canResearchTechAction', () => {
    it('returns true with 6 publicity and available techs', () => {
      expect(canResearchTechAction(createPlayer(), createGameState())).toBe(
        true,
      );
    });

    it('returns false with insufficient publicity', () => {
      const player = createPlayer({
        resources: {
          [EResource.CREDIT]: 4,
          [EResource.ENERGY]: 3,
          [EResource.DATA]: 0,
          [EResource.PUBLICITY]: 5,
        },
      });
      expect(canResearchTechAction(player, createGameState())).toBe(false);
    });

    it('returns false when no techs available', () => {
      const emptyTechBoard: IPublicTechBoard = {
        stacks: [ETech.PROBE, ETech.SCAN, ETech.COMPUTER].flatMap((cat) =>
          [0, 1, 2, 3].map((level) => ({
            tech: cat,
            level,
            remainingTiles: 0,
            firstTakeBonusAvailable: false,
          })),
        ),
      };
      expect(
        canResearchTechAction(
          createPlayer(),
          createGameState({ techBoard: emptyTechBoard }),
        ),
      ).toBe(false);
    });
  });

  describe('getAvailableMainActions', () => {
    it('always includes PASS', () => {
      const actions = getAvailableMainActions(
        createPlayer(),
        createGameState(),
      );
      expect(actions).toContain(EMainAction.PASS);
    });

    it('includes all actions for a well-resourced player', () => {
      const player = createPlayer({
        computer: {
          columns: [
            {
              topFilled: true,
              topReward: null,
              techId: null,
              hasBottomSlot: false,
              bottomFilled: false,
              bottomReward: null,
              techSlotAvailable: true,
            },
            {
              topFilled: true,
              topReward: null,
              techId: null,
              hasBottomSlot: false,
              bottomFilled: false,
              bottomReward: null,
              techSlotAvailable: true,
            },
            {
              topFilled: true,
              topReward: null,
              techId: null,
              hasBottomSlot: false,
              bottomFilled: false,
              bottomReward: null,
              techSlotAvailable: true,
            },
          ],
        },
      });
      const actions = getAvailableMainActions(player, createGameState());
      expect(actions).toContain(EMainAction.LAUNCH_PROBE);
      expect(actions).toContain(EMainAction.ORBIT);
      expect(actions).toContain(EMainAction.LAND);
      expect(actions).toContain(EMainAction.SCAN);
      expect(actions).toContain(EMainAction.ANALYZE_DATA);
      expect(actions).toContain(EMainAction.PLAY_CARD);
      expect(actions).toContain(EMainAction.RESEARCH_TECH);
    });

    it('excludes actions the player cannot afford', () => {
      const player = createPlayer({
        resources: {
          [EResource.CREDIT]: 0,
          [EResource.ENERGY]: 0,
          [EResource.DATA]: 0,
          [EResource.PUBLICITY]: 0,
        },
        handSize: 0,
      });
      const actions = getAvailableMainActions(player, createGameState());
      expect(actions).not.toContain(EMainAction.LAUNCH_PROBE);
      expect(actions).not.toContain(EMainAction.ORBIT);
      expect(actions).not.toContain(EMainAction.SCAN);
      expect(actions).not.toContain(EMainAction.ANALYZE_DATA);
      expect(actions).not.toContain(EMainAction.PLAY_CARD);
      expect(actions).not.toContain(EMainAction.RESEARCH_TECH);
      expect(actions).toContain(EMainAction.PASS);
    });
  });
});
