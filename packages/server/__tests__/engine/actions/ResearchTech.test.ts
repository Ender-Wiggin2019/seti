import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { RESEARCH_PUBLICITY_COST } from '@seti/common/types/tech';
import { vi } from 'vitest';
import { ResearchTechAction } from '@/engine/actions/ResearchTech.js';
import { BoardBuilder } from '@/engine/board/BoardBuilder.js';
import type { Deck } from '@/engine/deck/Deck.js';
import { ResearchTechEffect } from '@/engine/effects/tech/ResearchTechEffect.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { TechBoard } from '@/engine/tech/TechBoard.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

function createMockGame(techBoard?: TechBoard | null): IGame {
  const rng = new SeededRandom('test');
  const solarSystem = BoardBuilder.buildSolarSystemFromRandom(rng);
  const board =
    techBoard === undefined
      ? new TechBoard(new SeededRandom('tech-board'))
      : techBoard;
  return {
    solarSystem,
    planetaryBoard: null,
    techBoard: board,
    sectors: [],
    mainDeck: {
      draw: () => undefined,
      discard: () => undefined,
    } as unknown as Deck<string>,
    cardRow: [],
    endOfRoundStacks: [],
    hiddenAliens: [],
    neutralMilestones: [],
    roundRotationReminderIndex: 0,
    hasRoundFirstPassOccurred: false,
    rotationCounter: 0,
  } as unknown as IGame;
}

function createPlayer(
  overrides: {
    resources?: { credits: number; energy: number; publicity: number };
  } = {},
): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: {
      credits: 10,
      energy: 10,
      publicity: 10,
      ...overrides.resources,
    },
  });
}

describe('ResearchTechAction', () => {
  describe('canExecute', () => {
    it('returns true with enough publicity and available techs', () => {
      const game = createMockGame();
      const player = createPlayer();
      expect(ResearchTechAction.canExecute(player, game)).toBe(true);
    });

    it('returns false without enough publicity', () => {
      const game = createMockGame();
      const player = createPlayer({
        resources: {
          credits: 10,
          energy: 10,
          publicity: RESEARCH_PUBLICITY_COST - 1,
        },
      });
      expect(ResearchTechAction.canExecute(player, game, false)).toBe(false);
    });

    it('returns false when no techs are available', () => {
      const rng = new SeededRandom('test');
      const techBoard = new TechBoard(rng);
      vi.spyOn(techBoard, 'getAvailableTechs').mockReturnValue([]);
      const game = createMockGame(techBoard);
      const player = createPlayer();
      expect(ResearchTechAction.canExecute(player, game)).toBe(false);
    });

    it('returns false when techBoard is null', () => {
      const game = createMockGame(null);
      const player = createPlayer();
      expect(ResearchTechAction.canExecute(player, game)).toBe(false);
    });

    it('returns true with isCardEffect when publicity is too low (skips publicity check)', () => {
      const game = createMockGame();
      const player = createPlayer({
        resources: { credits: 10, energy: 10, publicity: 0 },
      });
      expect(ResearchTechAction.canExecute(player, game, true)).toBe(true);
    });
  });

  describe('execute', () => {
    it('spends publicity (6) when not a card effect', () => {
      const rng = new SeededRandom('test');
      const techBoard = new TechBoard(rng);
      const game = createMockGame(techBoard);
      const player = createPlayer();
      const before = player.resources.publicity;
      ResearchTechAction.execute(player, game, false);
      expect(player.resources.publicity).toBe(before - RESEARCH_PUBLICITY_COST);
    });

    it('rotates the solar system disc', () => {
      const rng = new SeededRandom('test');
      const techBoard = new TechBoard(rng);
      const game = createMockGame(techBoard);
      const player = createPlayer();
      const before = game.solarSystem!.rotationCounter;
      ResearchTechAction.execute(player, game, false);
      expect(game.solarSystem!.rotationCounter).toBe(before + 1);
    });

    it('returns a PlayerInput when multiple techs are available', () => {
      const rng = new SeededRandom('test');
      const techBoard = new TechBoard(rng);
      const game = createMockGame(techBoard);
      const player = createPlayer();
      const input = ResearchTechAction.execute(player, game, false);
      expect(input).toBeDefined();
      expect(input!.type).toBe(EPlayerInputType.OPTION);
    });

    it('throws when the action is illegal', () => {
      const rng = new SeededRandom('test');
      const techBoard = new TechBoard(rng);
      const game = createMockGame(techBoard);
      const player = createPlayer({
        resources: { credits: 10, energy: 10, publicity: 0 },
      });
      expect(() => ResearchTechAction.execute(player, game, false)).toThrow();
    });
  });

  describe('ResearchTechEffect.acquireTech (direct)', () => {
    it('takes the tech tile from the tech board', () => {
      const rng = new SeededRandom('test');
      const techBoard = new TechBoard(rng);
      const takeSpy = vi.spyOn(techBoard, 'take');
      const game = createMockGame(techBoard);
      const player = createPlayer();
      const techId = techBoard.getAvailableTechs(player.id)[0]!;
      ResearchTechEffect.acquireTech(player, game, techId);
      expect(takeSpy).toHaveBeenCalledWith(player.id, techId);
    });

    it('adds the VP bonus to player score', () => {
      const rng = new SeededRandom('test');
      const techBoard = new TechBoard(rng);
      const game = createMockGame(techBoard);
      const player = createPlayer();
      const techId = techBoard.getAvailableTechs(player.id)[0]!;
      const scoreBefore = player.score;
      const result = ResearchTechEffect.acquireTech(player, game, techId);
      expect(player.score).toBe(scoreBefore + result.vpBonus);
    });

    it('appends techId to player.techs', () => {
      const rng = new SeededRandom('test');
      const techBoard = new TechBoard(rng);
      const game = createMockGame(techBoard);
      const player = createPlayer();
      const techId = techBoard.getAvailableTechs(player.id)[0]!;
      ResearchTechEffect.acquireTech(player, game, techId);
      expect(player.techs).toContain(techId);
    });
  });
});
