import { alienCards } from '@seti/common/data/alienCards';
import { EResource } from '@seti/common/types/element';
import { EAlienType } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { AlienRegistry } from '@/engine/alien/AlienRegistry.js';
import { AlienState } from '@/engine/alien/AlienState.js';
import {
  type AlienBoard,
  type CentauriansAlienBoard,
  isCentauriansAlienBoard,
} from '@/engine/alien/AlienBoard.js';
import { Game } from '@/engine/Game.js';
import {
  getPlayer,
  resolveSetupTucks,
} from '../../../helpers/TestGameBuilder.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createCentauriansGame(seed: string): { game: Game; board: AlienBoard } {
  const game = Game.create(
    TEST_PLAYERS,
    { playerCount: 2, alienModulesEnabled: [true, true, false, false, false] },
    seed,
    seed,
  );
  resolveSetupTucks(game);
  game.alienState = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
  const board = game.alienState.getBoardByType(EAlienType.CENTAURIANS);
  if (!board) {
    throw new Error('expected Centaurians board');
  }
  return { game, board };
}

function placeDiscoveryMarker(board: AlienBoard, playerId: string, index: number) {
  const slot = board.getDiscoverySlots()[index];
  if (!slot) {
    throw new Error(`missing discovery slot ${index}`);
  }
  board.placeTrace(slot, { playerId }, slot.traceColor);
}

function centaurianCardIdsInHand(game: Game, playerId: string): string[] {
  return getPlayer(game, playerId).hand
    .map((card) => (typeof card === 'string' ? card : card.id))
    .filter((cardId): cardId is string =>
      alienCards.some(
        (card) => card.id === cardId && card.alien === EAlienType.CENTAURIANS,
      ),
    );
}

function getCentauriansBoard(game: Game): CentauriansAlienBoard {
  const board = game.alienState.getBoardByType(EAlienType.CENTAURIANS);
  if (!isCentauriansAlienBoard(board)) {
    throw new Error('expected Centaurians board');
  }
  return board;
}

function chooseCentauriansReward(
  input: unknown,
  predicate: (option: { id: string; label: string }) => boolean = () => true,
) {
  const rewardInput = input as {
    toModel: () => ISelectOptionInputModel;
    process: (response: {
      type: EPlayerInputType.OPTION;
      optionId: string;
    }) => unknown;
  };
  const model = rewardInput.toModel();
  const option = model.options.find(predicate);
  if (!option) {
    throw new Error('expected Centaurians reward option');
  }
  return rewardInput.process({
    type: EPlayerInputType.OPTION,
    optionId: option.id,
  });
}

describe('CentauriansAlienPlugin', () => {
  it('is registered for the core Centaurians alien type', () => {
    expect(AlienRegistry.has(EAlienType.CENTAURIANS)).toBe(true);
  });

  it('CEN-A discovery markers draw Centaurian cards and keep a face-up alien card available', () => {
    const { game, board } = createCentauriansGame('cen-a1');
    placeDiscoveryMarker(board, 'p1', 0);
    placeDiscoveryMarker(board, 'p2', 1);

    game.alienState.discoverAlien(board, game);

    expect(centaurianCardIdsInHand(game, 'p1')).toHaveLength(1);
    expect(centaurianCardIdsInHand(game, 'p2')).toHaveLength(1);
    expect(board.faceUpAlienCardId).toEqual(expect.any(String));
    expect(board.alienDeckDrawPile.length).toBeGreaterThan(0);
  });

  it('CEN-B discovery places a personal message milestone 15 VP ahead for each player', () => {
    const { game, board } = createCentauriansGame('cen-b1');
    getPlayer(game, 'p1').score = 12;
    getPlayer(game, 'p2').score = 4;

    game.alienState.discoverAlien(board, game);

    expect(getCentauriansBoard(game).messageMilestones).toEqual([
      { playerId: 'p1', threshold: 27, sourceCardId: null, resolved: false },
      { playerId: 'p2', threshold: 19, sourceCardId: null, resolved: false },
    ]);
    expect(getCentauriansBoard(game).pendingMessagesByPlayer).toEqual({
      p1: [],
      p2: [],
    });
  });

  it('resolving an income-style message tucks the card and grants its income immediately', () => {
    const { game } = createCentauriansGame('cen-income');
    const p1 = getPlayer(game, 'p1');
    const board = getCentauriansBoard(game);
    board.discovered = true;
    board.pendingMessagesByPlayer[p1.id] = ['ET.31'];
    board.messageMilestones = [
      {
        playerId: p1.id,
        threshold: 18,
        sourceCardId: 'ET.31',
        resolved: false,
      },
    ];
    p1.score = 18;
    const publicityBefore = p1.resources.publicity;

    const input = game.milestoneState.checkAndQueue(game, p1);
    const afterReward = chooseCentauriansReward(
      input,
      (option) => option.id.includes('score-8'),
    );

    expect(afterReward).toBeUndefined();
    expect(board.pendingMessagesByPlayer[p1.id]).toEqual([]);
    expect(p1.tuckedIncomeCards).toContain('ET.31');
    expect(p1.income.tuckedCardIncome[EResource.PUBLICITY]).toBe(1);
    expect(p1.resources.publicity).toBe(publicityBefore + 1);
  });

  it('resolving ET.34 grants a red trace instead of tucking income', () => {
    const { game } = createCentauriansGame('cen-red-trace');
    const p1 = getPlayer(game, 'p1');
    const board = getCentauriansBoard(game);
    board.discovered = true;
    board.pendingMessagesByPlayer[p1.id] = ['ET.34'];
    board.messageMilestones = [
      {
        playerId: p1.id,
        threshold: 18,
        sourceCardId: 'ET.34',
        resolved: false,
      },
    ];
    p1.score = 18;
    const tuckedBefore = [...p1.tuckedIncomeCards];
    const energyIncomeBefore = p1.income.tuckedCardIncome[EResource.ENERGY];

    const input = game.milestoneState.checkAndQueue(game, p1);
    const afterReward = chooseCentauriansReward(
      input,
      (option) => option.id.includes('score-8'),
    );
    const optionModel = (afterReward as { toModel: () => ISelectOptionInputModel })
      ?.toModel();

    expect(optionModel?.type).toBe(EPlayerInputType.OPTION);
    expect(optionModel?.title).toContain('Place Red trace');
    expect(p1.tuckedIncomeCards).toEqual(tuckedBefore);
    expect(p1.income.tuckedCardIncome[EResource.ENERGY]).toBe(
      energyIncomeBefore,
    );
  });

  it('discards non-income Centaurian messages after their delayed trace resolves', () => {
    const { game } = createCentauriansGame('cen-trace-discard');
    const p1 = getPlayer(game, 'p1');
    const board = getCentauriansBoard(game);
    board.discovered = true;
    board.pendingMessagesByPlayer[p1.id] = ['ET.35'];
    board.messageMilestones = [
      {
        playerId: p1.id,
        threshold: 18,
        sourceCardId: 'ET.35',
        resolved: false,
      },
    ];
    p1.score = 18;

    const input = game.milestoneState.checkAndQueue(game, p1);
    const afterReward = chooseCentauriansReward(
      input,
      (option) => option.id.includes('score-8'),
    );
    const optionModel = (afterReward as { toModel: () => ISelectOptionInputModel })
      ?.toModel();
    const firstOption = optionModel?.options[0];
    if (!firstOption) {
      throw new Error('expected trace option');
    }

    (afterReward as { process: (response: { type: EPlayerInputType.OPTION; optionId: string }) => unknown })?.process({
      type: EPlayerInputType.OPTION,
      optionId: firstOption.id,
    });

    expect(board.alienDeckDiscardPile).toContain('ET.35');
    expect(p1.tuckedIncomeCards).not.toContain('ET.35');
  });

  it('CEN-C1 exposes exactly the four Centaurians reward slots', () => {
    const { game } = createCentauriansGame('cen-reward-options');
    const p1 = getPlayer(game, 'p1');
    const board = getCentauriansBoard(game);
    board.discovered = true;
    board.messageMilestones = [
      {
        playerId: p1.id,
        threshold: 18,
        sourceCardId: null,
        resolved: false,
      },
    ];
    p1.score = 18;

    const input = game.milestoneState.checkAndQueue(game, p1);
    const optionModel = input?.toModel() as ISelectOptionInputModel | undefined;

    expect(optionModel?.options.map((option) => option.id)).toEqual([
      'claim-centaurians:any-trace',
      'claim-centaurians:energy-and-alien-card',
      'claim-centaurians:publicity-3',
      'claim-centaurians:score-8',
    ]);
  });

  it('CEN-C2 claims and locks the 8 score Centaurians reward', () => {
    const { game } = createCentauriansGame('cen-reward-market');
    const p1 = getPlayer(game, 'p1');
    const board = getCentauriansBoard(game);
    board.discovered = true;
    board.messageMilestones = [
      {
        playerId: p1.id,
        threshold: 18,
        sourceCardId: null,
        resolved: false,
      },
    ];
    p1.score = 18;
    const scoreBefore = p1.score;

    const input = game.milestoneState.checkAndQueue(game, p1);
    chooseCentauriansReward(input, (option) => option.id.includes('score-8'));

    expect(p1.score).toBe(scoreBefore + 8);
    expect(board.messageMilestones[0]?.resolved).toBe(true);
    expect(board.rewardSlots.find((slot) => slot.slotId === 'score-8')).toEqual(
      expect.objectContaining({ claimedByPlayerId: p1.id }),
    );
  });

  it('CEN-C3 grants 1 energy and prompts to draw from the Centaurians deck', () => {
    const { game } = createCentauriansGame('cen-energy-card-reward');
    const p1 = getPlayer(game, 'p1');
    const board = getCentauriansBoard(game);
    board.discovered = true;
    board.alienDeckDrawPile = ['ET.31'];
    board.faceUpAlienCardId = 'ET.32';
    board.messageMilestones = [
      {
        playerId: p1.id,
        threshold: 18,
        sourceCardId: null,
        resolved: false,
      },
    ];
    p1.score = 18;
    const energyBefore = p1.resources.energy;

    const input = game.milestoneState.checkAndQueue(game, p1);
    const afterReward = chooseCentauriansReward(
      input,
      (option) => option.id.includes('energy-and-alien-card'),
    );
    const model = (afterReward as { toModel: () => ISelectOptionInputModel })
      .toModel();

    expect(p1.resources.energy).toBe(energyBefore + 1);
    expect(model.title).toContain('Centaurians');
  });

  it('resolving ET.37 grants 1 credit and prompts for any trace', () => {
    const { game } = createCentauriansGame('cen-any-trace');
    const p1 = getPlayer(game, 'p1');
    const board = getCentauriansBoard(game);
    board.discovered = true;
    board.pendingMessagesByPlayer[p1.id] = ['ET.37'];
    board.messageMilestones = [
      {
        playerId: p1.id,
        threshold: 19,
        sourceCardId: 'ET.37',
        resolved: false,
      },
    ];
    p1.score = 19;
    const tuckedBefore = [...p1.tuckedIncomeCards];
    const energyIncomeBefore = p1.income.tuckedCardIncome[EResource.ENERGY];
    const creditsBefore = p1.resources.credits;

    const input = game.milestoneState.checkAndQueue(game, p1);
    const afterReward = chooseCentauriansReward(
      input,
      (option) => option.id.includes('score-8'),
    );
    const model = (afterReward as { toModel: () => ISelectOptionInputModel })
      ?.toModel();

    expect(p1.resources.credits).toBe(creditsBefore + 1);
    expect(model?.type).toBe(EPlayerInputType.OPTION);
    expect(p1.tuckedIncomeCards).toEqual(tuckedBefore);
    expect(p1.income.tuckedCardIncome[EResource.ENERGY]).toBe(
      energyIncomeBefore,
    );
    expect(board.pendingMessagesByPlayer[p1.id]).toEqual([]);
  });

  it('resolves multiple Centaurian messages reached at the same turn end in send order', () => {
    const { game } = createCentauriansGame('cen-same-threshold-stack');
    const p1 = getPlayer(game, 'p1');
    const board = getCentauriansBoard(game);
    board.discovered = true;
    board.pendingMessagesByPlayer[p1.id] = ['ET.31', 'ET.32'];
    board.messageMilestones = [
      {
        playerId: p1.id,
        threshold: 18,
        sourceCardId: 'ET.31',
        resolved: false,
      },
      {
        playerId: p1.id,
        threshold: 18,
        sourceCardId: 'ET.32',
        resolved: false,
      },
    ];
    p1.score = 18;

    const firstReward = game.milestoneState.checkAndQueue(game, p1);
    const secondReward = chooseCentauriansReward(
      firstReward,
      (option) => option.id.includes('score-8'),
    );
    const done = chooseCentauriansReward(
      secondReward,
      (option) => option.id.includes('publicity-3'),
    );

    expect(done).toBeUndefined();
    expect(board.pendingMessagesByPlayer[p1.id]).toEqual([]);
    expect(board.messageMilestones.map((milestone) => milestone.resolved)).toEqual([
      true,
      true,
    ]);
    expect(p1.tuckedIncomeCards.slice(-2)).toEqual(['ET.31', 'ET.32']);
  });
});
