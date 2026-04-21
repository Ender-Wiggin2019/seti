import { describe, expect, it } from 'vitest';
import {
  canBuyCard,
  canCompleteMission,
  canConvertEnergyToMovement,
  canExchangeResources,
  canMoveProbe,
  canPlaceData,
  canUseFreeActionCorner,
  getAvailableFreeActions,
  validateMovementPath,
} from '@/rules/freeActions';
import { EResource } from '@/types/element';
import { EFreeAction, EPhase } from '@/types/protocol/enums';
import type {
  IPublicComputerColumnState,
  IPublicGameState,
  IPublicPlayerState,
  IPublicSolarSystemState,
} from '@/types/protocol/gameState';
import { ETechId } from '@/types/tech';

function emptyCol(
  overrides?: Partial<IPublicComputerColumnState>,
): IPublicComputerColumnState {
  return {
    topFilled: false,
    topReward: null,
    techId: null,
    hasBottomSlot: false,
    bottomFilled: false,
    bottomReward: null,
    techSlotAvailable: true,
    ...overrides,
  };
}

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
      [EResource.PUBLICITY]: 4,
    },
    traces: {},
    tracesByAlien: {},
    computer: { columns: [emptyCol(), emptyCol(), emptyCol()] },
    dataPoolCount: 2,
    dataPoolMax: 6,
    pieces: { probes: 3, orbiters: 3, landers: 3, signalMarkers: 5 },
    techs: [],
    passed: false,
    movementPoints: 0,
    dataStashCount: 0,
    probesInSpace: 1,
    probeSpaceLimit: 1,
    completedMissionCount: 0,
    endGameCardCount: 0,
    creditIncome: 4,
    energyIncome: 3,
    cardIncome: 0,
    ...overrides,
  };
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
    solarSystem: { spaces: [], adjacency: {}, probes: [], discs: [] },
    sectors: [],
    planetaryBoard: { planets: {} },
    techBoard: { stacks: [] },
    cardRow: [],
    aliens: [],
    recentEvents: [],
    milestones: { goldMilestones: [], neutralMilestones: [] },
    goldScoringTiles: [],
    ...overrides,
    undoAllowed: overrides?.undoAllowed ?? false,
    canUndo: overrides?.canUndo ?? false,
    turnIndex: overrides?.turnIndex ?? 0,
  };
}

function createSolarSystem(): IPublicSolarSystemState {
  return {
    spaces: ['s0', 's1', 's2', 's3'],
    adjacency: {
      s0: ['s1'],
      s1: ['s0', 's2'],
      s2: ['s1', 's3'],
      s3: ['s2'],
    },
    probes: [{ playerId: 'p1', spaceId: 's0' }],
    discs: [],
    spaceStates: {
      s0: {
        spaceId: 's0',
        ringIndex: 1,
        indexInRing: 0,
        hasPublicityIcon: false,
        elementTypes: ['EMPTY'],
      },
      s1: {
        spaceId: 's1',
        ringIndex: 1,
        indexInRing: 1,
        hasPublicityIcon: true,
        elementTypes: ['EMPTY'],
      },
      s2: {
        spaceId: 's2',
        ringIndex: 1,
        indexInRing: 2,
        hasPublicityIcon: false,
        elementTypes: ['ASTEROID'],
      },
      s3: {
        spaceId: 's3',
        ringIndex: 1,
        indexInRing: 3,
        hasPublicityIcon: false,
        elementTypes: ['EMPTY'],
      },
    },
  };
}

describe('free action rules', () => {
  describe('validateMovementPath', () => {
    it('rejects path with fewer than 2 elements', () => {
      const result = validateMovementPath(createSolarSystem(), ['s0']);
      expect(result.valid).toBe(false);
    });

    it('validates a simple 2-step path', () => {
      const result = validateMovementPath(createSolarSystem(), ['s0', 's1']);
      expect(result.valid).toBe(true);
      expect(result.totalCost).toBe(1);
    });

    it('calculates multi-step cost', () => {
      const result = validateMovementPath(createSolarSystem(), [
        's0',
        's1',
        's2',
      ]);
      expect(result.valid).toBe(true);
      expect(result.totalCost).toBe(2);
    });

    it('adds extra cost for leaving asteroid', () => {
      const result = validateMovementPath(createSolarSystem(), ['s2', 's3']);
      expect(result.valid).toBe(true);
      expect(result.totalCost).toBe(2);
    });

    it('rejects path with non-adjacent spaces', () => {
      const result = validateMovementPath(createSolarSystem(), ['s0', 's3']);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects path through sun', () => {
      const ss = createSolarSystem();
      ss.spaceStates!['s1'] = {
        ...ss.spaceStates!['s1'],
        elementTypes: ['SUN'],
      };
      const result = validateMovementPath(ss, ['s0', 's1']);
      expect(result.valid).toBe(false);
    });
  });

  describe('canMoveProbe', () => {
    it('returns true when probe in space and movement available', () => {
      const player = createPlayer({
        probesInSpace: 1,
        movementPoints: 1,
      });
      expect(canMoveProbe(player, createGameState())).toBe(true);
    });

    it('returns true when probe in space and energy available', () => {
      const player = createPlayer({
        probesInSpace: 1,
        movementPoints: 0,
        resources: {
          [EResource.CREDIT]: 4,
          [EResource.ENERGY]: 1,
          [EResource.DATA]: 0,
          [EResource.PUBLICITY]: 4,
        },
      });
      expect(canMoveProbe(player, createGameState())).toBe(true);
    });

    it('returns false when no probes in space', () => {
      const player = createPlayer({
        probesInSpace: 0,
        movementPoints: 5,
      });
      expect(canMoveProbe(player, createGameState())).toBe(false);
    });

    it('returns false when no movement and no energy', () => {
      const player = createPlayer({
        probesInSpace: 1,
        movementPoints: 0,
        resources: {
          [EResource.CREDIT]: 4,
          [EResource.ENERGY]: 0,
          [EResource.DATA]: 0,
          [EResource.PUBLICITY]: 4,
        },
      });
      expect(canMoveProbe(player, createGameState())).toBe(false);
    });
  });

  describe('canConvertEnergyToMovement', () => {
    it('returns true with energy', () => {
      expect(canConvertEnergyToMovement(createPlayer())).toBe(true);
    });

    it('returns false without energy', () => {
      const player = createPlayer({
        resources: {
          [EResource.CREDIT]: 4,
          [EResource.ENERGY]: 0,
          [EResource.DATA]: 0,
          [EResource.PUBLICITY]: 4,
        },
      });
      expect(canConvertEnergyToMovement(player)).toBe(false);
    });
  });

  describe('canPlaceData', () => {
    it('returns true with data in pool and computer slot available', () => {
      expect(canPlaceData(createPlayer())).toBe(true);
    });

    it('returns false when data pool is empty', () => {
      expect(canPlaceData(createPlayer({ dataPoolCount: 0 }))).toBe(false);
    });

    it('returns false when top full and no bottom slots available', () => {
      const player = createPlayer({
        computer: {
          columns: [
            emptyCol({ topFilled: true }),
            emptyCol({ topFilled: true }),
            emptyCol({ topFilled: true }),
          ],
        },
      });
      expect(canPlaceData(player)).toBe(false);
    });

    it('returns true when top full and has tech-unlocked bottom slot', () => {
      const player = createPlayer({
        computer: {
          columns: [
            emptyCol({
              topFilled: true,
              hasBottomSlot: true,
              techId: ETechId.COMPUTER_VP_CREDIT,
            }),
            emptyCol({ topFilled: true }),
            emptyCol({ topFilled: true }),
          ],
        },
      });
      expect(canPlaceData(player)).toBe(true);
    });

    it('returns false when all bottom slots filled', () => {
      const player = createPlayer({
        computer: {
          columns: [
            emptyCol({
              topFilled: true,
              hasBottomSlot: true,
              bottomFilled: true,
            }),
            emptyCol({ topFilled: true }),
            emptyCol({ topFilled: true }),
          ],
        },
      });
      expect(canPlaceData(player)).toBe(false);
    });
  });

  describe('canCompleteMission', () => {
    it('always returns false (TODO)', () => {
      expect(canCompleteMission(createPlayer())).toBe(false);
    });
  });

  describe('canUseFreeActionCorner', () => {
    it('returns true with cards in hand', () => {
      expect(canUseFreeActionCorner(createPlayer())).toBe(true);
    });

    it('returns false with empty hand', () => {
      expect(canUseFreeActionCorner(createPlayer({ handSize: 0 }))).toBe(false);
    });
  });

  describe('canBuyCard', () => {
    it('returns true with publicity >= 3', () => {
      expect(canBuyCard(createPlayer())).toBe(true);
    });

    it('returns false with publicity < 3', () => {
      const player = createPlayer({
        resources: {
          [EResource.CREDIT]: 4,
          [EResource.ENERGY]: 3,
          [EResource.DATA]: 0,
          [EResource.PUBLICITY]: 2,
        },
      });
      expect(canBuyCard(player)).toBe(false);
    });
  });

  describe('canExchangeResources', () => {
    it('returns true with 2+ credits', () => {
      expect(canExchangeResources(createPlayer())).toBe(true);
    });

    it('returns true with 2+ energy', () => {
      const player = createPlayer({
        resources: {
          [EResource.CREDIT]: 0,
          [EResource.ENERGY]: 2,
          [EResource.DATA]: 0,
          [EResource.PUBLICITY]: 0,
        },
        handSize: 0,
      });
      expect(canExchangeResources(player)).toBe(true);
    });

    it('returns true with 2+ cards in hand', () => {
      const player = createPlayer({
        resources: {
          [EResource.CREDIT]: 0,
          [EResource.ENERGY]: 0,
          [EResource.DATA]: 0,
          [EResource.PUBLICITY]: 0,
        },
        handSize: 2,
      });
      expect(canExchangeResources(player)).toBe(true);
    });

    it('returns false when all below 2', () => {
      const player = createPlayer({
        resources: {
          [EResource.CREDIT]: 1,
          [EResource.ENERGY]: 1,
          [EResource.DATA]: 0,
          [EResource.PUBLICITY]: 0,
        },
        handSize: 1,
      });
      expect(canExchangeResources(player)).toBe(false);
    });
  });

  describe('getAvailableFreeActions', () => {
    it('includes movement when probe in space and has energy', () => {
      const player = createPlayer({ probesInSpace: 1 });
      const actions = getAvailableFreeActions(player, createGameState());
      expect(actions).toContain(EFreeAction.MOVEMENT);
    });

    it('includes place data when pool has data', () => {
      const actions = getAvailableFreeActions(
        createPlayer(),
        createGameState(),
      );
      expect(actions).toContain(EFreeAction.PLACE_DATA);
    });

    it('includes buy card with 4 publicity', () => {
      const actions = getAvailableFreeActions(
        createPlayer(),
        createGameState(),
      );
      expect(actions).toContain(EFreeAction.BUY_CARD);
    });

    it('does not include complete mission (TODO)', () => {
      const actions = getAvailableFreeActions(
        createPlayer(),
        createGameState(),
      );
      expect(actions).not.toContain(EFreeAction.COMPLETE_MISSION);
    });
  });
});
