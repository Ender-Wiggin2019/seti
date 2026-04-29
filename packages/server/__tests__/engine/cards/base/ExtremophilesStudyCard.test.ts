import { ETrace } from '@seti/common/types/element';
import { EAlienType } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { AlienState } from '@/engine/alien/AlienState.js';
import { ExtremophilesStudyCard } from '@/engine/cards/base/ExtremophilesStudyCard.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { EventLog } from '@/engine/event/EventLog.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

function createPlayer(): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    score: 0,
  });
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

describe('ExtremophilesStudy (card 75)', () => {
  it('loads expected metadata without exposing desc custom token', () => {
    const card = new ExtremophilesStudyCard();

    expect(card.id).toBe('75');
    expect(card.behavior.custom).toBeUndefined();
  });

  it('marks any trace and scores for the resulting trace color count', () => {
    const card = new ExtremophilesStudyCard();
    const player = createPlayer();
    const game = createGame();

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    expect(input?.type).toBe(EPlayerInputType.OPTION);

    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'alien-0-discovery-red-trace',
    });

    expect(game.alienState.getPlayerTraceCount(player, ETrace.RED)).toBe(1);
    expect(player.score).toBe(6);
  });
});
