import { EAlienType, EPlanet, ETrace } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import {
  isAnomaliesAlienBoard,
  type TSlotReward,
} from '@/engine/alien/AlienBoard.js';
import { AlienRegistry } from '@/engine/alien/AlienRegistry.js';
import { AlienState } from '@/engine/alien/AlienState.js';
import { AnomaliesAlienPlugin } from '@/engine/alien/plugins/AnomaliesAlienPlugin.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
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
  if (!isAnomaliesAlienBoard(board)) {
    throw new Error('expected anomalies board');
  }
  let earthSector = options?.earthSector ?? 0;
  const alienTokens: Array<{
    tokenId: string;
    alienType: EAlienType;
    sectorIndex: number;
    traceColor: ETrace.PINK | ETrace.YELLOW | ETrace.BLUE;
    rewards: TSlotReward[];
  }> = [];

  const game = {
    alienState,
    players: options?.players ?? [],
    eventLog: new EventLog(),
    random: new SeededRandom(options?.seed ?? 'anomalies-seed'),
    mainDeck: new Deck<string>(['55', '56', '57', '58'], []),
    deferredActions: new DeferredActionsQueue(),
    lockCurrentTurn: () => undefined,
    sectors: Array.from({ length: options?.sectorsCount ?? 8 }, (_, i) => ({
      id: `s${i}`,
    })),
    solarSystem:
      options?.includeSolarSystem === false
        ? undefined
        : {
            alienTokens,
            addAlienToken: (init: {
              tokenId: string;
              alienType: EAlienType;
              sectorIndex: number;
              traceColor: ETrace.PINK | ETrace.YELLOW | ETrace.BLUE;
              rewards?: TSlotReward[];
            }) => {
              const token = {
                ...init,
                rewards: [...(init.rewards ?? [])],
              };
              alienTokens.push(token);
              return token;
            },
            getAlienTokensByType: (alienType: EAlienType) =>
              alienTokens.filter((token) => token.alienType === alienType),
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

function getTokenSlots(game: ReturnType<typeof createGame>['game']) {
  return game.solarSystem?.getAlienTokensByType(EAlienType.ANOMALIES) ?? [];
}

function getColumnSlots(board: ReturnType<typeof createGame>['board']) {
  return board.slots.filter((slot) => slot.slotId.includes('anomaly-column'));
}

function getColumnSlotByTier(
  board: ReturnType<typeof createGame>['board'],
  color: ETrace,
  tier: number,
) {
  return board.slots.find(
    (slot) =>
      slot.slotId === `alien-${board.alienIndex}-anomaly-column|${color}|${tier}`,
  );
}


function getTokenBySector(
  game: ReturnType<typeof createGame>['game'],
  sectorIndex: number,
) {
  return getTokenSlots(game).find((token) => token.sectorIndex === sectorIndex);
}

function getTokenByColor(
  game: ReturnType<typeof createGame>['game'],
  color: ETrace,
) {
  return getTokenSlots(game).find((token) => token.traceColor === color);
}

function expectRewardInOptions(
  rewards: TSlotReward[],
  options: TSlotReward[][],
): void {
  expect(options).toContainEqual(rewards);
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
    const tokenSlots = getTokenSlots(game);

    // Each color exposes 5 tiers (4 single-cap + 1 overflow), so 3 colors
    // produce 15 total column slots.
    expect(columnSlots).toHaveLength(15);
    expect(tokenSlots).toHaveLength(3);

    const sectors = tokenSlots.map((token) => token.sectorIndex).sort();
    expect(sectors).toEqual([2, 4, 7]);
  });

  it('creates unique red/yellow/blue token colors', () => {
    const plugin = new AnomaliesAlienPlugin();
    const { game, board } = createGame({ seed: 'anomalies-colors' });
    board.discovered = true;

    plugin.onDiscover(game, []);

    const tokenColors = getTokenSlots(game).map((token) => token.traceColor);
    expect(new Set(tokenColors)).toEqual(
      new Set([ETrace.PINK, ETrace.YELLOW, ETrace.BLUE]),
    );
  });

  it('assigns one color-specific bonus side to each anomaly token', () => {
    const plugin = new AnomaliesAlienPlugin();
    const { game, board } = createGame({ seed: 'anomalies-token-rewards' });
    board.discovered = true;

    plugin.onDiscover(game, []);

    expectRewardInOptions(getTokenByColor(game, ETrace.PINK)!.rewards, [
      [{ type: 'CREDIT', amount: 1 }],
      [{ type: 'VP', amount: 4 }],
    ]);
    expectRewardInOptions(getTokenByColor(game, ETrace.YELLOW)!.rewards, [
      [{ type: 'CARD', amount: 1 }],
      [{ type: 'PUBLICITY', amount: 2 }],
    ]);
    expectRewardInOptions(getTokenByColor(game, ETrace.BLUE)!.rewards, [
      [{ type: 'DATA', amount: 1 }],
      [{ type: 'ENERGY', amount: 1 }],
    ]);
  });

  it('discover is idempotent and does not add duplicate columns/tokens', () => {
    const plugin = new AnomaliesAlienPlugin();
    const { game, board, setEarthSector } = createGame({ earthSector: 0 });
    board.discovered = true;

    plugin.onDiscover(game, []);
    setEarthSector(4);
    plugin.onDiscover(game, []);

    expect(getColumnSlots(board)).toHaveLength(15);
    expect(getTokenSlots(game)).toHaveLength(3);
  });

  it('awards token reward only when Earth sector matches a token', () => {
    const plugin = new AnomaliesAlienPlugin();
    const p1 = createPlayer('p1', 0);
    const { game, board, setEarthSector } = createGame({ players: [p1] });
    board.discovered = true;

    plugin.onDiscover(game, []);

    const tokenAtEarth = getTokenBySector(game, 0);
    expect(tokenAtEarth).toBeDefined();
    tokenAtEarth!.rewards = [{ type: 'VP', amount: 2 }];

    const triggeredColor = tokenAtEarth!.traceColor;
    const columnSlot = getColumnSlotByTier(board, triggeredColor, 1);
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

    const tokenAtEarth = getTokenBySector(game, 0);
    const color = tokenAtEarth!.traceColor;
    tokenAtEarth!.rewards = [{ type: 'VP', amount: 2 }];
    const columnSlot = getColumnSlotByTier(board, color, 1);
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

    const tokenAtEarth = getTokenBySector(game, 0);
    const color = tokenAtEarth!.traceColor;
    tokenAtEarth!.rewards = [{ type: 'VP', amount: 2 }];

    // Highest-tier marker wins. Place p2 at the bottom tier and a neutral
    // above them; p1 takes a higher tier and should claim the reward.
    const tier1 = getColumnSlotByTier(board, color, 1);
    const tier2 = getColumnSlotByTier(board, color, 2);
    const tier3 = getColumnSlotByTier(board, color, 3);
    expect(tier1 && tier2 && tier3).toBeDefined();

    board.placeTrace(tier1!, { playerId: p2.id }, color);
    board.placeTrace(tier2!, 'neutral', color);
    board.placeTrace(tier3!, { playerId: p1.id }, color);

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

    const tokenAtEarth = getTokenBySector(game, 0);
    const color = tokenAtEarth!.traceColor;

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

    const tokenAt0 = getTokenBySector(game, 0);
    const tokenAt3 = getTokenBySector(game, 3);
    expect(tokenAt0).toBeDefined();
    expect(tokenAt3).toBeDefined();

    const colorAt0 = tokenAt0!.traceColor;
    const colorAt3 = tokenAt3!.traceColor;
    tokenAt0!.rewards = [{ type: 'VP', amount: 2 }];
    tokenAt3!.rewards = [{ type: 'VP', amount: 2 }];
    expect(colorAt0).not.toBe(colorAt3);

    const column0 = getColumnSlotByTier(board, colorAt0, 1);
    const column3 = getColumnSlotByTier(board, colorAt3, 1);

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

    const tokenAtEarth = getTokenBySector(game, 0);
    expect(tokenAtEarth).toBeDefined();

    tokenAtEarth!.rewards = [
      { type: 'VP', amount: 3 },
      { type: 'PUBLICITY', amount: 1 },
    ];

    const triggeredColor = tokenAtEarth!.traceColor;
    const columnSlot = getColumnSlotByTier(board, triggeredColor, 1);
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

  it('executes all anomaly token reward resource types', () => {
    const plugin = new AnomaliesAlienPlugin();
    const p1 = createPlayer('p1', 0);
    const { game, board } = createGame({ players: [p1] });
    board.discovered = true;

    plugin.onDiscover(game, []);

    const tokenAtEarth = getTokenBySector(game, 0);
    expect(tokenAtEarth).toBeDefined();
    tokenAtEarth!.rewards = [
      { type: 'CREDIT', amount: 1 },
      { type: 'DATA', amount: 1 },
      { type: 'ENERGY', amount: 1 },
      { type: 'CARD', amount: 1 },
      { type: 'PUBLICITY', amount: 2 },
      { type: 'VP', amount: 4 },
    ];

    const triggeredColor = tokenAtEarth!.traceColor;
    const columnSlot = getColumnSlotByTier(board, triggeredColor, 1);
    expect(columnSlot).toBeDefined();

    board.placeTrace(columnSlot!, { playerId: p1.id }, triggeredColor);

    const before = {
      credits: p1.resources.credits,
      data: p1.resources.data,
      energy: p1.resources.energy,
      publicity: p1.resources.publicity,
      score: p1.score,
      handSize: p1.hand.length,
    };
    plugin.onSolarSystemRotated(game);

    expect(p1.resources.credits).toBe(before.credits + 1);
    expect(p1.resources.data).toBe(before.data + 1);
    expect(p1.resources.energy).toBe(before.energy + 1);
    expect(p1.resources.publicity).toBe(before.publicity + 2);
    expect(p1.score).toBe(before.score + 4);
    expect(p1.hand).toHaveLength(before.handSize + 1);
  });

  it('per-tier slots in an anomaly column carry the matching ladder rewards', () => {
    const plugin = new AnomaliesAlienPlugin();
    AlienRegistry.register(plugin);
    const p1 = createPlayer('p1', 0);
    const { game, board } = createGame({ players: [p1] });
    board.discovered = true;

    plugin.onDiscover(game, []);
    // The DRAW_ALIEN_CARD reward path produces a face-up vs deck choice only
    // when both sources are populated. Mirror what `discoverAlien` does in
    // production: seed the deck and reveal a face-up card.
    board.initializeAlienDeck(['ANOM.1', 'ANOM.2', 'ANOM.3', 'ANOM.4']);
    board.revealNextFaceUpAlienCard(game.random);

    // Each of the 5 tiers per color carries the matching ladder rewards.
    // Players choose any tier — the engine no longer auto-fills bottom-up.
    const tier1 = getColumnSlotByTier(board, ETrace.PINK, 1);
    const tier2 = getColumnSlotByTier(board, ETrace.PINK, 2);
    const tier3 = getColumnSlotByTier(board, ETrace.PINK, 3);
    const tier4 = getColumnSlotByTier(board, ETrace.PINK, 4);
    const overflow = getColumnSlotByTier(board, ETrace.PINK, 5);
    expect(tier1?.maxOccupants).toBe(1);
    expect(tier4?.maxOccupants).toBe(1);
    expect(overflow?.maxOccupants).toBe(-1);
    expect(tier1?.rewards).toEqual([
      { type: 'VP', amount: 4 },
      { type: 'CUSTOM', effectId: 'DRAW_ALIEN_CARD' },
    ]);
    expect(tier3?.rewards).toEqual([
      { type: 'VP', amount: 2 },
      { type: 'PUBLICITY', amount: 1 },
    ]);
    expect(overflow?.rewards).toEqual([{ type: 'VP', amount: 2 }]);

    const scoreBefore = p1.score;
    const publicityBefore = p1.resources.publicity;
    let alienCardChoiceCount = 0;
    const placeAt = (slotId: string): void => {
      const result = game.alienState.applyTraceToSlot(
        p1,
        game,
        slotId,
        ETrace.PINK,
      );
      if (result !== false && result !== true && result !== undefined) {
        const model = result.toModel();
        if (model.type === EPlayerInputType.OPTION) {
          (
            result as unknown as {
              process: (response: {
                type: EPlayerInputType.OPTION;
                optionId: string;
              }) => unknown;
            }
          ).process({
            type: EPlayerInputType.OPTION,
            optionId: 'draw-random',
          });
          alienCardChoiceCount += 1;
        }
      }
    };

    // Place one trace at each single-cap tier, then two more in the overflow.
    placeAt(tier1!.slotId);
    placeAt(tier2!.slotId);
    placeAt(tier3!.slotId);
    placeAt(tier4!.slotId);
    placeAt(overflow!.slotId);
    placeAt(overflow!.slotId);

    expect(p1.score).toBe(scoreBefore + 4 + 2 + 2 + 3 + 2 + 2);
    expect(p1.resources.publicity).toBe(publicityBefore + 1);
    expect(alienCardChoiceCount).toBe(2);
    expect(tier1!.occupants).toHaveLength(1);
    expect(tier4!.occupants).toHaveLength(1);
    expect(overflow!.occupants).toHaveLength(2);
  });

  // Regression: `AlienState.executeRewards` previously short-circuited
  // with `return` on the first CUSTOM:DRAW_ALIEN_CARD, dropping any
  // simple rewards listed AFTER it. Today's ladder lists VP first and
  // the draw second so the data was safe; a future re-order would
  // silently lose VP without this test.
  it('applies simple rewards listed AFTER a CUSTOM:DRAW_ALIEN_CARD', () => {
    const plugin = new AnomaliesAlienPlugin();
    AlienRegistry.register(plugin);
    const p1 = createPlayer('p1', 0);
    const { game, board } = createGame({ players: [p1] });
    board.discovered = true;
    plugin.onDiscover(game, []);

    // Seed the alien deck so the DRAW_ALIEN_CARD path produces a real
    // face-up vs deck PlayerInput (both options must be available for
    // the CUSTOM to materialize as a SelectOption).
    board.alienDeckDrawPile = ['ET.1', 'ET.2'];
    board.faceUpAlienCardId = 'ET.3';

    // Pick any column slot and rewrite its rewards in a deliberately-
    // hostile order: CUSTOM:DRAW_ALIEN_CARD FIRST, with simple
    // rewards (VP, publicity) AFTER.
    const slot = getColumnSlotByTier(board, ETrace.PINK, 1);
    expect(slot).toBeDefined();
    slot!.rewards = [
      { type: 'CUSTOM', effectId: 'DRAW_ALIEN_CARD' },
      { type: 'VP', amount: 5 },
      { type: 'PUBLICITY', amount: 2 },
    ];

    const scoreBefore = p1.score;
    const publicityBefore = p1.resources.publicity;

    const placedInput = game.alienState.applyTraceToSlot(
      p1,
      game,
      slot!.slotId,
      slot!.traceColor,
    );

    // Simple rewards still applied even though the CUSTOM was listed
    // first; the CUSTOM became a PlayerInput (the alien-card prompt),
    // not the boolean `true` that `applyTraceToSlot` returns when
    // there's no follow-up input.
    expect(p1.score).toBe(scoreBefore + 5);
    expect(p1.resources.publicity).toBe(publicityBefore + 2);
    expect(typeof placedInput).toBe('object');
  });

  // Regression: `onSolarSystemRotated` previously paid the column
  // leader via `executeSimpleSlotRewards`, which silently skipped
  // CUSTOM rewards. Today's `ANOMALY_TOKEN_REWARD_OPTIONS` is all
  // simple, but if a future option grows a CUSTOM reward we want it to
  // surface as a PlayerInput on the deferred queue rather than vanish.
  it('routes CUSTOM token rewards through the deferred queue (no silent drop)', () => {
    const plugin = new AnomaliesAlienPlugin();
    AlienRegistry.register(plugin);
    const p1 = createPlayer('p1', 0);
    const { game, board } = createGame({ players: [p1] });
    board.discovered = true;
    plugin.onDiscover(game, []);

    // Seed both the deck and a face-up card so DRAW_ALIEN_CARD produces
    // a face-up vs deck SelectOption (a real PlayerInput).
    board.alienDeckDrawPile = ['ET.1', 'ET.2'];
    board.faceUpAlienCardId = 'ET.3';

    const tokenAtEarth = getTokenBySector(game, 0);
    expect(tokenAtEarth).toBeDefined();
    tokenAtEarth!.rewards = [
      { type: 'VP', amount: 1 },
      { type: 'CUSTOM', effectId: 'DRAW_ALIEN_CARD' },
    ];

    const triggeredColor = tokenAtEarth!.traceColor;
    const columnSlot = getColumnSlotByTier(board, triggeredColor, 1);
    board.placeTrace(columnSlot!, { playerId: p1.id }, triggeredColor);

    expect(game.deferredActions.isEmpty()).toBe(true);
    const scoreBefore = p1.score;
    plugin.onSolarSystemRotated(game);

    // Simple VP applied inline; the draw-alien-card prompt was pushed
    // onto the deferred queue (not dropped).
    expect(p1.score).toBe(scoreBefore + 1);
    expect(game.deferredActions.isEmpty()).toBe(false);
  });
});
