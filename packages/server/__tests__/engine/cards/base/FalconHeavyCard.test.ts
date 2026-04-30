import { EResource } from '@seti/common/types/element';
import { FalconHeavyCard } from '@/engine/cards/base/FalconHeavyCard.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

function createPlayer(): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    probesInSpace: 1,
    probeSpaceLimit: 1,
  });
}

function createGame(): IGame {
  return {
    deferredActions: new DeferredActionsQueue(),
    solarSystem: {
      getSpacesOnPlanet: () => [{ id: 'earth-space' }],
      placeProbe: () => ({ id: 'probe-launched', playerId: 'p1' }),
    },
  } as unknown as IGame;
}

describe('FalconHeavyCard (card 9)', () => {
  it('loads expected metadata without exposing desc custom token', () => {
    const card = new FalconHeavyCard();

    expect(card.id).toBe('9');
    expect(card.freeAction?.[0].type).toBe(EResource.MOVE);
    expect(card.behavior.custom).toBeUndefined();
    expect(card.behavior.launchProbe).toBeUndefined();
  });

  it('launches two probes while ignoring the normal probes-in-space limit', () => {
    const card = new FalconHeavyCard();
    const player = createPlayer();
    const game = createGame();
    const publicityBefore = player.resources.publicity;

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.probesInSpace).toBe(3);
    expect(player.probeSpaceLimit).toBe(1);
    expect(player.resources.publicity).toBe(publicityBefore + 1);
  });
});
