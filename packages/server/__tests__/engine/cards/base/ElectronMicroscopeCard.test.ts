import { ETrace } from '@seti/common/types/element';
import { EAlienType } from '@seti/common/types/protocol/enums';
import { AlienState } from '@/engine/alien/AlienState.js';
import { ElectronMicroscopeCard } from '@/engine/cards/base/ElectronMicroscopeCard.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { EventLog } from '@/engine/event/EventLog.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { placeTraceForTestSetup } from '../../../helpers/traceTestUtils.js';

function createPlayer(): Player {
  return new Player({ id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 });
}

function createGame(): IGame {
  return {
    alienState: AlienState.createFromHiddenAliens([
      EAlienType.DUMMY,
      EAlienType.DUMMY,
    ]),
    deferredActions: new DeferredActionsQueue(),
    eventLog: new EventLog(),
    missionTracker: { recordEvent: () => undefined },
  } as unknown as IGame;
}

describe('ElectronMicroscopeCard (card 99)', () => {
  it('marks a yellow trace only for a species already marked with yellow', () => {
    const card = new ElectronMicroscopeCard();
    const player = createPlayer();
    const game = createGame();
    placeTraceForTestSetup(game.alienState, player, game, ETrace.YELLOW, 1);

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(game.alienState.getPlayerTraceCount(player, ETrace.YELLOW, 0)).toBe(
      0,
    );
    expect(game.alienState.getPlayerTraceCount(player, ETrace.YELLOW, 1)).toBe(
      2,
    );
    expect(card.behavior.custom).toBeUndefined();
  });
});
