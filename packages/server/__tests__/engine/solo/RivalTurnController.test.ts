import { alienCards } from '@seti/common/data/alienCards';
import { ESector, ETrace } from '@seti/common/types/element';
import { EAlienType, EPhase, EPlanet } from '@seti/common/types/protocol/enums';
import { ERivalActionKind } from '@seti/common/types/protocol/solo';
import { ETechBonusType, ETechId } from '@seti/common/types/tech';
import {
  isAnomaliesAlienBoard,
  isCentauriansAlienBoard,
  isExertiansAlienBoard,
  isMascamitesAlienBoard,
  isOumuamuaAlienBoard,
} from '@/engine/alien/AlienBoard.js';
import { AlienRegistry } from '@/engine/alien/AlienRegistry.js';
import { AlienState } from '@/engine/alien/AlienState.js';
import { getNextTriggeredAnomalyToken } from '@/engine/alien/plugins/AnomaliesResolver.js';
import { ESolarSystemElementType } from '@/engine/board/SolarSystem.js';
import type { TSectorSignal } from '@/engine/board/Sector.js';
import { Deck } from '@/engine/deck/Deck.js';
import { Game } from '@/engine/Game.js';
import { RivalResourceResolver } from '@/engine/solo/RivalResourceResolver.js';
import { RivalTurnController } from '@/engine/solo/RivalTurnController.js';
import { discoverOumuamua } from '../../helpers/OumuamuaTestUtils.js';
import { resolveSetupTucks } from '../../helpers/TestGameBuilder.js';

function createSoloGame(soloDifficulty = 3): Game {
  const game = Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      {
        id: 'rival:solo-turn',
        name: 'Rival Institution',
        color: 'blue',
        seatIndex: 1,
      },
    ],
    {
      playerCount: 2,
      isSoloMode: true,
      soloDifficulty,
    } as Parameters<typeof Game.create>[1],
    'solo-turn-seed',
    'solo-turn',
  );
  resolveSetupTucks(game);
  game.activePlayer = game.players[1];
  return game;
}

function finishRound(game: Game): void {
  game.players.forEach((player) => {
    player.passed = true;
  });
  game.activePlayer = game.players[0];
  game.phase = EPhase.AWAIT_END_TURN;
  game.processEndTurn(game.activePlayer.id);
}

function dataSignal(tokenId: string): TSectorSignal {
  return { type: 'data', tokenId };
}

function forceTelescopeFallback(game: Game, cardId: 'S.2' | 'S.5'): void {
  const rival = game.players[1];
  const rivalState = game.rivalState;
  if (!rivalState) throw new Error('expected rival state');
  rivalState.actionDeck = new Deck([cardId]);
  rival.resources.spend({ publicity: rival.resources.publicity });
}

const EXERTIAN_CARD_IDS = alienCards
  .filter((card) => card.alien === EAlienType.EXERTIANS)
  .map((card) => card.id);

function discoverAnomalies(game: Game) {
  game.alienState = AlienState.createFromHiddenAliens([EAlienType.ANOMALIES]);
  const board = game.alienState.getBoardByType(EAlienType.ANOMALIES);
  if (!isAnomaliesAlienBoard(board)) {
    throw new Error('expected anomalies board');
  }

  board.discovered = true;
  AlienRegistry.get(EAlienType.ANOMALIES)?.onDiscover?.(game, []);
  const token = getNextTriggeredAnomalyToken(game);
  if (!token) {
    throw new Error('expected next triggered anomaly token');
  }
  const column = board.anomalyColumns.find(
    (slot) => slot.traceColor === token.color,
  );
  if (!column) {
    throw new Error('expected anomaly column for token color');
  }

  return { board, column, token };
}

function discoverExertians(game: Game) {
  game.alienState = AlienState.createFromHiddenAliens([EAlienType.EXERTIANS]);
  const board = game.alienState.getBoardByType(EAlienType.EXERTIANS);
  if (!isExertiansAlienBoard(board)) {
    throw new Error('expected exertians board');
  }

  board.discovered = true;
  AlienRegistry.get(EAlienType.EXERTIANS)?.onDiscover?.(game, []);
  game.players[1].hand = [];
  return board;
}

function discoverCentaurians(game: Game) {
  game.alienState = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
  const board = game.alienState.getBoardByType(EAlienType.CENTAURIANS);
  if (!isCentauriansAlienBoard(board)) {
    throw new Error('expected centaurians board');
  }

  board.discovered = true;
  AlienRegistry.get(EAlienType.CENTAURIANS)?.onDiscover?.(game, []);
  return board;
}

function discoverMascamites(game: Game) {
  game.alienState = AlienState.createFromHiddenAliens([EAlienType.MASCAMITES]);
  const board = game.alienState.getBoardByType(EAlienType.MASCAMITES);
  if (!isMascamitesAlienBoard(board)) {
    throw new Error('expected mascamites board');
  }

  board.discovered = true;
  AlienRegistry.get(EAlienType.MASCAMITES)?.onDiscover?.(game, []);
  return board;
}

describe('RivalTurnController', () => {
  it('reveals the top rival action card and resolves the first possible launch candidate', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.actionDeck = new Deck(['S.1']);

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.1',
      actionKind: ERivalActionKind.LAUNCH_PROBE,
    });
    expect(rivalState.currentActionCardId).toBe('S.1');
    expect(rivalState.actionDeck.drawSize).toBe(0);
    expect(rivalState.actionDeck.discardSize).toBe(1);
    expect(rival.probesInSpace).toBe(1);
    expect(
      game.solarSystem?.spaces.some((space) =>
        space.occupants.some((probe) => probe.playerId === rival.id),
      ),
    ).toBe(true);
    expect(game.activePlayer.id).toBe('p1');
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
  });

  it('appends a public event with the revealed rival card id and resolved action kind', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.actionDeck = new Deck(['S.4']);

    RivalTurnController.resolveCurrentTurn(game);

    const event = game.eventLog
      .toArray()
      .find(
        (candidate) =>
          candidate.type === 'ACTION' &&
          candidate.playerId === rival.id &&
          candidate.action === 'RIVAL_ACTION',
      );
    if (!event || event.type !== 'ACTION') {
      throw new Error('expected rival action event');
    }
    expect(event.details).toMatchObject({
      cardId: 'S.4',
      actionKind: ERivalActionKind.RESEARCH_TECH,
    });
  });

  it('passes when the rival action deck is empty and converts the removed EOR card to progress', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.actionDeck = new Deck([]);
    const stack = game.endOfRoundStacks[game.roundRotationReminderIndex];
    const stackSizeBefore = stack.length;
    const progressBefore = rivalState.progress;

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({ kind: 'pass' });
    expect(stack).toHaveLength(stackSizeBefore - 1);
    expect(rivalState.progress).toBe(progressBefore + 1);
    expect(rival.passed).toBe(true);
    expect(game.activePlayer.id).toBe('p1');
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
  });

  it('resolves a free tech candidate and applies progress rewards', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.actionDeck = new Deck(['S.4']);
    const progressBefore = rivalState.progress;

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.4',
      actionKind: ERivalActionKind.RESEARCH_TECH,
    });
    expect(rival.techs).toHaveLength(1);
    expect(rivalState.progress).toBeGreaterThanOrEqual(progressBefore + 1);
    expect(game.activePlayer.id).toBe('p1');
  });

  it('chooses tech from the rival board preference instead of tech board insertion order', () => {
    const game = createSoloGame(2);
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.actionDeck = new Deck(['S.4']);
    rivalState.progress = 0;
    rivalState.progressSlot = 0;

    RivalTurnController.resolveCurrentTurn(game);

    expect(rival.techs).toContain(ETechId.COMPUTER_VP_CREDIT);
    expect(rival.techs).not.toContain(ETechId.PROBE_DOUBLE_PROBE);
  });

  it('skips preferred tech stacks without the first-take VP bonus when another stack still has it', () => {
    const game = createSoloGame(2);
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.actionDeck = new Deck(['S.4']);
    rivalState.progress = 0;
    rivalState.progressSlot = 0;
    const preferredStack = game.techBoard?.getStack(ETechId.COMPUTER_VP_CREDIT);
    if (!preferredStack) throw new Error('expected tech stack');
    preferredStack.firstTakeBonusAvailable = false;

    RivalTurnController.resolveCurrentTurn(game);

    expect(rival.techs).toContain(ETechId.COMPUTER_VP_ENERGY);
  });

  it('converts rival tech card bonuses to progress and keeps the action reward', () => {
    const game = createSoloGame(2);
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.actionDeck = new Deck(['S.4']);
    rivalState.progress = 0;
    rivalState.progressSlot = 0;
    const stack = game.techBoard?.getStack(ETechId.COMPUTER_VP_CREDIT);
    if (!stack?.tiles[0]) throw new Error('expected tech tile');
    stack.tiles[0].bonus = { type: ETechBonusType.CARD };

    RivalTurnController.resolveCurrentTurn(game);

    expect(rivalState.progress).toBe(2);
  });

  it('ignores the rival probe launch tech bonus', () => {
    const game = createSoloGame(5);
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.actionDeck = new Deck(['S.4']);
    rivalState.progress = 0;
    rivalState.progressSlot = 0;
    const stack = game.techBoard?.getStack(ETechId.PROBE_DOUBLE_PROBE);
    if (!stack?.tiles[0]) throw new Error('expected tech tile');
    stack.tiles[0].bonus = undefined;

    RivalTurnController.resolveCurrentTurn(game);

    expect(rival.techs).toContain(ETechId.PROBE_DOUBLE_PROBE);
    expect(rival.probesInSpace).toBe(0);
  });

  it('ignores the rival 2-data tech bonus', () => {
    const game = createSoloGame(3);
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.actionDeck = new Deck(['S.4']);
    rivalState.progress = 12;
    rivalState.progressSlot = 0;
    const stack = game.techBoard?.getStack(ETechId.SCAN_EARTH_LOOK);
    if (!stack?.tiles[0]) throw new Error('expected tech tile');
    stack.tiles[0].bonus = undefined;

    RivalTurnController.resolveCurrentTurn(game);

    expect(rival.techs).toContain(ETechId.SCAN_EARTH_LOOK);
    expect(rival.resources.data).toBe(0);
    expect(rivalState.computer.filledSlots.some(Boolean)).toBe(false);
  });

  it('resolves a probe candidate before the later free tech candidate', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    const jupiter = game.solarSystem?.getPlanetLocation(EPlanet.JUPITER);
    if (!rivalState || !jupiter) throw new Error('expected solo setup');
    game.solarSystem?.placeProbe(rival.id, jupiter.space.id);
    rival.probesInSpace = 1;
    rivalState.actionDeck = new Deck(['S.4']);
    const techCountBefore = rival.techs.length;

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.4',
      actionKind: ERivalActionKind.PROBE_PLACEMENT,
    });
    expect(rival.techs).toHaveLength(techCountBefore);
    expect(
      game.planetaryBoard?.planets
        .get(EPlanet.JUPITER)
        ?.orbitSlots.some((slot) => slot.playerId === rival.id),
    ).toBe(true);
    expect(rival.probesInSpace).toBe(0);
  });

  it('chooses the highest-publicity reachable probe path and gains the movement publicity', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    const solarSystem = game.solarSystem;
    const earth = solarSystem?.getPlanetLocation(EPlanet.EARTH);
    const jupiter = solarSystem?.getPlanetLocation(EPlanet.JUPITER);
    if (!rivalState || !solarSystem || !earth || !jupiter) {
      throw new Error('expected solo setup');
    }

    const [plainSpace, scenicSpace] = solarSystem.spaces.filter(
      (space) =>
        space.id !== earth.space.id &&
        space.id !== jupiter.space.id &&
        space.elements.every(
          (element) =>
            element.type !== ESolarSystemElementType.SUN &&
            element.type !== ESolarSystemElementType.PLANET &&
            element.type !== ESolarSystemElementType.EARTH,
        ),
    );
    if (!plainSpace || !scenicSpace) {
      throw new Error('expected path spaces');
    }

    for (const space of solarSystem.spaces) {
      solarSystem.adjacency.set(space.id, []);
    }
    const link = (from: string, to: string) => {
      solarSystem.adjacency.get(from)?.push(to);
      solarSystem.adjacency.get(to)?.push(from);
    };
    link(earth.space.id, plainSpace.id);
    link(plainSpace.id, jupiter.space.id);
    link(earth.space.id, scenicSpace.id);
    link(scenicSpace.id, jupiter.space.id);

    plainSpace.hasPublicityIcon = false;
    scenicSpace.hasPublicityIcon = true;
    scenicSpace.publicityIconAmount = 2;
    scenicSpace.elements = [{ type: ESolarSystemElementType.COMET, amount: 1 }];
    jupiter.space.hasPublicityIcon = false;

    solarSystem.placeProbe(rival.id, earth.space.id);
    rival.probesInSpace = 1;
    rival.resources.spend({ publicity: rival.resources.publicity });
    rivalState.actionDeck = new Deck(['S.4']);

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.4',
      actionKind: ERivalActionKind.PROBE_PLACEMENT,
    });
    expect(solarSystem.getPlayerPublicity(rival.id)).toBe(2);
    expect(rival.resources.publicity).toBe(2);
  });

  it('lands when a printed orbiter action has no first-orbit bonus and a first-land bonus is available', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    const jupiter = game.solarSystem?.getPlanetLocation(EPlanet.JUPITER);
    const jupiterState = game.planetaryBoard?.planets.get(EPlanet.JUPITER);
    if (!rivalState || !jupiter || !jupiterState) {
      throw new Error('expected solo setup');
    }
    jupiterState.firstOrbitClaimed = true;
    game.solarSystem?.placeProbe(rival.id, jupiter.space.id);
    rival.probesInSpace = 1;
    rivalState.actionDeck = new Deck(['S.4']);

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.4',
      actionKind: ERivalActionKind.PROBE_PLACEMENT,
    });
    expect(jupiterState.orbitSlots).toHaveLength(0);
    expect(jupiterState.landingSlots).toEqual([{ playerId: rival.id }]);
  });

  it('orbits when a printed lander action has no first-land bonus and a first-orbit bonus is available', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    const uranus = game.solarSystem?.getPlanetLocation(EPlanet.URANUS);
    const uranusState = game.planetaryBoard?.planets.get(EPlanet.URANUS);
    if (!rivalState || !uranus || !uranusState) {
      throw new Error('expected solo setup');
    }
    uranusState.firstLandDataBonusTaken =
      uranusState.firstLandDataBonusTaken.map(() => true);
    game.solarSystem?.placeProbe(rival.id, uranus.space.id);
    rival.probesInSpace = 1;
    rival.resources.spend({ publicity: rival.resources.publicity });
    rivalState.actionDeck = new Deck(['S.7']);

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.7',
      actionKind: ERivalActionKind.PROBE_PLACEMENT,
    });
    expect(uranusState.orbitSlots).toEqual([{ playerId: rival.id }]);
    expect(uranusState.landingSlots).toHaveLength(0);
  });

  it('uses a probe tech to land on a moon even when the printed priority is orbiter', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    const jupiter = game.solarSystem?.getPlanetLocation(EPlanet.JUPITER);
    const jupiterState = game.planetaryBoard?.planets.get(EPlanet.JUPITER);
    if (!rivalState || !jupiter || !jupiterState) {
      throw new Error('expected solo setup');
    }
    game.solarSystem?.placeProbe(rival.id, jupiter.space.id);
    rival.probesInSpace = 1;
    rival.gainTech(ETechId.PROBE_DOUBLE_PROBE);
    rivalState.actionDeck = new Deck(['S.4']);

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.4',
      actionKind: ERivalActionKind.PROBE_PLACEMENT,
    });
    expect(rival.techs).not.toContain(ETechId.PROBE_DOUBLE_PROBE);
    expect(jupiterState.moonOccupant?.playerId).toBe(rival.id);
    expect(jupiterState.orbitSlots).toHaveLength(0);
  });

  it('discards one probe tech to prioritize landing on an available moon', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    const uranus = game.solarSystem?.getPlanetLocation(EPlanet.URANUS);
    if (!rivalState || !uranus) throw new Error('expected solo setup');
    game.solarSystem?.placeProbe(rival.id, uranus.space.id);
    rival.probesInSpace = 1;
    rival.resources.spend({ publicity: rival.resources.publicity });
    rival.gainTech(ETechId.PROBE_DOUBLE_PROBE);
    rivalState.actionDeck = new Deck(['S.7']);

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.7',
      actionKind: ERivalActionKind.PROBE_PLACEMENT,
    });
    expect(rival.techs).not.toContain(ETechId.PROBE_DOUBLE_PROBE);
    expect(
      game.planetaryBoard?.planets.get(EPlanet.URANUS)?.moonOccupant?.playerId,
    ).toBe(rival.id);
    expect(rival.probesInSpace).toBe(0);
  });

  it('falls through to telescope when paid tech is not affordable', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.actionDeck = new Deck(['S.2']);
    rival.resources.spend({ publicity: 4 });

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.2',
      actionKind: ERivalActionKind.SCAN,
    });
    expect(
      game.sectors.some((sector) =>
        sector.signals.some(
          (signal) => signal.type === 'player' && signal.playerId === rival.id,
        ),
      ),
    ).toBe(true);
    expect(rivalState.computer.filledSlots.some(Boolean)).toBe(true);
    expect(game.activePlayer.id).toBe('p1');
  });

  it('uses the card row side from the rival decision arrow for default telescope', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    forceTelescopeFallback(game, 'S.2');
    game.cardRow = [
      { id: 'left-red', sector: ESector.RED },
      { id: 'middle-blue', sector: ESector.BLUE },
      { id: 'right-yellow', sector: ESector.YELLOW },
    ];
    game.mainDeck = new Deck(['refill-1', 'refill-2']);

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.2',
      actionKind: ERivalActionKind.SCAN,
    });
    expect(game.mainDeck.getDiscardPile()).toEqual([
      'right-yellow',
      'middle-blue',
    ]);
    expect(game.cardRow).toEqual([
      { id: 'left-red', sector: ESector.RED },
      'refill-1',
      'refill-2',
    ]);
    expect(
      game.sectors
        .filter((sector) => sector.color === ESector.YELLOW)
        .some((sector) => sector.getPlayerMarkerCount(rival.id) === 1),
    ).toBe(true);
  });

  it('discards one scan tech to mark one extra card-row signal during telescope', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    forceTelescopeFallback(game, 'S.2');
    rival.gainTech(ETechId.SCAN_EARTH_LOOK);
    game.cardRow = [
      { id: 'extra-blue', sector: ESector.BLUE },
      { id: 'middle-yellow', sector: ESector.YELLOW },
      { id: 'right-red', sector: ESector.RED },
    ];
    game.mainDeck = new Deck(['refill-1', 'refill-2', 'refill-3']);

    RivalTurnController.resolveCurrentTurn(game);

    expect(rival.techs).not.toContain(ETechId.SCAN_EARTH_LOOK);
    expect(game.mainDeck.getDiscardPile()).toEqual([
      'right-red',
      'middle-yellow',
      'extra-blue',
    ]);
    expect(game.cardRow).toEqual(['refill-1', 'refill-2', 'refill-3']);
  });

  it('marks one card-row signal and two Earth signals for earth telescope cards', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    forceTelescopeFallback(game, 'S.5');
    game.cardRow = [
      { id: 'left-red', sector: ESector.RED },
      { id: 'right-yellow', sector: ESector.YELLOW },
    ];
    game.mainDeck = new Deck(['refill-1']);
    const earthSectorIndex = game.solarSystem?.getSectorIndexOfPlanet(
      EPlanet.EARTH,
    );
    if (earthSectorIndex === null || earthSectorIndex === undefined) {
      throw new Error('expected Earth sector');
    }
    const earthSector = game.sectors[earthSectorIndex];

    RivalTurnController.resolveCurrentTurn(game);

    expect(earthSector.getPlayerMarkerCount(rival.id)).toBe(2);
    expect(game.mainDeck.getDiscardPile()).toEqual(['left-red']);
    expect(game.cardRow).toEqual([
      { id: 'right-yellow', sector: ESector.YELLOW },
      'refill-1',
    ]);
  });

  it('chooses a matching-color sector where the telescope signal wins the sector', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    forceTelescopeFallback(game, 'S.2');
    game.cardRow = [
      { id: 'left-red', sector: ESector.RED },
      { id: 'right-yellow', sector: ESector.YELLOW },
    ];
    const [winningSector, otherSector] = game.sectors.filter(
      (sector) => sector.color === ESector.YELLOW,
    );
    if (!winningSector || !otherSector) {
      throw new Error('expected two yellow sectors');
    }
    winningSector.signals = Array.from(
      { length: winningSector.dataSlotCapacity },
      (_, index) =>
        index === winningSector.dataSlotCapacity - 1
          ? dataSignal('winning-data')
          : {
              type: 'player',
              playerId: index % 2 === 0 ? rival.id : 'p1',
            },
    );
    otherSector.signals = Array.from(
      { length: otherSector.dataSlotCapacity },
      (_, index) => dataSignal(`other-data-${index}`),
    );

    RivalTurnController.resolveCurrentTurn(game);

    expect(winningSector.getDataCount()).toBe(0);
    expect(winningSector.getPlayerMarkerCount(rival.id)).toBeGreaterThan(
      otherSector.getPlayerMarkerCount(rival.id),
    );
  });

  it('replaces a discovered species life check card with the mapped special card immediately', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    game.alienState = new AlienState({
      aliens: [
        { alienType: EAlienType.MASCAMITES, alienIndex: 0, discovered: true },
        { alienType: EAlienType.ANOMALIES, alienIndex: 1, discovered: false },
      ],
    });
    rivalState.actionDeck = new Deck(['S.3']);

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.15',
      actionKind: ERivalActionKind.LAUNCH_PROBE,
    });
    expect(rivalState.removedActionCardIds).toContain('S.3');
    expect(rivalState.currentActionCardId).toBe('S.15');
    expect(rivalState.actionDeck.getDiscardPile()).toEqual(['S.15']);
    expect(rivalState.usedActionCardIdsThisRound).toEqual(['S.15']);
    expect(rival.probesInSpace).toBe(1);
  });

  it('skips a species life check when the indexed species is still hidden', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    game.alienState = new AlienState({
      aliens: [
        { alienType: EAlienType.MASCAMITES, alienIndex: 0, discovered: false },
        { alienType: EAlienType.ANOMALIES, alienIndex: 1, discovered: false },
      ],
    });
    rivalState.actionDeck = new Deck(['S.3']);
    rival.resources.spend({ publicity: rival.resources.publicity });

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.3',
      actionKind: ERivalActionKind.SCAN,
    });
    expect(rivalState.removedActionCardIds).toEqual([]);
    expect(rivalState.actionDeck.getDiscardPile()).toEqual(['S.3']);
  });

  it('resolves the Oumuamua special probe target as a lander placement', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    discoverOumuamua(game);
    const location = game.solarSystem?.getPlanetLocation(EPlanet.OUMUAMUA);
    if (!location) throw new Error('expected oumuamua location');
    game.solarSystem?.placeProbe(rival.id, location.space.id);
    rival.probesInSpace = 1;
    rivalState.actionDeck = new Deck(['S.17']);

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.17',
      actionKind: ERivalActionKind.PROBE_PLACEMENT,
    });
    expect(
      game.planetaryBoard?.planets
        .get(EPlanet.OUMUAMUA)
        ?.landingSlots.some((slot) => slot.playerId === rival.id),
    ).toBe(true);
    expect(rival.exofossils).toBe(2);
    expect(rival.probesInSpace).toBe(0);
  });

  it('marks the Oumuamua tile for the Oumuamua special scan fallback', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    discoverOumuamua(game);
    const board = game.alienState.getBoardByType(EAlienType.OUMUAMUA);
    if (!isOumuamuaAlienBoard(board) || !board.oumuamuaTile) {
      throw new Error('expected oumuamua tile');
    }
    const dataRemainingBefore = board.oumuamuaTile.dataRemaining;
    rivalState.actionDeck = new Deck(['S.17']);
    rival.resources.spend({ publicity: rival.resources.publicity });
    game.cardRow = [{ id: 'left-red', sector: ESector.RED }];

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.17',
      actionKind: ERivalActionKind.SCAN,
    });
    expect(board.oumuamuaTile.markerPlayerIds).toContain(rival.id);
    expect(board.oumuamuaTile.dataRemaining).toBe(dataRemainingBefore - 1);
  });

  it('marks the next Anomalies trace and converts the column reward for the special card', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    const { board, column, token } = discoverAnomalies(game);
    rivalState.actionDeck = new Deck(['S.16']);
    rivalState.progress = 0;
    rivalState.progressSlot = 0;
    rival.score = 0;

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.16',
      actionKind: ERivalActionKind.MARK_TRACE,
    });
    expect(column.occupants).toEqual([
      { source: { playerId: rival.id }, traceColor: token.color },
    ]);
    expect(rival.score).toBe(8);
    expect(rivalState.progress).toBe(1);
    expect(rival.hand).toHaveLength(0);
    expect(rival.tracesByAlien[board.alienIndex]?.[token.color]).toBe(1);
  });

  it('falls through to free tech when the rival already leads the next Anomalies trace', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    const { column, token } = discoverAnomalies(game);
    column.occupants.push({
      source: { playerId: rival.id },
      traceColor: token.color,
    });
    rivalState.actionDeck = new Deck(['S.16']);
    const columnOccupantsBefore = column.occupants.length;

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.16',
      actionKind: ERivalActionKind.RESEARCH_TECH,
    });
    expect(column.occupants).toHaveLength(columnOccupantsBefore);
  });

  it('plays a face-down Exertian card for the Exertians special card below the danger limit', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    const board = discoverExertians(game);
    rivalState.actionDeck = new Deck(['S.19']);

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.19',
      actionKind: ERivalActionKind.PLAY_DANGER_CARD,
    });
    expect(board.faceDownCards).toHaveLength(1);
    expect(board.faceDownCards[0]).toMatchObject({
      ownerId: rival.id,
      source: 'discovery',
      revealed: false,
    });
    expect(EXERTIAN_CARD_IDS).toContain(board.faceDownCards[0]?.cardId);
    expect(rival.hand).toHaveLength(0);
  });

  it('falls through to Earth scan when the rival Exertian card and trace danger count is already five', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    const board = discoverExertians(game);
    for (const cardId of EXERTIAN_CARD_IDS.slice(0, 4)) {
      board.playFaceDownCard(rival.id, cardId, 'discovery');
    }
    const dangerSlot = board.speciesTraceSlots.find((slot) =>
      slot.rewards.some((reward) => reward.type === 'VP' && reward.amount > 0),
    );
    if (!dangerSlot) {
      throw new Error('expected Exertians danger trace slot');
    }
    board.placeTrace(dangerSlot, { playerId: rival.id }, dangerSlot.traceColor);
    rivalState.actionDeck = new Deck(['S.19']);

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.19',
      actionKind: ERivalActionKind.SCAN,
    });
    expect(board.faceDownCards).toHaveLength(4);
  });

  it('starts a Centaurians rival message milestone and resolves the default scan follow-up', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    const board = discoverCentaurians(game);
    for (const milestone of board.messageMilestones) {
      if (milestone.playerId === rival.id) {
        milestone.resolved = true;
      }
    }
    rival.score = 20;
    rivalState.actionDeck = new Deck(['S.18']);
    game.cardRow = [
      { id: 'left-red', sector: ESector.RED },
      { id: 'right-yellow', sector: ESector.YELLOW },
    ];
    game.mainDeck = new Deck(['refill-1', 'refill-2']);

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.18',
      actionKind: ERivalActionKind.START_COUNTDOWN,
    });
    expect(
      board.messageMilestones.filter(
        (milestone) => milestone.playerId === rival.id && !milestone.resolved,
      ),
    ).toEqual([
      {
        playerId: rival.id,
        threshold: 35,
        sourceCardId: null,
        resolved: false,
      },
    ]);
    expect(game.mainDeck.getDiscardPile()).toEqual([
      'right-yellow',
      'left-red',
    ]);
  });

  it('falls through to default scan when the rival already has an unresolved Centaurians message milestone', () => {
    const game = createSoloGame();
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    const board = discoverCentaurians(game);
    const milestoneCountBefore = board.messageMilestones.length;
    rivalState.actionDeck = new Deck(['S.18']);

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.18',
      actionKind: ERivalActionKind.SCAN,
    });
    expect(board.messageMilestones).toHaveLength(milestoneCountBefore);
  });

  it('falls through to default scan after the rival has used all three Centaurians message milestones', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    const board = discoverCentaurians(game);
    board.messageMilestones = [10, 20, 30].map((threshold) => ({
      playerId: rival.id,
      threshold,
      sourceCardId: null,
      resolved: true,
    }));
    rivalState.actionDeck = new Deck(['S.18']);

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.18',
      actionKind: ERivalActionKind.SCAN,
    });
    expect(board.messageMilestones).toHaveLength(3);
  });

  it('converts one Mascamites sample into a blue board slot after the special lander placement', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    const saturn = game.solarSystem?.getPlanetLocation(EPlanet.SATURN);
    if (!rivalState || !saturn) throw new Error('expected solo setup');
    const board = discoverMascamites(game);
    board.samplePools.saturn = ['mascamites-vp-7'];
    board.samplePools.jupiter = [];
    game.solarSystem?.placeProbe(rival.id, saturn.space.id);
    rival.probesInSpace = rival.probeSpaceLimit;
    rivalState.actionDeck = new Deck(['S.15']);

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.15',
      actionKind: ERivalActionKind.PROBE_PLACEMENT,
    });
    expect(board.samplePools.saturn).toEqual([]);
    expect(board.deliveredSamples).toEqual([
      expect.objectContaining({
        sampleTokenId: 'mascamites-vp-7',
        deliveredBy: rival.id,
      }),
    ]);
    expect(
      board.speciesTraceSlots.some(
        (slot) =>
          slot.traceColor === ETrace.BLUE &&
          slot.slotId.includes('mascamites-sample-blue'),
      ),
    ).toBe(true);
  });

  it('automatically claims the rightmost Centaurians reward when a solo rival message milestone resolves', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const board = discoverCentaurians(game);
    board.messageMilestones = [
      {
        playerId: rival.id,
        threshold: rival.score,
        sourceCardId: null,
        resolved: false,
      },
    ];
    const scoreBefore = rival.score;

    const input = game.milestoneState.checkAndQueue(game, rival);

    expect(input).toBeUndefined();
    expect(board.messageMilestones[0]?.resolved).toBe(true);
    expect(rival.score).toBe(scoreBefore + 8);
    expect(
      board.rewardSlots.find((slot) => slot.slotId === 'score-8')
        ?.claimedByPlayerId,
    ).toBe(rival.id);
  });

  it('resolves analyze before launch when the rival computer is full', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.actionDeck = new Deck(['S.1']);
    rivalState.computer.filledSlots = [true, true, true, true, true, true];

    const result = RivalTurnController.resolveCurrentTurn(game);

    expect(result).toMatchObject({
      cardId: 'S.1',
      actionKind: ERivalActionKind.ANALYZE_DATA,
    });
    expect(rivalState.computer.filledSlots).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(rival.probesInSpace).toBe(0);
    expect(game.activePlayer.id).toBe('p1');
  });

  it('places the rival blue life trace when analyze resolves', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.actionDeck = new Deck(['S.1']);
    rivalState.computer.filledSlots = [true, true, true, true, true, true];

    RivalTurnController.resolveCurrentTurn(game);

    const blueTraceSlots = game.alienState.boards.flatMap((board) =>
      board.getTraceSlots().filter((slot) => slot.traceColor === ETrace.BLUE),
    );
    expect(
      blueTraceSlots.some((slot) =>
        slot.occupants.some(
          (occupant) =>
            occupant.source !== 'neutral' &&
            occupant.source.playerId === rival.id,
        ),
      ),
    ).toBe(true);
    expect(rival.traces[ETrace.BLUE]).toBe(1);
  });

  it('discards one computer tech for VP and progress when analyze resolves', () => {
    const game = createSoloGame();
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.actionDeck = new Deck(['S.1']);
    rivalState.computer.filledSlots = [true, true, true, true, true, true];
    rivalState.progress = 0;
    rivalState.progressSlot = 0;
    rival.score = 5;
    rival.gainTech(ETechId.COMPUTER_VP_CREDIT);

    RivalTurnController.resolveCurrentTurn(game);

    expect(rival.techs).not.toContain(ETechId.COMPUTER_VP_CREDIT);
    expect(rival.score).toBeGreaterThanOrEqual(8);
    expect(rivalState.progress).toBeGreaterThanOrEqual(1);
  });

  it('adds one advanced action card when progress crosses the deck icon', () => {
    const game = createSoloGame();
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.progress = 11;
    rivalState.progressSlot = 11;
    rivalState.actionDeck = new Deck([]);
    rivalState.advancedReserve = new Deck(['S.5']);

    RivalResourceResolver.gainProgress(game, 1);

    expect(rivalState.progress).toBe(12);
    expect(rivalState.progressSlot).toBe(0);
    expect(rivalState.actionDeck.peek()[0]).toBe('S.5');
    expect(rivalState.advancedReserve.drawSize).toBe(0);
  });

  it('shuffles used rival action cards back into the draw pile at round transition', () => {
    const game = createSoloGame();
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.actionDeck = new Deck(['S.5'], ['S.1', 'S.2']);
    rivalState.usedActionCardIdsThisRound = ['S.1', 'S.2'];
    rivalState.currentActionCardId = 'S.2';

    finishRound(game);

    expect(game.round).toBe(2);
    expect(rivalState.actionDeck.discardSize).toBe(0);
    expect(new Set(rivalState.actionDeck.getDrawPile())).toEqual(
      new Set(['S.1', 'S.2', 'S.5']),
    );
    expect(rivalState.usedActionCardIdsThisRound).toEqual([]);
    expect(rivalState.currentActionCardId).toBeNull();
  });

  it('charges missing completed objectives as progress between rounds', () => {
    const game = createSoloGame(2);
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.progress = 0;
    rivalState.progressSlot = 0;
    rivalState.completedObjectiveIds = [];

    finishRound(game);

    expect(game.round).toBe(2);
    expect(rivalState.progress).toBe(3);
    expect(rivalState.progressSlot).toBe(3);
  });

  it('adds end-game VP for uncompleted revealed and stacked objectives', () => {
    const game = createSoloGame(2);
    const rival = game.players[1];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    game.round = 5;
    rival.score = 10;
    rivalState.revealedObjectiveIds = ['SOLO.1', 'SOLO.2'];
    rivalState.objectiveDrawPile = ['SOLO.3'];
    rivalState.completedObjectiveIds = ['SOLO.4'];

    finishRound(game);

    expect(game.phase).toBe(EPhase.GAME_OVER);
    expect(game.finalScoringResult?.scores[rival.id]).toBe(25);
  });
});
