import { EResource } from '@seti/common/types/element';
import { EFreeAction, EMainAction } from '@seti/common/types/protocol/enums';
import { EGameEventType } from '@seti/common/types/protocol/events';
import { Deck } from '@/engine/deck/Deck.js';
import { Game } from '@/engine/Game.js';
import { RivalTurnController } from '@/engine/solo/RivalTurnController.js';
import { replayGameEvents } from '@/persistence/replay/GameEventReplay.js';
import { deserializeGame } from '@/persistence/serializer/GameDeserializer.js';
import { serializeGame } from '@/persistence/serializer/GameSerializer.js';
import { resolveSetupTucks } from '../../helpers/TestGameBuilder.js';

function createReplayTestGame(): Game {
  const game = Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
    ],
    { playerCount: 2 },
    'event-replay-test-seed',
    'event-replay-test',
  );
  resolveSetupTucks(game);
  return game;
}

function createReplaySoloRivalGame(): Game {
  const game = Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      {
        id: 'rival:replay',
        name: 'Rival Institution',
        color: 'blue',
        seatIndex: 1,
      },
    ],
    {
      playerCount: 2,
      isSoloMode: true,
      soloDifficulty: 3,
    },
    'event-replay-rival-seed',
    'event-replay-rival',
  );
  resolveSetupTucks(game);
  game.activePlayer = game.players[1];
  if (!game.rivalState) {
    throw new Error('expected rival state');
  }
  game.rivalState.actionDeck = new Deck(['S.1']);
  return game;
}

describe('GameEventReplay', () => {
  it('rebuilds current state from a turn snapshot and events since its sequence', () => {
    const base = createReplayTestGame();
    const snapshotSeq = base.eventLog.toArray().at(-1)?.seq ?? 0;
    const snapshot = serializeGame(base, 1);
    const live = deserializeGame(snapshot);

    live.processFreeAction('p1', {
      type: EFreeAction.EXCHANGE_RESOURCES,
      from: EResource.CREDIT,
      to: EResource.ENERGY,
    });

    const replayed = replayGameEvents(
      deserializeGame(snapshot),
      live.eventLog.since(snapshotSeq),
    );

    expect(serializeGame(replayed, 2)).toEqual(serializeGame(live, 2));
  });

  it('replays main action command events exactly once', () => {
    const base = createReplayTestGame();
    const snapshotSeq = base.eventLog.toArray().at(-1)?.seq ?? 0;
    const snapshot = serializeGame(base, 1);
    const live = deserializeGame(snapshot);

    live.processMainAction('p1', { type: EMainAction.LAUNCH_PROBE });
    const events = live.eventLog.since(snapshotSeq);

    expect(
      events.filter(
        (event) =>
          event.type === EGameEventType.ACTION &&
          typeof event.action === 'object' &&
          event.action.type === EMainAction.LAUNCH_PROBE,
      ),
    ).toHaveLength(1);

    const replayed = replayGameEvents(deserializeGame(snapshot), events);

    expect(serializeGame(replayed, 2)).toEqual(serializeGame(live, 2));
  });

  it('rebuilds a rival automated turn from persisted events since the previous snapshot', () => {
    const base = createReplaySoloRivalGame();
    const snapshotSeq = base.eventLog.toArray().at(-1)?.seq ?? 0;
    const snapshot = serializeGame(base, 1);
    const live = deserializeGame(snapshot);

    RivalTurnController.resolveCurrentTurn(live as Game);
    const events = live.eventLog.since(snapshotSeq);

    const replayed = replayGameEvents(deserializeGame(snapshot), events);

    expect(serializeGame(replayed, 2)).toEqual(serializeGame(live, 2));
  });

  it('rebuilds a rival automated pass from persisted events since the previous snapshot', () => {
    const base = createReplaySoloRivalGame();
    if (!base.rivalState) {
      throw new Error('expected rival state');
    }
    base.rivalState.actionDeck = new Deck([]);
    const snapshotSeq = base.eventLog.toArray().at(-1)?.seq ?? 0;
    const snapshot = serializeGame(base, 1);
    const live = deserializeGame(snapshot);

    RivalTurnController.resolveCurrentTurn(live as Game);
    const events = live.eventLog.since(snapshotSeq);

    const replayed = replayGameEvents(deserializeGame(snapshot), events);

    expect(serializeGame(replayed, 2)).toEqual(serializeGame(live, 2));
  });
});
