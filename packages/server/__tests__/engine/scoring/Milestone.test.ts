import { EResource } from '@seti/common/types/element';
import { EFreeAction, EPhase, ETrace } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type ISelectGoldTileInputModel,
} from '@seti/common/types/protocol/playerInput';
import { AlienRegistry } from '@/engine/alien/AlienRegistry.js';
import { DummyAlienPlugin } from '@/engine/alien/plugins/DummyAlienPlugin.js';
import { ResolveDiscovery } from '@/engine/deferred/ResolveDiscovery.js';
import type { TGameEvent } from '@/engine/event/GameEvent.js';
import { Game } from '@/engine/Game.js';
import type { IGamePlayerIdentity } from '@/engine/IGame.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { GameError } from '@/shared/errors/GameError.js';
import { skipSetupTucks } from '../../helpers/TestGameBuilder.js';
import { placeTraceForTestSetup } from '../../helpers/traceTestUtils.js';

const BASE_PLAYERS: readonly IGamePlayerIdentity[] = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
  { id: 'p3', name: 'Cathy', color: 'green', seatIndex: 2 },
  { id: 'p4', name: 'Dylan', color: 'yellow', seatIndex: 3 },
] as const;

function createGame(playerCount: 2 | 3 | 4, seed: string): Game {
  const game = Game.create(
    BASE_PLAYERS.slice(0, playerCount),
    { playerCount },
    seed,
  );
  skipSetupTucks(game);
  return game;
}

function drainAllMilestoneInputs(game: Game, startPlayer: IPlayer): void {
  let input = game.milestoneState.checkAndQueue(game, startPlayer);
  while (input !== undefined) {
    const model = input.toModel();
    if (model.type !== EPlayerInputType.GOLD_TILE) {
      throw new Error(`Unexpected input type ${model.type}`);
    }
    const tileId = model.options[0];
    input = input.process({
      type: EPlayerInputType.GOLD_TILE,
      tileId,
    });
  }
}

function actionEvents(game: Game): Extract<TGameEvent, { type: 'ACTION' }>[] {
  return game.eventLog
    .toArray()
    .filter(
      (e): e is Extract<TGameEvent, { type: 'ACTION' }> => e.type === 'ACTION',
    );
}

describe('MilestoneState (Phase 7)', () => {
  beforeEach(() => {
    AlienRegistry.clear();
    AlienRegistry.register(new DummyAlienPlugin());
  });

  afterEach(() => {
    AlienRegistry.clear();
  });

  describe('7.1 Gold Milestones', () => {
    it('7.1.1 [集成] reaching 25 VP queues gold tile selection and logs MILESTONE_GOLD_RESOLVED', () => {
      const game = createGame(2, 'm7-gold-1');
      const p1 = game.players[0];
      p1.score = 25;

      const input = game.milestoneState.checkAndQueue(game, p1);
      expect(input?.toModel().type).toBe(EPlayerInputType.GOLD_TILE);

      const tileId = (input!.toModel() as ISelectGoldTileInputModel).options[0];
      input!.process({ type: EPlayerInputType.GOLD_TILE, tileId });

      const goldResolved = actionEvents(game).filter(
        (e) => e.action === 'MILESTONE_GOLD_RESOLVED',
      );
      expect(goldResolved).toHaveLength(1);
      expect(goldResolved[0].details?.threshold).toBe(25);
      expect(goldResolved[0].playerId).toBe('p1');
    });

    it('7.1.2 [集成] reaching 50 VP still triggers after 25 was resolved', () => {
      const game = createGame(2, 'm7-gold-2');
      const p1 = game.players[0];
      p1.score = 50;

      let input = game.milestoneState.checkAndQueue(game, p1);
      const firstTile = (input!.toModel() as ISelectGoldTileInputModel)
        .options[0];
      input = input!.process({
        type: EPlayerInputType.GOLD_TILE,
        tileId: firstTile,
      });
      expect(input?.toModel().type).toBe(EPlayerInputType.GOLD_TILE);
      const secondTile = (input!.toModel() as ISelectGoldTileInputModel)
        .options[0];
      input!.process({ type: EPlayerInputType.GOLD_TILE, tileId: secondTile });

      const thresholds = actionEvents(game)
        .filter((e) => e.action === 'MILESTONE_GOLD_RESOLVED')
        .map((e) => e.details?.threshold);
      expect(thresholds).toEqual([25, 50]);
    });

    it('7.1.3 [集成] reaching 70 VP triggers the third gold milestone', () => {
      const game = createGame(2, 'm7-gold-3');
      const p1 = game.players[0];
      p1.score = 70;

      drainAllMilestoneInputs(game, p1);

      const thresholds = actionEvents(game)
        .filter((e) => e.action === 'MILESTONE_GOLD_RESOLVED')
        .map((e) => e.details?.threshold);
      expect(thresholds).toEqual([25, 50, 70]);
    });

    it('7.1.4 [集成] a player cannot mark the same gold tile twice across milestones', () => {
      const game = createGame(2, 'm7-gold-4');
      const p1 = game.players[0];
      p1.score = 50;

      let input = game.milestoneState.checkAndQueue(game, p1);
      const firstPick = 'tech' as const;
      expect((input!.toModel() as ISelectGoldTileInputModel).options).toContain(
        firstPick,
      );
      input = input!.process({
        type: EPlayerInputType.GOLD_TILE,
        tileId: firstPick,
      });
      expect(
        (input!.toModel() as ISelectGoldTileInputModel).options,
      ).not.toContain(firstPick);
      const secondPick = (input!.toModel() as ISelectGoldTileInputModel)
        .options[0];
      input!.process({ type: EPlayerInputType.GOLD_TILE, tileId: secondPick });
    });

    it('7.1.5 [集成] first claim on a tile takes highest slot value, second player takes next', () => {
      const game = createGame(2, 'm7-gold-5');
      const [p1] = game.players;
      game.players[1].score = 25;
      p1.score = 25;

      let input = game.milestoneState.checkAndQueue(game, p1);
      expect(input!.player.id).toBe('p1');
      let next = input!.process({
        type: EPlayerInputType.GOLD_TILE,
        tileId: 'tech',
      });
      expect(next!.player.id).toBe('p2');
      next!.process({ type: EPlayerInputType.GOLD_TILE, tileId: 'tech' });

      const techTile = game.goldScoringTiles.find((t) => t.id === 'tech')!;
      expect(techTile.claims.map((c) => c.value)).toEqual([5, 4]);
    });

    it('7.1.6 [集成] crossing 100+ VP does not re-trigger gold milestones', () => {
      const game = createGame(2, 'm7-gold-6');
      const p1 = game.players[0];
      p1.score = 125;

      drainAllMilestoneInputs(game, p1);
      const afterFirstPass = actionEvents(game).filter(
        (e) => e.action === 'MILESTONE_GOLD_RESOLVED',
      ).length;

      const second = game.milestoneState.checkAndQueue(game, p1);
      expect(second).toBeUndefined();
      const afterSecond = actionEvents(game).filter(
        (e) => e.action === 'MILESTONE_GOLD_RESOLVED',
      ).length;
      expect(afterSecond).toBe(afterFirstPass);
    });
  });

  describe('7.2 Neutral Milestones', () => {
    it('7.2.1 [集成] crossing 20/30 VP places neutral markers when playing below 4p', () => {
      const game = createGame(2, 'm7-neu-1');
      const p1 = game.players[0];
      p1.score = 21;

      game.milestoneState.checkAndQueue(game, p1);

      expect(
        actionEvents(game).some(
          (e) => e.action === 'MILESTONE_NEUTRAL_RESOLVED',
        ),
      ).toBe(true);
      expect(game.milestoneState.getNeutralDiscoveryMarkersUsed()).toBe(1);
    });

    it('7.2.2 [集成] neutral marker uses the leftmost empty discovery slot among six', () => {
      const game = createGame(2, 'm7-neu-2');
      const p1 = game.players[0];
      p1.score = 22;

      game.milestoneState.checkAndQueue(game, p1);

      const neutral = actionEvents(game).find(
        (e) => e.action === 'MILESTONE_NEUTRAL_RESOLVED',
      );
      expect(neutral?.details?.alienIndex).toBe(0);
      expect(neutral?.details?.traceColor).toBe(ETrace.RED);
    });

    it('7.2.3 [集成] neutral placement can complete an alien and allow discovery resolution', () => {
      const game = createGame(2, 'm7-neu-3');
      const p1 = game.players[0];

      placeTraceForTestSetup(game.alienState, p1, game, ETrace.RED, 0);
      placeTraceForTestSetup(game.alienState, p1, game, ETrace.YELLOW, 0);
      placeTraceForTestSetup(game.alienState, p1, game, ETrace.RED, 1);
      placeTraceForTestSetup(game.alienState, p1, game, ETrace.YELLOW, 1);

      p1.score = 22;
      expect(game.alienState.getNewlyDiscoverableAliens()).toHaveLength(0);

      game.milestoneState.checkAndQueue(game, p1);

      expect(game.alienState.getNewlyDiscoverableAliens()).toHaveLength(1);
    });

    it('7.2.4 [集成] when all six discovery spaces are full, neutral milestone has no effect', () => {
      const game = createGame(2, 'm7-neu-4');
      const p1 = game.players[0];

      for (const color of [ETrace.RED, ETrace.YELLOW, ETrace.BLUE]) {
        placeTraceForTestSetup(game.alienState, p1, game, color, 0);
      }
      for (const color of [ETrace.RED, ETrace.YELLOW, ETrace.BLUE]) {
        placeTraceForTestSetup(game.alienState, p1, game, color, 1);
      }

      expect(game.alienState.hasEmptyDiscoverySlot()).toBe(false);
      p1.score = 24;

      const before = game.eventLog.size();
      game.milestoneState.checkAndQueue(game, p1);

      expect(
        actionEvents(game).some(
          (e) => e.action === 'MILESTONE_NEUTRAL_RESOLVED',
        ),
      ).toBe(false);
      expect(game.eventLog.size()).toBe(before);
      expect(game.milestoneState.getNeutralDiscoveryMarkersUsed()).toBe(0);
    });

    it('7.2.5 [集成] 4-player game ignores neutral milestones on the score track', () => {
      const game = createGame(4, 'm7-neu-5');
      expect(game.neutralMilestones).toEqual([]);

      const p1 = game.players[0];
      p1.score = 30;

      drainAllMilestoneInputs(game, p1);

      expect(
        actionEvents(game).some(
          (e) => e.action === 'MILESTONE_NEUTRAL_RESOLVED',
        ),
      ).toBe(false);
    });

    it('7.2.6 [集成] FAQ: one neutral marker per milestone resolution (not two at once)', () => {
      const game = createGame(2, 'm7-neu-6');
      const p1 = game.players[0];
      p1.score = 22;

      const before = game.milestoneState.getNeutralDiscoveryMarkersUsed();
      game.milestoneState.checkAndQueue(game, p1);
      const after = game.milestoneState.getNeutralDiscoveryMarkersUsed();

      expect(after - before).toBe(1);
    });

    it('7.2.7 [集成] FAQ: prefers the left alien board when searching for an empty slot', () => {
      const game = createGame(2, 'm7-neu-7');
      const p1 = game.players[0];

      placeTraceForTestSetup(game.alienState, p1, game, ETrace.YELLOW, 1);
      placeTraceForTestSetup(game.alienState, p1, game, ETrace.BLUE, 1);

      p1.score = 22;
      game.milestoneState.checkAndQueue(game, p1);

      const neutral = actionEvents(game).find(
        (e) => e.action === 'MILESTONE_NEUTRAL_RESOLVED',
      );
      expect(neutral?.details?.alienIndex).toBe(0);
      expect(neutral?.details?.traceColor).toBe(ETrace.RED);
    });
  });

  describe('7.3 Multiple milestones order', () => {
    it('7.3.1 [集成] 3p: starting from current player, gold resolves clockwise then neutral last', () => {
      const game = createGame(3, 'm7-ord-1');
      const [p1, p2, p3] = game.players;

      p1.score = 25;
      p2.score = 25;
      p3.score = 25;

      const order: string[] = [];
      let input = game.milestoneState.checkAndQueue(game, p2);
      while (input !== undefined) {
        order.push(input.player.id);
        const tileId = (input.toModel() as ISelectGoldTileInputModel)
          .options[0];
        input = input.process({ type: EPlayerInputType.GOLD_TILE, tileId });
      }

      expect(order).toEqual(['p2', 'p3', 'p1']);

      p1.score = 22;
      p2.score = 22;
      p3.score = 22;

      const game2 = createGame(3, 'm7-ord-1b');
      const a = game2.players[0];
      const b = game2.players[1];
      const c = game2.players[2];
      a.score = 28;
      b.score = 28;
      c.score = 28;

      const goldFirst: string[] = [];
      let chain = game2.milestoneState.checkAndQueue(game2, b);
      while (
        chain !== undefined &&
        chain.toModel().type === EPlayerInputType.GOLD_TILE
      ) {
        goldFirst.push(chain.player.id);
        const tid = (chain.toModel() as ISelectGoldTileInputModel).options[0];
        chain = chain.process({
          type: EPlayerInputType.GOLD_TILE,
          tileId: tid,
        });
      }
      expect(goldFirst).toEqual([b.id, c.id, a.id]);

      expect(
        actionEvents(game2).some(
          (e) => e.action === 'MILESTONE_NEUTRAL_RESOLVED',
        ),
      ).toBe(true);
      const lastNeutralIdx = actionEvents(game2)
        .map((e) => e.action)
        .lastIndexOf('MILESTONE_NEUTRAL_RESOLVED');
      const lastGoldIdx = actionEvents(game2)
        .map((e) => e.action)
        .lastIndexOf('MILESTONE_GOLD_RESOLVED');
      expect(lastNeutralIdx).toBeGreaterThan(lastGoldIdx);
    });

    it('7.3.2 [集成] 4p: no neutral milestones in the queue', () => {
      const game = createGame(4, 'm7-ord-2');
      game.players.forEach((p) => {
        p.score = 25;
      });

      drainAllMilestoneInputs(game, game.players[0]);

      expect(
        actionEvents(game).some(
          (e) => e.action === 'MILESTONE_NEUTRAL_RESOLVED',
        ),
      ).toBe(false);
    });

    it('7.3.3 [集成] milestones run in BETWEEN_TURNS — free actions are rejected in that phase', () => {
      const game = createGame(2, 'm7-ord-3');
      game.phase = EPhase.BETWEEN_TURNS;

      expect(() =>
        game.processFreeAction(game.activePlayer.id, {
          type: EFreeAction.EXCHANGE_RESOURCES,
          from: EResource.CREDIT,
          to: EResource.ENERGY,
        }),
      ).toThrow(GameError);

      try {
        game.processFreeAction(game.activePlayer.id, {
          type: EFreeAction.EXCHANGE_RESOURCES,
          from: EResource.CREDIT,
          to: EResource.ENERGY,
        });
      } catch (error) {
        expect((error as GameError).code).toBe(EErrorCode.INVALID_PHASE);
      }
    });

    it('7.3.4 [集成] ResolveDiscovery runs after neutral milestones in the between-turn pipeline', () => {
      const game = createGame(2, 'm7-ord-4');
      const p1 = game.players[0];

      placeTraceForTestSetup(game.alienState, p1, game, ETrace.RED, 0);
      placeTraceForTestSetup(game.alienState, p1, game, ETrace.YELLOW, 0);
      placeTraceForTestSetup(game.alienState, p1, game, ETrace.RED, 1);
      placeTraceForTestSetup(game.alienState, p1, game, ETrace.YELLOW, 1);

      p1.score = 24;
      game.milestoneState.checkAndQueue(game, p1);

      const eventsBeforeDiscovery = actionEvents(game).length;
      new ResolveDiscovery(p1).execute(game);

      const actions = actionEvents(game);
      const neutralIdx = actions.findIndex(
        (e) => e.action === 'MILESTONE_NEUTRAL_RESOLVED',
      );
      const discoveredIdx = actions.findIndex(
        (e) => e.action === 'ALIEN_DISCOVERED',
      );
      expect(neutralIdx).toBeGreaterThanOrEqual(0);
      expect(discoveredIdx).toBeGreaterThan(neutralIdx);
      expect(discoveredIdx).toBeGreaterThanOrEqual(eventsBeforeDiscovery);
    });
  });
});
