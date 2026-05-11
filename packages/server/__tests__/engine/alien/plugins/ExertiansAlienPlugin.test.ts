import { alienCards } from '@seti/common/data/alienCards';
import { EAlienType } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import {
  type AlienBoard,
  type ExertiansAlienBoard,
  isExertiansAlienBoard,
} from '@/engine/alien/AlienBoard.js';
import { AlienState } from '@/engine/alien/AlienState.js';
import { ExertiansAlienPlugin } from '@/engine/alien/plugins/ExertiansAlienPlugin.js';
import { Game } from '@/engine/Game.js';
import {
  getPlayer,
  resolveSetupTucks,
} from '../../../helpers/TestGameBuilder.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createExertiansGame(seed: string): { game: Game; board: AlienBoard } {
  const game = Game.create(
    TEST_PLAYERS,
    { playerCount: 2, alienModulesEnabled: [true, false, true, false, false] },
    seed,
    seed,
  );
  resolveSetupTucks(game);
  game.alienState = AlienState.createFromHiddenAliens([EAlienType.EXERTIANS]);
  const board = game.alienState.getBoardByType(EAlienType.EXERTIANS);
  if (!board) {
    throw new Error('expected Exertians board');
  }
  return { game, board };
}

function createSoloExertiansGame(seed: string): {
  game: Game;
  board: AlienBoard;
} {
  const game = Game.create(
    [
      TEST_PLAYERS[0],
      {
        id: `rival:${seed}`,
        name: 'Rival Institution',
        color: 'blue',
        seatIndex: 1,
      },
    ],
    {
      playerCount: 2,
      isSoloMode: true,
      soloDifficulty: 2,
      alienModulesEnabled: [true, false, true, false, false],
    } as Parameters<typeof Game.create>[1],
    seed,
    seed,
  );
  resolveSetupTucks(game);
  game.alienState = AlienState.createFromHiddenAliens([EAlienType.EXERTIANS]);
  const board = game.alienState.getBoardByType(EAlienType.EXERTIANS);
  if (!board) {
    throw new Error('expected Exertians board');
  }
  return { game, board };
}

function placeDiscoveryMarker(
  board: AlienBoard,
  playerId: string,
  index: number,
) {
  const slot = board.getDiscoverySlots()[index];
  if (!slot) {
    throw new Error(`missing discovery slot ${index}`);
  }
  board.placeTrace(slot, { playerId }, slot.traceColor);
}

function exertianCardIdsInHand(game: Game, playerId: string): string[] {
  return getPlayer(game, playerId)
    .hand.map((card) => (typeof card === 'string' ? card : card.id))
    .filter((cardId): cardId is string =>
      alienCards.some(
        (card) => card.id === cardId && card.alien === EAlienType.EXERTIANS,
      ),
    );
}

function getExertiansBoard(game: Game): ExertiansAlienBoard {
  const board = game.alienState.getBoardByType(EAlienType.EXERTIANS);
  if (!isExertiansAlienBoard(board)) {
    throw new Error('expected Exertians board');
  }
  return board;
}

describe('ExertiansAlienPlugin', () => {
  it('EXE-A1 deals three Exertian cards to each player when discovered', () => {
    const { game, board } = createExertiansGame('exe-a1');

    game.alienState.discoverAlien(board, game);

    expect(exertianCardIdsInHand(game, 'p1')).toHaveLength(3);
    expect(exertianCardIdsInHand(game, 'p2')).toHaveLength(3);
  });

  it('EXE-A2 grants one extra Exertian card for each discovery marker', () => {
    const { game, board } = createExertiansGame('exe-a2');
    placeDiscoveryMarker(board, 'p1', 0);
    placeDiscoveryMarker(board, 'p1', 1);
    placeDiscoveryMarker(board, 'p2', 2);

    game.alienState.discoverAlien(board, game);

    expect(exertianCardIdsInHand(game, 'p1')).toHaveLength(5);
    expect(exertianCardIdsInHand(game, 'p2')).toHaveLength(4);
  });

  it('converts solo rival Exertians discovery cards to progress instead of hand cards', () => {
    const { game, board } = createSoloExertiansGame('exe-solo-discovery');
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    placeDiscoveryMarker(board, rival.id, 0);
    const progressBefore = rivalState.progress;

    game.alienState.discoverAlien(board, game);

    expect(exertianCardIdsInHand(game, 'p1')).toHaveLength(3);
    expect(exertianCardIdsInHand(game, rival.id)).toHaveLength(0);
    expect(rival.hand).toHaveLength(0);
    expect(rivalState.progress).toBe(progressBefore + 1);
  });

  it('does not grant solo rival Exertians progress for the base discovery deal', () => {
    const { game, board } = createSoloExertiansGame(
      'exe-solo-discovery-no-marker',
    );
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    const progressBefore = rivalState.progress;

    game.alienState.discoverAlien(board, game);

    expect(exertianCardIdsInHand(game, rival.id)).toHaveLength(0);
    expect(rival.hand).toHaveLength(0);
    expect(rivalState.progress).toBe(progressBefore);
  });

  it('EXE-A3 seals the remaining Exertian deck after discovery distribution', () => {
    const { game, board } = createExertiansGame('exe-a3');

    game.alienState.discoverAlien(board, game);

    expect(board.alienDeckDrawPile).toEqual([]);
    expect(board.alienDeckDiscardPile).toEqual([]);
    expect(board.faceUpAlienCardId).toBeNull();
  });

  it('EXE-C1 initializes +20/+40 Exertian milestones from the leading score on discovery', () => {
    const { game, board } = createExertiansGame('exe-c1');
    getPlayer(game, 'p1').score = 18;
    getPlayer(game, 'p2').score = 11;

    game.alienState.discoverAlien(board, game);

    const exertiansBoard = game.alienState.getBoardByType(EAlienType.EXERTIANS);
    if (!isExertiansAlienBoard(exertiansBoard)) {
      throw new Error('expected Exertians board');
    }
    expect(exertiansBoard.milestones).toEqual([
      { threshold: 38, claimedByPlayerIds: [], creditCost: 0 },
      { threshold: 58, claimedByPlayerIds: [], creditCost: 1 },
    ]);
  });

  it('EXE-A4 moves selected Exertian cards from hand into face-down board state', () => {
    const { game, board } = createExertiansGame('exe-a4');
    game.alienState.discoverAlien(board, game);
    const exertiansBoard = game.alienState.getBoardByType(EAlienType.EXERTIANS);
    if (!isExertiansAlienBoard(exertiansBoard)) {
      throw new Error('expected Exertians board');
    }
    const player = getPlayer(game, 'p1');
    const cardId = exertianCardIdsInHand(game, 'p1')[0];
    if (!cardId) {
      throw new Error('expected Exertian card in hand');
    }
    const plugin = new ExertiansAlienPlugin();

    plugin.playFaceDownCard(player, game, cardId, 'discovery');

    expect(
      player.hand.map((card) => (typeof card === 'string' ? card : card.id)),
    ).not.toContain(cardId);
    expect(exertiansBoard.faceDownCards).toEqual([
      expect.objectContaining({
        ownerId: 'p1',
        cardId,
        source: 'discovery',
        revealed: false,
      }),
    ]);
  });

  it('EXE-A5 discovery offers one immediate face-down play per discovery marker', () => {
    const { game, board } = createExertiansGame('exe-a5');
    placeDiscoveryMarker(board, 'p1', 0);
    placeDiscoveryMarker(board, 'p1', 1);

    const input = game.alienState.discoverAlien(board, game);

    const player = getPlayer(game, 'p1');
    if (input) {
      player.waitingFor = input;
    }
    expect(player.waitingFor?.toModel().type).toBe(EPlayerInputType.OPTION);
    const firstCardId = exertianCardIdsInHand(game, 'p1')[0];
    if (!firstCardId) {
      throw new Error('expected Exertian card in hand');
    }

    game.processInput(player.id, {
      type: EPlayerInputType.OPTION,
      optionId: `play-facedown:${firstCardId}`,
    });

    expect(player.waitingFor?.toModel().type).toBe(EPlayerInputType.OPTION);
    const exertiansBoard = game.alienState.getBoardByType(EAlienType.EXERTIANS);
    if (!isExertiansAlienBoard(exertiansBoard)) {
      throw new Error('expected Exertians board');
    }
    expect(exertiansBoard.faceDownCards).toHaveLength(1);
  });

  it('EXE-A6 discovery reveals Exertians danger trace tiers on the species board', () => {
    const { game, board } = createExertiansGame('exe-a6');

    game.alienState.discoverAlien(board, game);

    const exertiansBoard = getExertiansBoard(game);
    const speciesSlots = exertiansBoard.speciesTraceSlots;
    expect(speciesSlots).toHaveLength(9);
    expect(
      speciesSlots.filter((slot) => slot.slotId.startsWith('exertians-danger-3')),
    ).toHaveLength(3);
    expect(
      speciesSlots.filter((slot) => slot.slotId.startsWith('exertians-danger-2')),
    ).toHaveLength(3);
    expect(
      speciesSlots.filter((slot) => slot.slotId.startsWith('exertians-danger-1')),
    ).toHaveLength(3);
    expect(speciesSlots.every((slot) => slot.rewards.length === 0)).toBe(true);
  });

  it('EXE-C2 crossing the +20 Exertian milestone offers one extra face-down play', () => {
    const { game, board } = createExertiansGame('exe-c2');
    game.alienState.discoverAlien(board, game);
    const exertiansBoard = getExertiansBoard(game);
    const player = getPlayer(game, 'p1');
    const milestone = exertiansBoard.milestones[0];
    player.score = milestone.threshold;

    const input = game.milestoneState.checkAndQueue(game, player);

    expect(input?.toModel().type).toBe(EPlayerInputType.OPTION);
    expect(exertiansBoard.milestones[0].claimedByPlayerIds).toEqual(['p1']);
    const cardId = exertianCardIdsInHand(game, 'p1')[0];
    if (!cardId) {
      throw new Error('expected Exertian card in hand');
    }

    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: `play-facedown:${cardId}`,
    });

    expect(exertiansBoard.faceDownCards).toEqual([
      expect.objectContaining({
        ownerId: 'p1',
        cardId,
        source: 'milestone-20',
        revealed: false,
      }),
    ]);
  });

  it('EXE-C3 crossing the +40 Exertian milestone spends 1 credit for the extra face-down play', () => {
    const { game, board } = createExertiansGame('exe-c3');
    game.alienState.discoverAlien(board, game);
    const exertiansBoard = getExertiansBoard(game);
    const player = getPlayer(game, 'p1');
    exertiansBoard.milestones[0].claimedByPlayerIds.push(player.id);
    const milestone = exertiansBoard.milestones[1];
    milestone.threshold = 19;
    player.score = milestone.threshold;
    player.resources.spend({ credits: player.resources.credits - 1 });
    const cardId = exertianCardIdsInHand(game, 'p1')[0];
    if (!cardId) {
      throw new Error('expected Exertian card in hand');
    }

    const input = game.milestoneState.checkAndQueue(game, player);
    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: `play-facedown:${cardId}`,
    });

    expect(player.resources.credits).toBe(0);
    expect(exertiansBoard.faceDownCards).toEqual([
      expect.objectContaining({
        ownerId: 'p1',
        cardId,
        source: 'milestone-40',
      }),
    ]);
  });

  it('EXE-C4 crossing the +40 Exertian milestone without 1 credit loses that opportunity', () => {
    const { game, board } = createExertiansGame('exe-c4');
    game.alienState.discoverAlien(board, game);
    const exertiansBoard = getExertiansBoard(game);
    const player = getPlayer(game, 'p1');
    exertiansBoard.milestones[0].claimedByPlayerIds.push(player.id);
    exertiansBoard.milestones[1].threshold = 19;
    player.score = exertiansBoard.milestones[1].threshold;
    player.resources.spend({ credits: player.resources.credits });

    const input = game.milestoneState.checkAndQueue(game, player);

    expect(input).toBeUndefined();
    expect(exertiansBoard.milestones[1].claimedByPlayerIds).toEqual(['p1']);
    expect(exertiansBoard.faceDownCards).toHaveLength(0);
  });

  it('EXE-C5 skipping the +40 milestone play does not spend the credit', () => {
    const { game, board } = createExertiansGame('exe-c5');
    game.alienState.discoverAlien(board, game);
    const exertiansBoard = getExertiansBoard(game);
    const player = getPlayer(game, 'p1');
    exertiansBoard.milestones[0].claimedByPlayerIds.push(player.id);
    exertiansBoard.milestones[1].threshold = 19;
    player.score = exertiansBoard.milestones[1].threshold;
    player.resources.spend({ credits: player.resources.credits - 1 });

    const input = game.milestoneState.checkAndQueue(game, player);
    expect(input?.toModel().type).toBe(EPlayerInputType.OPTION);

    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'skip-exertian-facedown',
    });

    expect(player.resources.credits).toBe(1);
    expect(exertiansBoard.faceDownCards).toHaveLength(0);
  });

  it('EXE-D1 endgame danger includes Exertians board markers in addition to face-down cards', () => {
    const { game, board } = createExertiansGame('exe-d1');
    game.alienState.discoverAlien(board, game);
    const exertiansBoard = getExertiansBoard(game);
    const player = getPlayer(game, 'p1');
    getPlayer(game, 'p2').score = 100;
    player.score = 100;

    const bottomSlot = exertiansBoard.speciesTraceSlots.find((slot) =>
      slot.slotId.startsWith('exertians-danger-3'),
    );
    if (!bottomSlot) {
      throw new Error('expected bottom-tier Exertians slot');
    }
    const scoreBeforeTrace = player.score;
    exertiansBoard.placeTrace(
      bottomSlot,
      { playerId: player.id },
      bottomSlot.traceColor,
    );
    expect(player.score).toBe(scoreBeforeTrace);

    const penalty = new ExertiansAlienPlugin().onGameEndPenalty(game, {
      p1: 100,
      p2: 100,
    });

    expect(penalty).toEqual({ p1: -10 });
  });
});
