import type { ESector } from '@seti/common/types/element';
import {
  EAlienType,
  EFreeAction,
  EMainAction,
  EPhase,
  EPlanet,
  ETrace,
} from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type IPlayerInputModel,
  type ISelectCardInputModel,
  type ISelectOptionInputModel,
  type ISelectTraceInputModel,
} from '@seti/common/types/protocol/playerInput';
import type { TSlotReward } from '@/engine/alien/AlienBoard.js';
import { AlienState } from '@/engine/alien/AlienState.js';
import { Deck } from '@/engine/deck/Deck.js';
import { Game } from '@/engine/Game.js';
import { Player } from '@/engine/player/Player.js';
import { resolveSetupTucks } from '../../../helpers/TestGameBuilder.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createGame(seed: string): { game: Game; player: Player } {
  const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, seed, seed);
  resolveSetupTucks(game);
  const player = game.players[0] as Player;
  game.alienState = AlienState.createFromHiddenAliens([EAlienType.ANOMALIES]);
  const board = game.alienState.getBoardByType(EAlienType.ANOMALIES);
  if (!board) {
    throw new Error('expected anomalies board');
  }
  board.discovered = true;
  return { game, player };
}

function getEarthSectorIndex(game: Game): number {
  if (!game.solarSystem) {
    throw new Error('expected solar system');
  }
  const earthSpace = game.solarSystem.getSpacesOnPlanet(EPlanet.EARTH)[0];
  if (!earthSpace) {
    throw new Error('expected earth space');
  }
  return Math.floor(earthSpace.indexInRing / earthSpace.ringIndex);
}

function getSpaceIdForSector(game: Game, sectorIndex: number): string {
  if (!game.solarSystem) {
    throw new Error('expected solar system');
  }
  const space = game.solarSystem.spaces.find(
    (candidate) =>
      candidate.ringIndex > 0 &&
      Math.floor(candidate.indexInRing / candidate.ringIndex) === sectorIndex,
  );
  if (!space) {
    throw new Error(`missing space for sector ${sectorIndex}`);
  }
  return space.id;
}

function addAnomalyToken(
  game: Game,
  sectorIndex: number,
  color: ETrace,
  rewards: TSlotReward[] = [{ type: 'VP', amount: 2 }],
): void {
  const board = game.alienState.getBoardByType(EAlienType.ANOMALIES);
  if (!board) {
    throw new Error('expected anomalies board');
  }

  board.addSlot({
    slotId: `alien-${board.alienIndex}-anomaly-token|${sectorIndex}|${color}`,
    alienIndex: board.alienIndex,
    traceColor: color,
    maxOccupants: 0,
    rewards,
    isDiscovery: false,
  });
}

function placeProbeAtEarth(game: Game, player: Player): string {
  const earthSector = getEarthSectorIndex(game);
  const earthSpaceId = getSpaceIdForSector(game, earthSector);
  if (!game.solarSystem) {
    throw new Error('expected solar system');
  }
  game.solarSystem.placeProbe(player.id, earthSpaceId);
  player.probesInSpace += 1;
  return earthSpaceId;
}

function toAnySignalOptionId(color: ESector): string {
  if (color === 'red-signal') return 'any-signal-red';
  if (color === 'yellow-signal') return 'any-signal-yellow';
  if (color === 'blue-signal') return 'any-signal-blue';
  return 'any-signal-black';
}

function resolveInputs(
  game: Game,
  player: Player,
  pick?: (model: IPlayerInputModel) => string,
): void {
  let guard = 0;
  while (player.waitingFor) {
    guard += 1;
    if (guard > 40) {
      throw new Error('input resolution exceeded 40 iterations');
    }
    const model = player.waitingFor.toModel() as IPlayerInputModel;
    const selected = pick?.(model);

    if (model.type === EPlayerInputType.OPTION) {
      const options = (model as ISelectOptionInputModel).options;
      const done = options.find((o) => o.id === 'done')?.id;
      const skip = options.find((o) => o.id === 'skip-missions')?.id;
      const optionId = selected ?? done ?? skip ?? options[0]?.id;
      if (!optionId) throw new Error('missing option selection');
      game.processInput(player.id, { type: EPlayerInputType.OPTION, optionId });
      continue;
    }

    if (model.type === EPlayerInputType.CARD) {
      const cards = (model as ISelectCardInputModel).cards;
      const cardId = selected ?? cards[0]?.id;
      if (!cardId) throw new Error('missing card selection');
      game.processInput(player.id, {
        type: EPlayerInputType.CARD,
        cardIds: [cardId],
      });
      continue;
    }

    if (model.type === EPlayerInputType.TRACE) {
      const traces = (model as ISelectTraceInputModel).options;
      const trace = (selected as ETrace | undefined) ?? traces[0];
      if (!trace) throw new Error('missing trace selection');
      game.processInput(player.id, { type: EPlayerInputType.TRACE, trace });
      continue;
    }

    throw new Error(`unsupported input type in test: ${model.type}`);
  }
}

function playCard(game: Game, player: Player, cardId: string): void {
  const index = player.hand.findIndex((card) => card === cardId);
  if (index < 0) {
    throw new Error(`card ${cardId} not found in hand`);
  }
  game.processMainAction(player.id, {
    type: EMainAction.PLAY_CARD,
    payload: { cardIndex: index },
  });
}

describe('Anomalies alien cards ET.11-ET.20', () => {
  it('ET.11 gains +1 move only when launched probe sector has an anomaly token', () => {
    const withAnomaly = createGame('et-11-with-anomaly');
    const withEarthSector = getEarthSectorIndex(withAnomaly.game);
    addAnomalyToken(withAnomaly.game, withEarthSector, ETrace.RED);
    withAnomaly.player.hand = ['ET.11'];

    playCard(withAnomaly.game, withAnomaly.player, 'ET.11');
    resolveInputs(withAnomaly.game, withAnomaly.player);

    expect(withAnomaly.player.probesInSpace).toBe(1);
    expect(withAnomaly.player.getMoveStash()).toBe(1);

    const withoutAnomaly = createGame('et-11-without-anomaly');
    withoutAnomaly.player.hand = ['ET.11'];
    playCard(withoutAnomaly.game, withoutAnomaly.player, 'ET.11');
    resolveInputs(withoutAnomaly.game, withoutAnomaly.player);

    expect(withoutAnomaly.player.probesInSpace).toBe(1);
    expect(withoutAnomaly.player.getMoveStash()).toBe(0);
  });

  it('ET.12 disables movement publicity for the current turn, including multiple moves', () => {
    const { game, player } = createGame('et-12-no-publicity');
    const startSpaceId = placeProbeAtEarth(game, player);

    if (!game.solarSystem) {
      throw new Error('expected solar system');
    }
    const adjacent = game.solarSystem.getAdjacentSpaces(startSpaceId)[0];
    if (adjacent) {
      adjacent.hasPublicityIcon = true;
      adjacent.publicityIconAmount = 1;
    }
    expect(adjacent).toBeDefined();

    player.hand = ['ET.12'];
    const publicityBefore = player.resources.publicity;
    playCard(game, player, 'ET.12');
    resolveInputs(game, player);

    expect(game.phase).toBe(EPhase.AWAIT_END_TURN);
    const iconSpaceId = adjacent?.id;
    if (!iconSpaceId) throw new Error('missing adjacent publicity space');

    game.processFreeAction(player.id, {
      type: EFreeAction.MOVEMENT,
      path: [startSpaceId, iconSpaceId],
    });
    game.processFreeAction(player.id, {
      type: EFreeAction.MOVEMENT,
      path: [iconSpaceId, startSpaceId, iconSpaceId],
    });

    expect(player.resources.publicity).toBe(publicityBefore);
  });

  it('ET.14 marks the additional signal on the closest counter-clockwise anomaly sector', () => {
    const { game, player } = createGame('et-14-next-anomaly-sector');
    const earth = getEarthSectorIndex(game);
    const counterClockwise =
      (earth + game.sectors.length - 1) % game.sectors.length;
    const clockwise = (earth + 1) % game.sectors.length;
    addAnomalyToken(game, counterClockwise, ETrace.YELLOW);
    addAnomalyToken(game, clockwise, ETrace.BLUE);

    player.hand = ['ET.14'];
    const before = game.sectors[counterClockwise].getPlayerMarkerCount(
      player.id,
    );
    playCard(game, player, 'ET.14');
    resolveInputs(game, player);

    expect(game.sectors[counterClockwise].getPlayerMarkerCount(player.id)).toBe(
      before + 1,
    );
    expect(game.sectors[clockwise]).toBeDefined();
  });

  it('ET.15 follows draw3 -> discard for corner -> discard for income resource', () => {
    const { game, player } = createGame('et-15-discard-flow');
    game.mainDeck = new Deck(['ET.17', 'ET.12', 'ET.20', '55'], []);
    player.hand = ['ET.15'];

    const scoreBefore = player.score;
    const moveBefore = player.getMoveStash();
    const creditsBefore = player.resources.credits;
    let discardStep = 0;

    playCard(game, player, 'ET.15');
    resolveInputs(game, player, (model) => {
      if (model.type !== EPlayerInputType.CARD) return '';
      discardStep += 1;
      const cards = (model as ISelectCardInputModel).cards;
      if (discardStep === 1) {
        return cards.find((c) => c.id.includes('ET.17'))?.id ?? cards[0].id;
      }
      return cards.find((c) => c.id.includes('ET.12'))?.id ?? cards[0].id;
    });

    expect(player.score).toBe(scoreBefore + 1);
    expect(player.getMoveStash()).toBe(moveBefore + 1);
    expect(player.resources.credits).toBe(creditsBefore + 1 - 1);
    expect(player.hand).toContain('ET.20');
    expect(player.hand).not.toContain('ET.17');
    expect(player.hand).not.toContain('ET.12');
  });

  it('ET.16 takes three cards from anomalies row/deck and safely stops when empty', () => {
    const normal = createGame('et-16-three-cards');
    const normalBoard = normal.game.alienState.getBoardByType(
      EAlienType.ANOMALIES,
    );
    if (!normalBoard) throw new Error('expected anomalies board');
    normalBoard.faceUpAlienCardId = 'ET.11';
    normalBoard.alienDeckDrawPile = ['ET.12', 'ET.13'];
    normal.player.hand = ['ET.16'];

    playCard(normal.game, normal.player, 'ET.16');
    resolveInputs(normal.game, normal.player);
    expect(normal.player.hand).toEqual(
      expect.arrayContaining(['ET.11', 'ET.12', 'ET.13']),
    );

    const emptySafe = createGame('et-16-empty-safe');
    const emptyBoard = emptySafe.game.alienState.getBoardByType(
      EAlienType.ANOMALIES,
    );
    if (!emptyBoard) throw new Error('expected anomalies board');
    emptyBoard.faceUpAlienCardId = 'ET.11';
    emptyBoard.alienDeckDrawPile = [];
    emptyBoard.alienDeckDiscardPile = [];
    emptySafe.player.hand = ['ET.16'];

    playCard(emptySafe.game, emptySafe.player, 'ET.16');
    resolveInputs(emptySafe.game, emptySafe.player);
    expect(emptySafe.player.hand).toEqual(expect.arrayContaining(['ET.11']));
  });

  it('ET.17 immediately gains closest counter-clockwise anomaly reward and still keeps quick mission card state', () => {
    const { game, player } = createGame('et-17-immediate-next-reward');
    const earth = getEarthSectorIndex(game);
    const counterClockwise =
      (earth + game.sectors.length - 1) % game.sectors.length;
    const clockwise = (earth + 1) % game.sectors.length;
    addAnomalyToken(game, counterClockwise, ETrace.BLUE, [
      { type: 'PUBLICITY', amount: 2 },
    ]);
    addAnomalyToken(game, clockwise, ETrace.RED, [{ type: 'VP', amount: 5 }]);

    player.hand = ['ET.17'];
    const publicityBefore = player.resources.publicity;
    const scoreBefore = player.score;
    playCard(game, player, 'ET.17');
    resolveInputs(game, player);

    expect(player.resources.publicity).toBe(publicityBefore + 2);
    expect(player.score).toBe(scoreBefore);
    expect(
      player.playedMissions.some(
        (card) => (typeof card === 'string' ? card : card.id) === 'ET.17',
      ),
    ).toBe(true);
  });

  it('ET.20 keeps any-signal choice and scores per own signals in anomaly sectors only', () => {
    const { game, player } = createGame('et-20-any-signal-and-score');
    addAnomalyToken(game, 0, ETrace.RED);
    addAnomalyToken(game, 2, ETrace.YELLOW);

    game.sectors[0].markSignal(player.id);
    game.sectors[0].markSignal(player.id);
    game.sectors[2].markSignal(player.id);
    game.sectors[4].markSignal(player.id);
    game.sectors[4].markSignal(player.id);

    const targetSectorId = game.sectors[0].id;
    const targetColor = game.sectors[0].color as ESector;
    player.hand = ['ET.20'];
    const scoreBefore = player.score;
    let sawAnySignalPrompt = false;

    playCard(game, player, 'ET.20');
    resolveInputs(game, player, (model) => {
      if (model.type !== EPlayerInputType.OPTION) return '';
      const optionModel = model as ISelectOptionInputModel;
      if (optionModel.options.some((o) => o.id.startsWith('any-signal-'))) {
        sawAnySignalPrompt = true;
        return toAnySignalOptionId(targetColor);
      }
      return optionModel.options.find((o) => o.id === targetSectorId)?.id ?? '';
    });

    expect(sawAnySignalPrompt).toBe(true);
    expect(player.score).toBe(scoreBefore + 4);
  });

  it('ET.13 / ET.18 / ET.19 still resolve as regression checks', () => {
    const { game, player } = createGame('et-regression-13-18-19');
    player.hand = ['ET.13', 'ET.18', 'ET.19'];

    const publicityBefore = player.resources.publicity;

    playCard(game, player, 'ET.13');
    resolveInputs(game, player);
    expect(player.resources.publicity).toBe(publicityBefore + 1);
    expect(
      player.playedMissions.some(
        (card) => (typeof card === 'string' ? card : card.id) === 'ET.13',
      ),
    ).toBe(true);
    game.processEndTurn(player.id);
    game.setActivePlayer(player.id);

    playCard(game, player, 'ET.18');
    resolveInputs(game, player);
    expect(player.techs.length).toBeGreaterThan(0);
    game.processEndTurn(player.id);
    game.setActivePlayer(player.id);

    const traceBefore =
      (player.traces[ETrace.RED] ?? 0) +
      (player.traces[ETrace.YELLOW] ?? 0) +
      (player.traces[ETrace.BLUE] ?? 0);
    playCard(game, player, 'ET.19');
    resolveInputs(game, player);
    const traceAfter =
      (player.traces[ETrace.RED] ?? 0) +
      (player.traces[ETrace.YELLOW] ?? 0) +
      (player.traces[ETrace.BLUE] ?? 0);
    expect(traceAfter).toBeGreaterThan(traceBefore);
  });

  it('safe no-op when anomaly context is missing or next anomaly cannot be determined', () => {
    const noNext = createGame('et-17-no-next-anomaly');
    noNext.player.hand = ['ET.17'];
    const before = noNext.player.resources.publicity;

    playCard(noNext.game, noNext.player, 'ET.17');
    resolveInputs(noNext.game, noNext.player);
    expect(noNext.player.resources.publicity).toBe(before);

    const noAnomaly = createGame('et-14-no-anomaly-token');
    noAnomaly.player.hand = ['ET.14'];
    expect(() => {
      playCard(noAnomaly.game, noAnomaly.player, 'ET.14');
      resolveInputs(noAnomaly.game, noAnomaly.player);
    }).not.toThrow();
  });
});
