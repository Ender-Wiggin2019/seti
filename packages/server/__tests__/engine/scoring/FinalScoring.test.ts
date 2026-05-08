import { ESector } from '@seti/common/types/element';
import {
  EAlienType,
  EMainAction,
  EPhase,
  EPlanet,
  ETrace,
} from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectEndOfRoundCardInputModel,
  type ISelectGoldTileInputModel,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ETechId } from '@seti/common/types/tech';
import {
  AlienBoard,
  isExertiansAlienBoard,
} from '@/engine/alien/AlienBoard.js';
import { AlienState } from '@/engine/alien/AlienState.js';
import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { Game } from '@/engine/Game.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { EPieceType } from '@/engine/player/Pieces.js';
import { FinalScoring } from '@/engine/scoring/FinalScoring.js';
import { GoldScoringTile } from '@/engine/scoring/GoldScoringTile.js';
import { resolveSetupTucks } from '../../helpers/TestGameBuilder.js';

const TWO_PLAYER_IDENTITIES = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

const SOLO_IDENTITIES = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  {
    id: 'rival:final-scoring-solo',
    name: 'Rival Institution',
    color: 'blue',
    seatIndex: 1,
  },
] as const;

function createTwoPlayerGame(seed: string): Game {
  const game = Game.create(
    TWO_PLAYER_IDENTITIES,
    { playerCount: 2 },
    seed,
    `final-scoring-${seed}`,
  );
  resolveSetupTucks(game);
  return game;
}

function createSoloGame(seed: string): Game {
  const game = Game.create(
    SOLO_IDENTITIES,
    { playerCount: 2, isSoloMode: true, soloDifficulty: 2 },
    seed,
    `final-scoring-${seed}`,
  );
  resolveSetupTucks(game);
  return game;
}

function getPlayer(game: Game, id: string): IPlayer {
  return game.players.find((p) => p.id === id)!;
}

/** Resolves common PlayerInput chains used when passing / round flow. */
function resolveAllInputs(game: Game, player: IPlayer): void {
  let guard = 0;
  while (player.waitingFor && guard < 80) {
    guard += 1;
    const model = player.waitingFor.toModel();

    if (model.type === EPlayerInputType.CARD) {
      const cardModel = model as {
        cards: { id: string }[];
        minSelections: number;
      };
      const cardIds = cardModel.cards
        .slice(0, cardModel.minSelections)
        .map((c) => c.id);
      game.processInput(player.id, { type: EPlayerInputType.CARD, cardIds });
    } else if (model.type === EPlayerInputType.END_OF_ROUND) {
      const eorModel = model as ISelectEndOfRoundCardInputModel;
      game.processInput(player.id, {
        type: EPlayerInputType.END_OF_ROUND,
        cardId: eorModel.cards[0].id,
      });
    } else if (model.type === EPlayerInputType.OPTION) {
      const optModel = model as ISelectOptionInputModel;
      const doneOpt = optModel.options.find((o) => o.id === 'done');
      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: doneOpt?.id ?? optModel.options[0].id,
      });
    } else if (model.type === EPlayerInputType.GOLD_TILE) {
      const gtModel = model as ISelectGoldTileInputModel;
      game.processInput(player.id, {
        type: EPlayerInputType.GOLD_TILE,
        tileId: gtModel.options[0],
      });
    } else {
      break;
    }
  }
}

function passPlayer(game: Game, playerId: string): void {
  game.processMainAction(playerId, { type: EMainAction.PASS });
  resolveAllInputs(game, getPlayer(game, playerId));
}

function passOneRound(game: Game): void {
  const targetRound = game.round;
  while (
    game.phase === EPhase.AWAIT_MAIN_ACTION &&
    game.round === targetRound
  ) {
    passPlayer(game, game.activePlayer.id);
  }
}

function advanceRounds(game: Game, rounds: number): void {
  for (let i = 0; i < rounds; i += 1) {
    passOneRound(game);
    if (game.phase === EPhase.GAME_OVER) break;
  }
}

/**
 * Appends a discovered Dummy alien board (real `DummyAlienPlugin.onGameEndScoring`).
 * Base setup never selects `DUMMY` as a hidden race; tests attach it to exercise
 * end-game alien scoring against a fully initialized `Game` from `Game.create`.
 */
function appendDiscoveredDummyAlienBoard(
  game: Game,
  playerId: string,
  traceSlotCount: number,
): void {
  const nextIndex = game.alienState.boards.length;
  const template = AlienState.createFromHiddenAliens([EAlienType.DUMMY])
    .boards[0]!;
  const board = new AlienBoard({
    alienType: EAlienType.DUMMY,
    alienIndex: nextIndex,
    discovered: true,
    slots: template.slots.map((s) => ({
      slotId: s.slotId,
      alienIndex: nextIndex,
      traceColor: s.traceColor,
      occupants: s.occupants.map((o) => ({ ...o })),
      maxOccupants: s.maxOccupants,
      rewards: [...s.rewards],
      isDiscovery: s.isDiscovery,
    })),
    alienDeckDrawPile: [...template.alienDeckDrawPile],
    alienDeckDiscardPile: [...template.alienDeckDiscardPile],
    faceUpAlienCardId: template.faceUpAlienCardId,
  });
  const discoverySlots = board.slots.filter(
    (s) => s.isDiscovery && s.traceColor !== ETrace.ANY,
  );
  for (let i = 0; i < traceSlotCount && i < discoverySlots.length; i += 1) {
    const slot = discoverySlots[i]!;
    board.placeTrace(slot, { playerId }, slot.traceColor);
  }
  game.alienState.boards.push(board);
}

function replaceGoldTile(
  game: Game,
  id: GoldScoringTile['id'],
  init: ConstructorParameters<typeof GoldScoringTile>[0],
): GoldScoringTile {
  const idx = game.goldScoringTiles.findIndex((t) => t.id === id);
  const tile = new GoldScoringTile(init);
  game.goldScoringTiles[idx] = tile;
  return tile;
}

describe('FinalScoring', () => {
  describe('unit: breakdown arithmetic (real Game shell)', () => {
    it('sums end-game VP, gold tiles, and alien bonus; determines winner', () => {
      const game = createTwoPlayerGame('fs-sum');
      const p1 = getPlayer(game, 'p1');
      const p2 = getPlayer(game, 'p2');

      p1.score = 30;
      p2.score = 34;
      p1.completedMissions = ['m1', 'm2'];
      p1.endGameCards = [{ endGameScore: 5 }];
      p2.endGameCards = [{ endGameScore: 1 }];

      const missionTile = replaceGoldTile(game, 'mission', {
        id: 'mission',
        side: 'A',
        slotValues: [4, 3, 2, 1],
      });
      missionTile.claim('p1');
      missionTile.claim('p2');

      const result = FinalScoring.score(game);

      expect(result.scores.p1).toBe(43);
      expect(result.scores.p2).toBe(35);
      expect(result.winnerIds).toEqual(['p1']);
    });

    it('keeps ties as shared winners', () => {
      const game = createTwoPlayerGame('fs-tie');
      const p1 = getPlayer(game, 'p1');
      const p2 = getPlayer(game, 'p2');
      p1.score = 40;
      p2.score = 40;

      const result = FinalScoring.score(game);
      expect(result.winnerIds).toEqual(['p1', 'p2']);
    });

    it('does not score leftover oumuamua exofossils', () => {
      const game = createTwoPlayerGame('fs-exofossils-zero');
      const p1 = getPlayer(game, 'p1');
      p1.score = 10;
      p1.gainExofossils(5);

      const result = FinalScoring.score(game);

      expect(result.breakdown.p1.totalAdded).toBe(0);
      expect(result.scores.p1).toBe(10);
    });

    it('does not score gold tiles for the solo rival', () => {
      const game = createSoloGame('fs-solo-rival-gold');
      const rival = getPlayer(game, 'rival:final-scoring-solo');
      rival.score = 10;
      rival.completedMissions = ['m1'];

      const missionTile = replaceGoldTile(game, 'mission', {
        id: 'mission',
        side: 'A',
        slotValues: [5],
      });
      missionTile.claim(rival.id);

      const result = FinalScoring.score(game);

      expect(result.breakdown[rival.id].goldTiles).toBe(0);
      expect(result.scores[rival.id]).toBe(10);
    });

    it('awards a solo tie to the rival', () => {
      const game = createSoloGame('fs-solo-tie-rival');
      const human = getPlayer(game, 'p1');
      const rival = getPlayer(game, 'rival:final-scoring-solo');
      human.score = 40;
      rival.score = 40;

      const result = FinalScoring.score(game);

      expect(result.winnerIds).toEqual([rival.id]);
    });
  });

  describe('Phase 9.1: end-game scoring cards (integration)', () => {
    it('9.1.1 [集成] real Game reaches GAME_OVER and end-game cards are scored from played card data', () => {
      const game = createTwoPlayerGame('phase-9-1-1');
      const p1 = getPlayer(game, 'p1');

      expect(game.sectors.length).toBe(8);

      p1.hand = ['127'];
      game.processMainAction('p1', {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });
      resolveAllInputs(game, p1);
      game.processEndTurn('p1');
      resolveAllInputs(game, p1);

      expect(p1.endGameCards.length).toBe(1);
      expect((p1.endGameCards[0] as { id: string }).id).toBe('127');

      advanceRounds(game, 5);

      expect(game.phase).toBe(EPhase.GAME_OVER);
      expect(game.round).toBe(5);
      expect(game.finalScoringResult).toBeDefined();

      const result = game.finalScoringResult!;
      const recomputed = FinalScoring.score(game);
      expect(recomputed.breakdown.p1.endGameCards).toBe(
        result.breakdown.p1.endGameCards,
      );
      expect(result.breakdown.p1.endGameCards).toBe(0);
    });

    it('9.1.2 [集成] 0 VP end-game card still counts toward pairing formula on gold tile (other / B)', () => {
      const game = createTwoPlayerGame('phase-9-1-2');
      const p1 = getPlayer(game, 'p1');

      const otherB = replaceGoldTile(game, 'other', {
        id: 'other',
        side: 'B',
        slotValues: [5, 4, 3, 2],
      });
      otherB.claim('p1');

      p1.completedMissions = ['m1'];
      p1.endGameCards = [getCardRegistry().create('127')];

      const result = FinalScoring.score(game);
      const pairFloor = Math.floor(
        (p1.completedMissions.length + p1.endGameCards.length) / 2,
      );
      expect(pairFloor).toBe(1);
      expect(result.breakdown.p1.endGameCards).toBe(0);
      expect(result.breakdown.p1.goldTiles).toBe(5 * pairFloor);
    });

    it('9.1.3 [集成] Dummy alien end-game scoring runs against real Game + AlienState', () => {
      const game = createTwoPlayerGame('phase-9-1-3');
      appendDiscoveredDummyAlienBoard(game, 'p1', 2);

      const result = FinalScoring.score(game);
      expect(result.breakdown.p1.alienBonus).toBe(2);
      expect(result.breakdown.p2.alienBonus).toBe(0);
    });

    it('9.1.4 [集成] sector win counts feed gold tile other / A formula', () => {
      const game = createTwoPlayerGame('phase-9-1-4');
      const p1 = getPlayer(game, 'p1');

      const sector = game.sectors[0]!;
      sector.sectorWinners.push('p1', 'p1');

      const otherA = replaceGoldTile(game, 'other', {
        id: 'other',
        side: 'A',
        slotValues: [5, 4, 3, 2],
      });
      otherA.claim('p1');

      p1.pieces.deploy(EPieceType.ORBITER);
      p1.pieces.deploy(EPieceType.ORBITER);
      p1.pieces.deploy(EPieceType.LANDER);

      const result = FinalScoring.score(game);
      const wins = 2;
      const deployed = 3;
      const formula = Math.min(wins, deployed);
      expect(result.breakdown.p1.goldTiles).toBe(5 * formula);
    });
  });

  describe('Phase 9.3: end-game scoring flow', () => {
    it('9.3.1 breakdown components sum to totalAdded (end-game → gold → alien in FinalScoring.score)', () => {
      const game = createTwoPlayerGame('phase-9-3-1');
      const p1 = getPlayer(game, 'p1');
      p1.endGameCards = [{ endGameScore: 3 }];
      replaceGoldTile(game, 'mission', {
        id: 'mission',
        side: 'A',
        slotValues: [2, 1, 1, 1],
      }).claim('p1');
      appendDiscoveredDummyAlienBoard(game, 'p1', 1);

      const result = FinalScoring.score(game);
      const bd = result.breakdown.p1;
      expect(bd.totalAdded).toBe(
        bd.endGameCards + bd.goldTiles + bd.alienBonus + bd.alienPenalty,
      );
    });

    it('9.3.2 highest final VP wins', () => {
      const game = createTwoPlayerGame('phase-9-3-2');
      getPlayer(game, 'p1').score = 100;
      getPlayer(game, 'p2').score = 10;
      const result = FinalScoring.score(game);
      expect(result.winnerIds).toEqual(['p1']);
    });

    it('9.3.3 ties are not broken', () => {
      const game = createTwoPlayerGame('phase-9-3-3');
      getPlayer(game, 'p1').score = 50;
      getPlayer(game, 'p2').score = 50;
      const result = FinalScoring.score(game);
      expect(result.winnerIds).toEqual(['p1', 'p2']);
    });

    it('9.3.4 [集成] full 5-round pass uses real sectors + alienState in final scoring snapshot', () => {
      const game = createTwoPlayerGame('phase-9-3-4');
      advanceRounds(game, 5);
      expect(game.phase).toBe(EPhase.GAME_OVER);
      expect(game.sectors.length).toBe(8);
      expect(game.alienState.boards.length).toBe(2);
      expect(game.finalScoringResult).toBeDefined();
      const end = game.eventLog.recent(20).filter((e) => e.type === 'GAME_END');
      expect(end.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Exertians final scoring', () => {
    it('reveals played Exertian cards, scores fulfilled cards, then applies danger penalty', () => {
      const game = createTwoPlayerGame('exertians-final-1');
      game.alienState = AlienState.createFromHiddenAliens([
        EAlienType.EXERTIANS,
      ]);
      const board = game.alienState.getBoardByType(EAlienType.EXERTIANS);
      if (!isExertiansAlienBoard(board)) {
        throw new Error('expected Exertians board');
      }
      board.discovered = true;
      board.playFaceDownCard('p1', 'ET.51', 'discovery');
      board.playFaceDownCard('p2', 'ET.52', 'discovery');

      const p1 = getPlayer(game, 'p1');
      const p2 = getPlayer(game, 'p2');
      p1.score = 100;
      p2.score = 100;
      p1.tuckedIncomeCards = Array.from({ length: 8 }, (_, index) => ({
        id: `tucked-${index}`,
      }));

      const result = FinalScoring.score(game);

      expect(board.faceDownCards.every((card) => card.revealed)).toBe(true);
      expect(result.breakdown.p1.alienBonus).toBe(18);
      expect(result.breakdown.p1.alienPenalty).toBe(-11);
      expect(result.breakdown.p1.finalScore).toBe(107);
      expect(result.breakdown.p2.finalScore).toBe(100);
    });

    it('scores each fulfilled Exertian card condition at most once', () => {
      const game = createTwoPlayerGame('exertians-final-3');
      game.alienState = AlienState.createFromHiddenAliens([
        EAlienType.EXERTIANS,
        EAlienType.DUMMY,
      ]);
      const board = game.alienState.getBoardByType(EAlienType.EXERTIANS);
      if (!isExertiansAlienBoard(board)) {
        throw new Error('expected Exertians board');
      }
      board.discovered = true;
      const p1 = getPlayer(game, 'p1');
      p1.score = 0;
      getPlayer(game, 'p2').score = 0;
      for (const cardId of [
        'ET.52',
        'ET.50',
        'ET.45',
        'ET.42',
        'ET.43',
        'ET.51',
        'ET.47',
        'ET.49',
        'ET.54',
        'ET.53',
        'ET.48',
        'ET.44',
        'ET.41',
        'ET.55',
        'ET.46',
      ]) {
        board.playFaceDownCard('p1', cardId, 'discovery');
      }
      for (let i = 0; i < 8; i += 1) {
        board.playFaceDownCard('p2', 'ET.53', 'discovery');
      }

      for (const slot of board.getDiscoverySlots()) {
        board.placeTrace(slot, { playerId: 'p1' }, slot.traceColor);
      }
      for (const slot of board.overflowSlots) {
        board.placeTrace(slot, { playerId: 'p1' }, slot.traceColor);
      }
      const otherBoard = game.alienState.getBoardByType(EAlienType.DUMMY);
      if (!otherBoard) {
        throw new Error('expected second alien board');
      }
      for (const slot of otherBoard.getDiscoverySlots()) {
        otherBoard.placeTrace(slot, { playerId: 'p1' }, slot.traceColor);
      }
      for (const slot of otherBoard.overflowSlots) {
        otherBoard.placeTrace(slot, { playerId: 'p1' }, slot.traceColor);
      }
      otherBoard.placeTrace(
        otherBoard.overflowSlots[0]!,
        { playerId: 'p1' },
        otherBoard.overflowSlots[0]!.traceColor,
      );

      game.planetaryBoard?.planets
        .get(EPlanet.MARS)
        ?.orbitSlots.push({ playerId: 'p1' }, { playerId: 'p1' });
      game.planetaryBoard?.planets
        .get(EPlanet.MARS)
        ?.landingSlots.push({ playerId: 'p1' }, { playerId: 'p1' });
      game.sectors
        .find((sector) => sector.color === ESector.RED)
        ?.sectorWinners.push('p1', 'p1');
      game.sectors
        .find((sector) => sector.color === ESector.YELLOW)
        ?.sectorWinners.push('p1', 'p1');
      game.sectors
        .find((sector) => sector.color === ESector.BLUE)
        ?.sectorWinners.push('p1', 'p1');
      game.sectors
        .find((sector) => sector.color === ESector.BLACK)
        ?.sectorWinners.push('p1', 'p1', 'p1');
      p1.techs = [
        ETechId.PROBE_DOUBLE_PROBE,
        ETechId.PROBE_ASTEROID,
        ETechId.PROBE_ROVER_DISCOUNT,
        ETechId.SCAN_EARTH_LOOK,
        ETechId.SCAN_POP_SIGNAL,
        ETechId.SCAN_HAND_SIGNAL,
        ETechId.COMPUTER_VP_CREDIT,
        ETechId.COMPUTER_VP_ENERGY,
        ETechId.COMPUTER_VP_CARD,
      ];
      p1.tuckedIncomeCards = Array.from({ length: 8 }, (_, index) => ({
        id: `income-${index}`,
      }));
      p1.completedMissions = ['m1', 'm2', 'm3', 'm4', 'm5'];
      p1.pieces.deploy(EPieceType.ORBITER);
      p1.pieces.deploy(EPieceType.ORBITER);
      p1.pieces.deploy(EPieceType.LANDER);
      p1.pieces.deploy(EPieceType.LANDER);

      const result = FinalScoring.score(game);

      expect(result.breakdown.p1.alienBonus).toBe(190);
    });

    it('applies the danger penalty to every player tied for highest danger', () => {
      const game = createTwoPlayerGame('exertians-final-2');
      game.alienState = AlienState.createFromHiddenAliens([
        EAlienType.EXERTIANS,
      ]);
      const board = game.alienState.getBoardByType(EAlienType.EXERTIANS);
      if (!isExertiansAlienBoard(board)) {
        throw new Error('expected Exertians board');
      }
      board.discovered = true;
      board.playFaceDownCard('p1', 'ET.50', 'discovery');
      board.playFaceDownCard('p2', 'ET.50', 'discovery');
      getPlayer(game, 'p1').score = 100;
      getPlayer(game, 'p2').score = 100;

      const result = FinalScoring.score(game);

      expect(result.scores).toEqual({ p1: 90, p2: 90 });
      expect(result.breakdown.p1.alienBonus).toBe(0);
      expect(result.breakdown.p2.alienBonus).toBe(0);
      expect(result.breakdown.p1.alienPenalty).toBe(-10);
      expect(result.breakdown.p2.alienPenalty).toBe(-10);
    });

    it('scores solo rival face-down Exertian cards as fulfilled', () => {
      const game = createSoloGame('exertians-final-solo-rival');
      game.alienState = AlienState.createFromHiddenAliens([
        EAlienType.EXERTIANS,
      ]);
      const board = game.alienState.getBoardByType(EAlienType.EXERTIANS);
      if (!isExertiansAlienBoard(board)) {
        throw new Error('expected Exertians board');
      }
      board.discovered = true;
      const rival = getPlayer(game, 'rival:final-scoring-solo');
      board.playFaceDownCard(rival.id, 'ET.52', 'discovery');

      const result = FinalScoring.score(game);

      expect(result.breakdown[rival.id].alienBonus).toBe(7);
    });
  });
});
