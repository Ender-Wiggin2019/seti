import { EResource } from '@seti/common/types/element';
import { PreLaunchTestingCard } from '@/engine/cards/base/PreLaunchTestingCard.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

function createPlayer(): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    hand: ['39', '46', '55'],
  });
}

function createGame(): IGame {
  return {
    deferredActions: new DeferredActionsQueue(),
    missionTracker: { recordEvent: () => undefined },
    solarSystem: {
      getSpacesOnPlanet: () => [{ id: 'earth-space' }],
      placeProbe: () => ({ id: 'probe-1', playerId: 'p1' }),
    },
  } as unknown as IGame;
}

describe('PreLaunchTestingCard (card 74)', () => {
  it('loads expected metadata without exposing desc custom token', () => {
    const card = new PreLaunchTestingCard();

    expect(card.id).toBe('74');
    expect(card.behavior.custom).toBeUndefined();
  });

  it('launches and gains one movement per shown hand card with a move corner', () => {
    const card = new PreLaunchTestingCard();
    const player = createPlayer();
    const game = createGame();

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.probesInSpace).toBe(1);
    expect(player.getMoveStash()).toBe(2);
    expect(card.freeAction?.[0].type).toBe(EResource.PUBLICITY);
  });

  it('still gains movement when probe launch cannot be resolved', () => {
    const card = new PreLaunchTestingCard();
    const player = createPlayer();
    const game = createGame();
    player.probesInSpace = player.probeSpaceLimit;

    expect(card.canPlay({ player, game })).toBe(true);

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.probesInSpace).toBe(player.probeSpaceLimit);
    expect(player.getMoveStash()).toBe(2);
  });
});
