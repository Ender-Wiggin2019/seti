import { EAlienType, EPlanet, ETrace } from '@seti/common/types/protocol/enums';
import { AlienState } from '@/engine/alien/AlienState.js';
import { AnomaliesAlienPlugin } from '@/engine/alien/plugins/AnomaliesAlienPlugin.js';
import { EventLog } from '@/engine/event/EventLog.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

function createPlayer(id: string, seatIndex: number): Player {
  return new Player({
    id,
    name: id,
    color: seatIndex === 0 ? 'red' : 'blue',
    seatIndex,
  });
}

function createGame(options?: {
  players?: Player[];
  earthSector?: number;
  sectorsCount?: number;
  includeSolarSystem?: boolean;
  includeEarthSpace?: boolean;
  seed?: string;
}) {
  const alienState = AlienState.createFromHiddenAliens([EAlienType.ANOMALIES]);
  const board = alienState.boards[0];
  let earthSector = options?.earthSector ?? 0;

  const game = {
    alienState,
    players: options?.players ?? [],
    eventLog: new EventLog(),
    random: new SeededRandom(options?.seed ?? 'anomalies-seed'),
    sectors: Array.from({ length: options?.sectorsCount ?? 8 }, (_, i) => ({
      id: `s${i}`,
    })),
    solarSystem:
      options?.includeSolarSystem === false
        ? undefined
        : {
            getSpacesOnPlanet: (planet: EPlanet) => {
              if (
                planet !== EPlanet.EARTH ||
                options?.includeEarthSpace === false
              ) {
                return [];
              }
              return [{ ringIndex: 3, indexInRing: earthSector * 3 }];
            },
          },
  } as unknown as IGame;

  return {
    game,
    board,
    setEarthSector: (value: number) => {
      earthSector = value;
    },
  };
}

function getTokenSlots(board: ReturnType<typeof createGame>['board']) {
  return board.slots.filter((slot) => slot.slotId.includes('anomaly-token'));
}

function getColumnSlots(board: ReturnType<typeof createGame>['board']) {
  return board.slots.filter((slot) => slot.slotId.includes('anomaly-column'));
}

function getTokenBySector(
  board: ReturnType<typeof createGame>['board'],
  sectorIndex: number,
) {
  return board.slots.find((slot) =>
    slot.slotId.includes(`anomaly-token|${sectorIndex}|`),
  );
}

describe('AnomaliesAlienPlugin', () => {
  it('creates exactly 3 anomaly columns and exactly 3 tokens at Earth / Earth+3 / Earth-3', () => {
    const plugin = new AnomaliesAlienPlugin();
    const { game, board } = createGame({
      earthSector: 7,
      seed: 'anomalies-discover',
    });
    board.discovered = true;

    plugin.onDiscover(game, []);

    const columnSlots = getColumnSlots(board);
    const tokenSlots = getTokenSlots(board);

    expect(columnSlots).toHaveLength(3);
    expect(tokenSlots).toHaveLength(3);

    const sectors = tokenSlots
      .map((slot) => Number(slot.slotId.split('|')[1]))
      .sort();
    expect(sectors).toEqual([2, 4, 7]);
  });

  it('creates unique red/yellow/blue token colors', () => {
    const plugin = new AnomaliesAlienPlugin();
    const { game, board } = createGame({ seed: 'anomalies-colors' });
    board.discovered = true;

    plugin.onDiscover(game, []);

    const tokenColors = getTokenSlots(board).map(
      (slot) => slot.slotId.split('|')[2] as ETrace,
    );
    expect(new Set(tokenColors)).toEqual(
      new Set([ETrace.RED, ETrace.YELLOW, ETrace.BLUE]),
    );
  });

  it('discover is idempotent and does not add duplicate columns/tokens', () => {
    const plugin = new AnomaliesAlienPlugin();
    const { game, board, setEarthSector } = createGame({ earthSector: 0 });
    board.discovered = true;

    plugin.onDiscover(game, []);
    setEarthSector(4);
    plugin.onDiscover(game, []);

    expect(getColumnSlots(board)).toHaveLength(3);
    expect(getTokenSlots(board)).toHaveLength(3);
  });

  it('awards token reward only when Earth sector matches a token', () => {
    const plugin = new AnomaliesAlienPlugin();
    const p1 = createPlayer('p1', 0);
    const { game, board, setEarthSector } = createGame({ players: [p1] });
    board.discovered = true;

    plugin.onDiscover(game, []);

    const tokenAtEarth = getTokenBySector(board, 0);
    expect(tokenAtEarth).toBeDefined();

    const triggeredColor = tokenAtEarth!.slotId.split('|')[2] as ETrace;
    const columnSlot = board.getSlot(
      `alien-${board.alienIndex}-anomaly-column|${triggeredColor}`,
    );
    expect(columnSlot).toBeDefined();
    board.placeTrace(columnSlot!, { playerId: p1.id }, triggeredColor);

    setEarthSector(1);
    const scoreBeforeNoMatch = p1.score;
    plugin.onSolarSystemRotated(game);
    expect(p1.score).toBe(scoreBeforeNoMatch);
    expect(game.eventLog.size()).toBe(0);

    setEarthSector(0);
    plugin.onSolarSystemRotated(game);
    expect(p1.score).toBe(scoreBeforeNoMatch + 2);
    expect(game.eventLog.size()).toBe(1);
  });

  it('does nothing when triggered color column has no marker', () => {
    const plugin = new AnomaliesAlienPlugin();
    const p1 = createPlayer('p1', 0);
    const { game, board } = createGame({ players: [p1] });
    board.discovered = true;

    plugin.onDiscover(game, []);
    const scoreBefore = p1.score;
    plugin.onSolarSystemRotated(game);

    expect(p1.score).toBe(scoreBefore);
    expect(game.eventLog.size()).toBe(0);
  });

  it('does nothing when triggered color column has only neutral markers', () => {
    const plugin = new AnomaliesAlienPlugin();
    const p1 = createPlayer('p1', 0);
    const { game, board } = createGame({ players: [p1] });
    board.discovered = true;

    plugin.onDiscover(game, []);

    const tokenAtEarth = getTokenBySector(board, 0);
    const color = tokenAtEarth!.slotId.split('|')[2] as ETrace;
    const columnSlot = board.getSlot(
      `alien-${board.alienIndex}-anomaly-column|${color}`,
    );
    expect(columnSlot).toBeDefined();
    board.placeTrace(columnSlot!, 'neutral', color);

    const scoreBefore = p1.score;
    plugin.onSolarSystemRotated(game);

    expect(p1.score).toBe(scoreBefore);
    expect(game.eventLog.size()).toBe(0);
  });

  it('latest placed non-neutral marker on anomaly column wins', () => {
    const plugin = new AnomaliesAlienPlugin();
    const p1 = createPlayer('p1', 0);
    const p2 = createPlayer('p2', 1);
    const { game, board } = createGame({ players: [p1, p2] });
    board.discovered = true;

    plugin.onDiscover(game, []);

    const tokenAtEarth = getTokenBySector(board, 0);
    const color = tokenAtEarth!.slotId.split('|')[2] as ETrace;
    const columnSlot = board.getSlot(
      `alien-${board.alienIndex}-anomaly-column|${color}`,
    );
    expect(columnSlot).toBeDefined();

    board.placeTrace(columnSlot!, { playerId: p2.id }, color);
    board.placeTrace(columnSlot!, 'neutral', color);
    board.placeTrace(columnSlot!, { playerId: p1.id }, color);

    const p1Before = p1.score;
    const p2Before = p2.score;
    plugin.onSolarSystemRotated(game);

    expect(p1.score).toBe(p1Before + 2);
    expect(p2.score).toBe(p2Before);
  });

  it('discovery slots do not affect anomaly competition', () => {
    const plugin = new AnomaliesAlienPlugin();
    const p1 = createPlayer('p1', 0);
    const { game, board } = createGame({ players: [p1] });
    board.discovered = true;

    plugin.onDiscover(game, []);

    const tokenAtEarth = getTokenBySector(board, 0);
    const color = tokenAtEarth!.slotId.split('|')[2] as ETrace;

    const discoverySlot = board.getSlot(
      `alien-${board.alienIndex}-discovery-${color}`,
    );
    expect(discoverySlot).toBeDefined();
    board.placeTrace(discoverySlot!, { playerId: p1.id }, color);

    const scoreBefore = p1.score;
    plugin.onSolarSystemRotated(game);

    expect(p1.score).toBe(scoreBefore);
    expect(game.eventLog.size()).toBe(0);
  });

  it('settles consecutive hits on different color tokens independently', () => {
    const plugin = new AnomaliesAlienPlugin();
    const p1 = createPlayer('p1', 0);
    const p2 = createPlayer('p2', 1);
    const { game, board, setEarthSector } = createGame({ players: [p1, p2] });
    board.discovered = true;

    plugin.onDiscover(game, []);

    const tokenAt0 = getTokenBySector(board, 0);
    const tokenAt3 = getTokenBySector(board, 3);
    expect(tokenAt0).toBeDefined();
    expect(tokenAt3).toBeDefined();

    const colorAt0 = tokenAt0!.slotId.split('|')[2] as ETrace;
    const colorAt3 = tokenAt3!.slotId.split('|')[2] as ETrace;
    expect(colorAt0).not.toBe(colorAt3);

    const column0 = board.getSlot(
      `alien-${board.alienIndex}-anomaly-column|${colorAt0}`,
    );
    const column3 = board.getSlot(
      `alien-${board.alienIndex}-anomaly-column|${colorAt3}`,
    );

    board.placeTrace(column0!, { playerId: p1.id }, colorAt0);
    board.placeTrace(column3!, { playerId: p2.id }, colorAt3);

    const p1Before = p1.score;
    const p2Before = p2.score;

    setEarthSector(0);
    plugin.onSolarSystemRotated(game);
    setEarthSector(3);
    plugin.onSolarSystemRotated(game);

    expect(p1.score).toBe(p1Before + 2);
    expect(p2.score).toBe(p2Before + 2);
    expect(game.eventLog.size()).toBe(2);
  });

  it('no-op on rotate when board is not discovered', () => {
    const plugin = new AnomaliesAlienPlugin();
    const p1 = createPlayer('p1', 0);
    const { game, board } = createGame({ players: [p1] });
    board.discovered = false;

    const scoreBefore = p1.score;
    plugin.onSolarSystemRotated(game);
    expect(p1.score).toBe(scoreBefore);
    expect(game.eventLog.size()).toBe(0);
  });

  it('no-op when solarSystem or Earth space is missing', () => {
    const plugin = new AnomaliesAlienPlugin();
    const p1 = createPlayer('p1', 0);

    const withoutSolarSystem = createGame({
      players: [p1],
      includeSolarSystem: false,
    });
    withoutSolarSystem.board.discovered = true;
    expect(() =>
      plugin.onSolarSystemRotated(withoutSolarSystem.game),
    ).not.toThrow();
    expect(withoutSolarSystem.game.eventLog.size()).toBe(0);

    const withoutEarth = createGame({
      players: [p1],
      includeEarthSpace: false,
    });
    withoutEarth.board.discovered = true;
    expect(() => plugin.onSolarSystemRotated(withoutEarth.game)).not.toThrow();
    expect(withoutEarth.game.eventLog.size()).toBe(0);
  });

  it('supports extensible rewards and emits color/sectorIndex payload', () => {
    const plugin = new AnomaliesAlienPlugin();
    const p1 = createPlayer('p1', 0);
    const { game, board } = createGame({ players: [p1] });
    board.discovered = true;

    plugin.onDiscover(game, []);

    const tokenAtEarth = getTokenBySector(board, 0);
    expect(tokenAtEarth).toBeDefined();

    tokenAtEarth!.rewards = [
      { type: 'VP', amount: 3 },
      { type: 'PUBLICITY', amount: 1 },
    ];

    const triggeredColor = tokenAtEarth!.slotId.split('|')[2] as ETrace;
    const columnSlot = board.getSlot(
      `alien-${board.alienIndex}-anomaly-column|${triggeredColor}`,
    );
    expect(columnSlot).toBeDefined();

    board.placeTrace(columnSlot!, { playerId: p1.id }, triggeredColor);

    const scoreBefore = p1.score;
    const publicityBefore = p1.resources.publicity;
    plugin.onSolarSystemRotated(game);

    expect(p1.score).toBe(scoreBefore + 3);
    expect(p1.resources.publicity).toBe(publicityBefore + 1);

    const event = game.eventLog.recent(1)[0];
    expect(event?.type).toBe('ACTION');
    if (event?.type === 'ACTION') {
      expect(event.action).toBe('ANOMALY_TRIGGERED');
      expect(event.details).toMatchObject({
        color: triggeredColor,
        sectorIndex: 0,
      });
    }
  });
});
