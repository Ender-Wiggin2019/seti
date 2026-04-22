import { EMainAction, EPlanet } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ETechId, RESEARCH_PUBLICITY_COST } from '@seti/common/types/tech';
import { vi } from 'vitest';
import { ResearchTechAction } from '@/engine/actions/ResearchTech.js';
import { BoardBuilder } from '@/engine/board/BoardBuilder.js';
import type { Deck } from '@/engine/deck/Deck.js';
import { ResearchTechEffect } from '@/engine/effects/tech/ResearchTechEffect.js';
import { Game } from '@/engine/Game.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { TechBoard } from '@/engine/tech/TechBoard.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';
import { resolveSetupTucks } from '../../helpers/TestGameBuilder.js';

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

function getFirstAvailableTechId(
  techBoard: TechBoard,
  playerId: string,
): ETechId {
  const techId = techBoard.getAvailableTechs(playerId)[0];
  if (!techId) {
    throw new Error(`expected an available tech for player ${playerId}`);
  }
  return techId;
}

function getRotationCounter(game: IGame): number {
  if (!game.solarSystem) {
    throw new Error('expected solar system to be initialized');
  }
  return game.solarSystem.rotationCounter;
}

function getWaitingOptionModel(player: Player): ISelectOptionInputModel {
  if (!player.waitingFor) {
    throw new Error('expected player to be waiting for input');
  }
  return player.waitingFor.toModel() as ISelectOptionInputModel;
}

function getRequiredTechBoard(game: Game | IGame): TechBoard {
  if (!game.techBoard) {
    throw new Error('expected tech board to be initialized');
  }
  return game.techBoard;
}

function getRequiredNonComputerPick(model: ISelectOptionInputModel): {
  id: string;
  label: string;
} {
  const pick = model.options.find((option) => !option.id.startsWith('comp-'));
  if (!pick) {
    throw new Error('expected a non-computer tech option');
  }
  return pick;
}

function findProbeSpaceId(
  game: Game | IGame,
  probeId: string,
): string | undefined {
  return game.solarSystem?.spaces.find((space) =>
    space.occupants.some((probe) => probe.id === probeId),
  )?.id;
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
      const before = getRotationCounter(game);
      ResearchTechAction.execute(player, game, false);
      expect(getRotationCounter(game)).toBe(before + 1);
    });

    it('returns a PlayerInput when multiple techs are available', () => {
      const rng = new SeededRandom('test');
      const techBoard = new TechBoard(rng);
      const game = createMockGame(techBoard);
      const player = createPlayer();
      const input = ResearchTechAction.execute(player, game, false);
      expect(input).toBeDefined();
      expect(input?.type).toBe(EPlayerInputType.OPTION);
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
      const techId = getFirstAvailableTechId(techBoard, player.id);
      ResearchTechEffect.acquireTech(player, game, techId);
      expect(takeSpy).toHaveBeenCalledWith(player.id, techId);
    });

    it('adds the VP bonus to player score', () => {
      const rng = new SeededRandom('test');
      const techBoard = new TechBoard(rng);
      const game = createMockGame(techBoard);
      const player = createPlayer();
      const techId = getFirstAvailableTechId(techBoard, player.id);
      const scoreBefore = player.score;
      const result = ResearchTechEffect.acquireTech(player, game, techId);
      expect(player.score).toBeGreaterThanOrEqual(scoreBefore + result.vpBonus);
    });

    it('appends techId to player.techs', () => {
      const rng = new SeededRandom('test');
      const techBoard = new TechBoard(rng);
      const game = createMockGame(techBoard);
      const player = createPlayer();
      const techId = getFirstAvailableTechId(techBoard, player.id);
      ResearchTechEffect.acquireTech(player, game, techId);
      expect(player.techs).toContain(techId);
    });

    it('throws when acquiring a duplicate tech for the same player', () => {
      const rng = new SeededRandom('test');
      const techBoard = new TechBoard(rng);
      const game = createMockGame(techBoard);
      const player = createPlayer();
      const techId = getFirstAvailableTechId(techBoard, player.id);

      ResearchTechEffect.acquireTech(player, game, techId);

      expect(() =>
        ResearchTechEffect.acquireTech(player, game, techId),
      ).toThrowError(
        expect.objectContaining({
          code: EErrorCode.INVALID_ACTION,
        }),
      );
    });
  });
});

// ─────────────────────────────────────────────────────────────
// §2.7 ResearchTech — INTEGRATION loop through Game.processMainAction
// ─────────────────────────────────────────────────────────────

const INTEGRATION_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createIntegrationGame(seed: string): { game: Game; player: Player } {
  const game = Game.create(INTEGRATION_PLAYERS, { playerCount: 2 }, seed, seed);
  resolveSetupTucks(game);
  const player = game.players.find((p) => p.id === 'p1') as Player;
  return { game, player };
}

function findNonComputerTechId(game: Game): ETechId {
  const ids = getRequiredTechBoard(game).getAvailableTechs('p1');
  const nonComputer = ids.find((id) => !id.startsWith('comp-'));
  if (!nonComputer) {
    throw new Error('expected at least one non-computer tech to be available');
  }
  return nonComputer;
}

describe('ResearchTechAction — integration (2.7.x closure)', () => {
  describe('2.7.1 happy-path acquire loop', () => {
    it('spends 6 publicity, rotates, acquires the chosen tech and records it on the player', () => {
      const { game, player } = createIntegrationGame('research-2-7-1-happy');
      player.resources.gain({ publicity: RESEARCH_PUBLICITY_COST });
      const rotationBefore = getRotationCounter(game);
      const publicityBefore = player.resources.publicity;

      game.processMainAction(player.id, { type: EMainAction.RESEARCH_TECH });

      // Expect publicity paid and rotation ticked immediately.
      expect(player.resources.publicity).toBe(
        publicityBefore - RESEARCH_PUBLICITY_COST,
      );
      expect(getRotationCounter(game)).toBe(rotationBefore + 1);

      // A tech selection input is pending.
      const model = getWaitingOptionModel(player);
      expect(model.type).toBe(EPlayerInputType.OPTION);

      // Pick a non-computer tech so we don't detour through the column picker.
      const pick = getRequiredNonComputerPick(model);

      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: pick.id,
      });

      expect(player.techs).toContain(pick.id);
      expect(game.techBoard?.playerOwns(player.id, pick.id as ETechId)).toBe(
        true,
      );
    });
  });

  describe('2.7.4 first-taker collects the 2VP tile bonus on top of the pile', () => {
    it('awards +2 VP the very first time any stack is popped', () => {
      const { game, player } = createIntegrationGame('research-2-7-4-first-vp');
      player.resources.gain({ publicity: RESEARCH_PUBLICITY_COST });
      const scoreBefore = player.score;

      game.processMainAction(player.id, { type: EMainAction.RESEARCH_TECH });
      const model = getWaitingOptionModel(player);
      const pick = getRequiredNonComputerPick(model);
      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: pick.id,
      });

      // Score should include at least the +2 VP first-take bonus.
      expect(player.score - scoreBefore).toBeGreaterThanOrEqual(2);
      // The stack's first-take flag flips off.
      expect(
        getRequiredTechBoard(game).getStack(pick.id as ETechId)
          ?.firstTakeBonusAvailable,
      ).toBe(false);
    });
  });

  describe('2.7.2 research rotation moves probes with the real solar system disc', () => {
    it('rotates an existing Mercury probe onto a different ring-1 space before tech selection', () => {
      const { game, player } = createIntegrationGame('research-2-7-2-rotation');
      player.resources.gain({ publicity: RESEARCH_PUBLICITY_COST });
      const mercurySpace = game.solarSystem?.getSpacesOnPlanet(
        EPlanet.MERCURY,
      )[0];
      if (!mercurySpace || !game.solarSystem) {
        throw new Error('expected Mercury space in the solar system');
      }

      const probe = game.solarSystem.placeProbe(player.id, mercurySpace.id);
      const beforeSpaceId = findProbeSpaceId(game, probe.id);

      game.processMainAction(player.id, { type: EMainAction.RESEARCH_TECH });

      expect(findProbeSpaceId(game, probe.id)).toBeDefined();
      expect(findProbeSpaceId(game, probe.id)).not.toBe(beforeSpaceId);
      expect(
        game.solarSystem.spaces.filter((space) =>
          space.occupants.some((occupant) => occupant.id === probe.id),
        ),
      ).toHaveLength(1);
    });
  });

  describe('2.7.3 / 2.7E.3 the same tech cannot be acquired twice', () => {
    it('the chosen techId is removed from the available list after acquisition', () => {
      const { game, player } = createIntegrationGame('research-2-7-3-no-dup');
      player.resources.gain({ publicity: RESEARCH_PUBLICITY_COST });
      game.processMainAction(player.id, { type: EMainAction.RESEARCH_TECH });
      const first = getWaitingOptionModel(player);
      const picked = getRequiredNonComputerPick(first);
      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: picked.id,
      });

      const techBoard = getRequiredTechBoard(game);
      const available = techBoard.getAvailableTechs(player.id);
      expect(available).not.toContain(picked.id as ETechId);
      expect(techBoard.canResearch(player.id, picked.id as ETechId)).toBe(
        false,
      );
    });
  });

  describe('2.7E.2 full-board guard', () => {
    it('canExecute returns false once the player owns every tech', () => {
      const { game, player } = createIntegrationGame('research-2-7-e2-full');
      const techBoard = getRequiredTechBoard(game);
      const allTechs = techBoard.getAvailableTechs(player.id);
      for (const techId of allTechs) {
        techBoard.take(player.id, techId);
        player.gainTech(techId);
      }

      expect(ResearchTechAction.canExecute(player, game)).toBe(false);
    });
  });

  describe('2.7.7 card-effect path skips the 6-publicity cost and delegates rotation', () => {
    it('isCardEffect=true executes without deducting publicity and does not rotate on its own', () => {
      const { game, player } = createIntegrationGame(
        'research-2-7-7-card-effect',
      );
      player.resources.spend({ publicity: player.resources.publicity });
      const rotationBefore = getRotationCounter(game);

      const input = ResearchTechAction.execute(player, game, true);

      // Decoupled model: rotation (if any) is driven by the card's own
      // ROTATE icon via `BehaviorExecutor.buildRotateAction`, not by the
      // research effect itself.
      expect(player.resources.publicity).toBe(0);
      expect(getRotationCounter(game)).toBe(rotationBefore);
      expect(input).toBeDefined();
    });
  });

  describe('2.7.6 computer tech placement does not count as placed data', () => {
    it('leaves the top slot empty after acquiring comp-0 and only creates the bottom slot', () => {
      const { game, player } = createIntegrationGame('research-2-7-6-computer');
      player.resources.gain({ publicity: RESEARCH_PUBLICITY_COST });
      const computerTechId = ETechId.COMPUTER_VP_CREDIT;

      game.processMainAction(player.id, { type: EMainAction.RESEARCH_TECH });

      const techPick = getWaitingOptionModel(player);
      expect(
        techPick.options.some((option) => option.id === computerTechId),
      ).toBe(true);
      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: computerTechId,
      });

      const columnPick = getWaitingOptionModel(player);
      const chosenColumnId =
        columnPick.options.find((option) => option.id === 'col-0')?.id ??
        columnPick.options[0]?.id;
      if (!chosenColumnId) {
        throw new Error('expected a computer column selection');
      }
      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: chosenColumnId,
      });

      const columnState = player.computer.getColumnState(0);
      expect(player.techs).toContain(computerTechId);
      expect(columnState.techId).toBe(computerTechId);
      expect(columnState.hasBottomSlot).toBe(true);
      expect(columnState.topFilled).toBe(false);
      expect(columnState.bottomFilled).toBe(false);
      expect(player.computer.getPlacedCount()).toBe(0);
    });
  });

  describe('2.7.8 duplicate specific-tech card effects are ignored', () => {
    it('does not throw when a card grants an already-owned specific tech; rotation is decoupled', () => {
      const { game, player } = createIntegrationGame(
        'research-2-7-8-duplicate-card-effect',
      );
      const ownedTech = ETechId.COMPUTER_VP_CREDIT;
      const techBoard = getRequiredTechBoard(game);
      techBoard.take(player.id, ownedTech);
      player.gainTech(ownedTech);
      const rotationBefore = getRotationCounter(game);

      let input: ReturnType<typeof ResearchTechAction.execute> | undefined;

      expect(() => {
        input = ResearchTechAction.execute(player, game, true, {
          mode: 'specific',
          techIds: [ownedTech],
        });
      }).not.toThrow();

      expect(input).toBeUndefined();
      // Decoupled: the card-effect path never rotates on its own. If the
      // host card has a printed ROTATE icon, the rotation already happened
      // in `buildRotateAction` prior to the research effect.
      expect(getRotationCounter(game)).toBe(rotationBefore);
      expect(
        player.techs.filter((techId) => techId === ownedTech),
      ).toHaveLength(1);
      expect(player.resources.publicity).toBe(4);
    });
  });

  describe('2.7.5 tile bonus applies immediate resource/VP rewards', () => {
    it('acquiring a tech whose tile carries a bonus applies it through TechBonusEffect', () => {
      const { game, player } = createIntegrationGame(
        'research-2-7-5-tile-bonus',
      );
      const techId = findNonComputerTechId(game);
      // Snapshot every trackable reward surface so we can detect *any* delta.
      const before = {
        score: player.score,
        credits: player.resources.credits,
        energy: player.resources.energy,
        publicity: player.resources.publicity,
        data: player.resources.data,
        handSize: player.hand.length,
      };

      const stack = game.techBoard?.getStack(techId);
      if (!stack) {
        throw new Error(`expected tech stack for ${techId}`);
      }
      const topTileBonus = stack.tiles[0]?.bonus;
      const result = ResearchTechEffect.acquireTech(player, game, techId);

      expect(result.techId).toBe(techId);
      expect(result.vpBonus).toBe(2);
      // If the top tile had a bonus token we expect at least one reward
      // surface to have changed beyond the +2 first-take VP alone.
      if (topTileBonus) {
        expect(result.tileBonus).toBe(topTileBonus);
        const after = {
          score: player.score,
          credits: player.resources.credits,
          energy: player.resources.energy,
          publicity: player.resources.publicity,
          data: player.resources.data,
          handSize: player.hand.length,
        };
        const nonScoreChanged =
          after.credits !== before.credits ||
          after.energy !== before.energy ||
          after.publicity !== before.publicity ||
          after.data !== before.data ||
          after.handSize !== before.handSize;
        const extraVp = after.score - before.score > 2;
        expect(nonScoreChanged || extraVp).toBe(true);
      } else {
        // No bonus token ⇒ only +2 first-take VP should show up.
        expect(player.score).toBe(before.score + 2);
      }
    });
  });
});
