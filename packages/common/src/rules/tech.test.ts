import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
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
} from '@seti/common/rules/tech';
import { EResource, ETech } from '@seti/common/types/element';
import type {
  IPublicPlayerState,
  IPublicTechBoard,
} from '@seti/common/types/protocol/gameState';
import { ETechId } from '@seti/common/types/tech';

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
      assert.ok(stack);
      assert.equal(stack.tech, ETech.PROBE);
      assert.equal(stack.level, 0);
    });

    it('returns undefined for non-existent stack', () => {
      const board: IPublicTechBoard = { stacks: [] };
      assert.equal(findTechStack(board, ETech.PROBE, 0), undefined);
    });
  });

  describe('isTechStackEmpty', () => {
    it('returns false when tiles remain', () => {
      const board = createTechBoard();
      assert.equal(isTechStackEmpty(board, ETech.PROBE, 0), false);
    });

    it('returns true when no tiles remain', () => {
      const board = createTechBoard();
      const stack = findTechStack(board, ETech.SCAN, 2);
      if (stack) stack.remainingTiles = 0;
      assert.equal(isTechStackEmpty(board, ETech.SCAN, 2), true);
    });
  });

  describe('hasFirstTakeBonus', () => {
    it('returns true when bonus is available', () => {
      const board = createTechBoard();
      assert.equal(hasFirstTakeBonus(board, ETech.COMPUTER, 1), true);
    });

    it('returns false after bonus claimed', () => {
      const board = createTechBoard();
      const stack = findTechStack(board, ETech.COMPUTER, 1);
      if (stack) stack.firstTakeBonusAvailable = false;
      assert.equal(hasFirstTakeBonus(board, ETech.COMPUTER, 1), false);
    });
  });

  describe('playerHasTech / playerHasTechBySpec', () => {
    it('returns false for player without techs', () => {
      const player = createPlayerState();
      assert.equal(playerHasTech(player, ETechId.PROBE_DOUBLE_PROBE), false);
    });

    it('returns true when player owns the tech', () => {
      const player = createPlayerState({
        techs: [ETechId.PROBE_DOUBLE_PROBE, ETechId.SCAN_EARTH_LOOK],
      });
      assert.equal(playerHasTech(player, ETechId.PROBE_DOUBLE_PROBE), true);
      assert.equal(playerHasTechBySpec(player, ETech.SCAN, 0), true);
      assert.equal(playerHasTechBySpec(player, ETech.COMPUTER, 0), false);
    });
  });

  describe('canResearchTech', () => {
    it('allows research on non-empty stack the player does not own', () => {
      const player = createPlayerState();
      const board = createTechBoard();
      assert.equal(canResearchTech(player, board, ETech.PROBE, 0), true);
    });

    it('blocks research if player already owns it', () => {
      const player = createPlayerState({
        techs: [ETechId.PROBE_DOUBLE_PROBE],
      });
      const board = createTechBoard();
      assert.equal(canResearchTech(player, board, ETech.PROBE, 0), false);
    });

    it('blocks research on empty stack', () => {
      const player = createPlayerState();
      const board = createTechBoard();
      const stack = findTechStack(board, ETech.PROBE, 0);
      if (stack) stack.remainingTiles = 0;
      assert.equal(canResearchTech(player, board, ETech.PROBE, 0), false);
    });
  });

  describe('canAffordResearch', () => {
    it('returns true when publicity >= 6', () => {
      const player = createPlayerState();
      assert.equal(canAffordResearch(player), true);
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
      assert.equal(canAffordResearch(player), false);
    });
  });

  describe('getAvailableTechs', () => {
    it('returns all 12 techs for a fresh player', () => {
      const player = createPlayerState();
      const board = createTechBoard();
      const available = getAvailableTechs(player, board);
      assert.equal(available.length, 12);
    });

    it('excludes techs already owned', () => {
      const player = createPlayerState({
        techs: [ETechId.PROBE_DOUBLE_PROBE, ETechId.COMPUTER_VP_CARD],
      });
      const board = createTechBoard();
      const available = getAvailableTechs(player, board);
      assert.equal(available.length, 10);
      assert.ok(!available.includes(ETechId.PROBE_DOUBLE_PROBE));
      assert.ok(!available.includes(ETechId.COMPUTER_VP_CARD));
    });

    it('excludes depleted stacks', () => {
      const player = createPlayerState();
      const board = createTechBoard();
      const stack = findTechStack(board, ETech.SCAN, 3);
      if (stack) stack.remainingTiles = 0;
      const available = getAvailableTechs(player, board);
      assert.equal(available.length, 11);
      assert.ok(!available.includes(ETechId.SCAN_ENERGY_LAUNCH));
    });
  });

  describe('countTechsInCategory', () => {
    it('returns 0 for empty techs', () => {
      assert.equal(countTechsInCategory(createPlayerState(), ETech.PROBE), 0);
    });

    it('counts techs in the correct category', () => {
      const player = createPlayerState({
        techs: [
          ETechId.PROBE_DOUBLE_PROBE,
          ETechId.PROBE_ASTEROID,
          ETechId.SCAN_EARTH_LOOK,
        ],
      });
      assert.equal(countTechsInCategory(player, ETech.PROBE), 2);
      assert.equal(countTechsInCategory(player, ETech.SCAN), 1);
      assert.equal(countTechsInCategory(player, ETech.COMPUTER), 0);
    });
  });
});
