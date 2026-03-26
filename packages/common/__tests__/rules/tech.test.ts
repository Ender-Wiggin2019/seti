import { describe, expect, it } from 'vitest';
import {
  canAffordResearch,
  canResearchTech,
  countTechsInCategory,
  findTechStack,
  getAvailableTechs,
  hasFirstTakeBonus,
  isTechStackEmpty,
  playerHasTech,
  playerHasTechBySpec,
} from '@/rules/tech';
import { EResource, ETech } from '@/types/element';
import type {
  IPublicPlayerState,
  IPublicTechBoard,
} from '@/types/protocol/gameState';
import { ETechId } from '@/types/tech';

function createPlayerState(
  overrides?: Partial<IPublicPlayerState>,
): IPublicPlayerState {
  return {
    playerId: 'player-a',
    playerName: 'Player A',
    seatIndex: 0,
    color: 'red',
    score: 0,
    handSize: 0,
    resources: {
      [EResource.CREDIT]: 4,
      [EResource.ENERGY]: 3,
      [EResource.DATA]: 0,
      [EResource.PUBLICITY]: 6,
    },
    traces: {},
    computer: { topSlots: [null], bottomSlots: [null] },
    dataPoolCount: 0,
    dataPoolMax: 0,
    pieces: { probes: 0, orbiters: 0, landers: 0, signalMarkers: 0 },
    techs: [],
    passed: false,
    movementPoints: 0,
    dataStashCount: 0,
    probesInSpace: 0,
    ...overrides,
  };
}

function createTechBoard(): IPublicTechBoard {
  const stacks = [];
  const categories = [ETech.PROBE, ETech.SCAN, ETech.COMPUTER] as const;
  for (const category of categories) {
    for (let level = 0; level < 4; level++) {
      stacks.push({
        tech: category,
        level,
        remainingTiles: 4,
        firstTakeBonusAvailable: true,
      });
    }
  }
  return { stacks };
}

describe('tech rules', () => {
  describe('findTechStack', () => {
    it('returns the matching stack', () => {
      const board = createTechBoard();
      const stack = findTechStack(board, ETech.PROBE, 0);
      expect(stack).toBeDefined();
      expect(stack!.tech).toBe(ETech.PROBE);
      expect(stack!.level).toBe(0);
    });

    it('returns undefined for non-existent stack', () => {
      const board: IPublicTechBoard = { stacks: [] };
      expect(findTechStack(board, ETech.PROBE, 0)).toBeUndefined();
    });
  });

  describe('isTechStackEmpty', () => {
    it('returns false when tiles remain', () => {
      const board = createTechBoard();
      expect(isTechStackEmpty(board, ETech.PROBE, 0)).toBe(false);
    });

    it('returns true when no tiles remain', () => {
      const board = createTechBoard();
      const stack = findTechStack(board, ETech.SCAN, 2);
      if (stack) stack.remainingTiles = 0;
      expect(isTechStackEmpty(board, ETech.SCAN, 2)).toBe(true);
    });
  });

  describe('hasFirstTakeBonus', () => {
    it('returns true when bonus is available', () => {
      const board = createTechBoard();
      expect(hasFirstTakeBonus(board, ETech.COMPUTER, 1)).toBe(true);
    });

    it('returns false after bonus claimed', () => {
      const board = createTechBoard();
      const stack = findTechStack(board, ETech.COMPUTER, 1);
      if (stack) stack.firstTakeBonusAvailable = false;
      expect(hasFirstTakeBonus(board, ETech.COMPUTER, 1)).toBe(false);
    });
  });

  describe('playerHasTech / playerHasTechBySpec', () => {
    it('returns false for player without techs', () => {
      const player = createPlayerState();
      expect(playerHasTech(player, ETechId.PROBE_DOUBLE_PROBE)).toBe(false);
    });

    it('returns true when player owns the tech', () => {
      const player = createPlayerState({
        techs: [ETechId.PROBE_DOUBLE_PROBE, ETechId.SCAN_EARTH_LOOK],
      });
      expect(playerHasTech(player, ETechId.PROBE_DOUBLE_PROBE)).toBe(true);
      expect(playerHasTechBySpec(player, ETech.SCAN, 0)).toBe(true);
      expect(playerHasTechBySpec(player, ETech.COMPUTER, 0)).toBe(false);
    });
  });

  describe('canResearchTech', () => {
    it('allows research on non-empty stack the player does not own', () => {
      const player = createPlayerState();
      const board = createTechBoard();
      expect(canResearchTech(player, board, ETech.PROBE, 0)).toBe(true);
    });

    it('blocks research if player already owns it', () => {
      const player = createPlayerState({
        techs: [ETechId.PROBE_DOUBLE_PROBE],
      });
      const board = createTechBoard();
      expect(canResearchTech(player, board, ETech.PROBE, 0)).toBe(false);
    });

    it('blocks research on empty stack', () => {
      const player = createPlayerState();
      const board = createTechBoard();
      const stack = findTechStack(board, ETech.PROBE, 0);
      if (stack) stack.remainingTiles = 0;
      expect(canResearchTech(player, board, ETech.PROBE, 0)).toBe(false);
    });
  });

  describe('canAffordResearch', () => {
    it('returns true when publicity >= 6', () => {
      const player = createPlayerState();
      expect(canAffordResearch(player)).toBe(true);
    });

    it('returns false when publicity < 6', () => {
      const player = createPlayerState({
        resources: {
          [EResource.CREDIT]: 4,
          [EResource.ENERGY]: 3,
          [EResource.DATA]: 0,
          [EResource.PUBLICITY]: 5,
        },
      });
      expect(canAffordResearch(player)).toBe(false);
    });
  });

  describe('getAvailableTechs', () => {
    it('returns all 12 techs for a fresh player', () => {
      const player = createPlayerState();
      const board = createTechBoard();
      const available = getAvailableTechs(player, board);
      expect(available).toHaveLength(12);
    });

    it('excludes techs already owned', () => {
      const player = createPlayerState({
        techs: [ETechId.PROBE_DOUBLE_PROBE, ETechId.COMPUTER_VP_CARD],
      });
      const board = createTechBoard();
      const available = getAvailableTechs(player, board);
      expect(available).toHaveLength(10);
      expect(available).not.toContain(ETechId.PROBE_DOUBLE_PROBE);
      expect(available).not.toContain(ETechId.COMPUTER_VP_CARD);
    });

    it('excludes depleted stacks', () => {
      const player = createPlayerState();
      const board = createTechBoard();
      const stack = findTechStack(board, ETech.SCAN, 3);
      if (stack) stack.remainingTiles = 0;
      const available = getAvailableTechs(player, board);
      expect(available).toHaveLength(11);
      expect(available).not.toContain(ETechId.SCAN_ENERGY_LAUNCH);
    });
  });

  describe('countTechsInCategory', () => {
    it('returns 0 for empty techs', () => {
      expect(countTechsInCategory(createPlayerState(), ETech.PROBE)).toBe(0);
    });

    it('counts techs in the correct category', () => {
      const player = createPlayerState({
        techs: [
          ETechId.PROBE_DOUBLE_PROBE,
          ETechId.PROBE_ASTEROID,
          ETechId.SCAN_EARTH_LOOK,
        ],
      });
      expect(countTechsInCategory(player, ETech.PROBE)).toBe(2);
      expect(countTechsInCategory(player, ETech.SCAN)).toBe(1);
      expect(countTechsInCategory(player, ETech.COMPUTER)).toBe(0);
    });
  });
});
