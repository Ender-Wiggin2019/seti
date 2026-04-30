import { ETrace } from '@seti/common/types/element';
import { EAlienType, EPlanet } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { AlienState } from '@/engine/alien/AlienState.js';
import { PlanetaryBoard } from '@/engine/board/PlanetaryBoard.js';
import { SampleReturnCard } from '@/engine/cards/base/SampleReturnCard.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { EventLog } from '@/engine/event/EventLog.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { EPieceType } from '@/engine/player/Pieces.js';

function createPlayer(): Player {
  const player = new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
  });
  player.pieces.deploy(EPieceType.LANDER);
  return player;
}

function createGame(player: Player): IGame {
  const planetaryBoard = new PlanetaryBoard();
  planetaryBoard.planets.get(EPlanet.MARS)?.landingSlots.push({
    playerId: player.id,
  });

  const game = {
    planetaryBoard,
    alienState: AlienState.createFromHiddenAliens([EAlienType.DUMMY]),
    deferredActions: new DeferredActionsQueue(),
    eventLog: new EventLog(),
    missionTracker: { recordEvent: () => undefined },
    markTrace: (traceColor: ETrace) =>
      (game as unknown as IGame).alienState.createTraceInput(
        player,
        game as unknown as IGame,
        traceColor,
      ),
  } as unknown as IGame;
  return game;
}

describe('SampleReturnCard (card 84)', () => {
  it('loads expected metadata without exposing desc custom token', () => {
    const card = new SampleReturnCard();

    expect(card.id).toBe('84');
    expect(card.behavior.custom).toBeUndefined();
  });

  it('removes one own lander and marks a yellow trace', () => {
    const card = new SampleReturnCard();
    const player = createPlayer();
    const game = createGame(player);

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    expect(input?.type).toBe(EPlayerInputType.OPTION);
    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'alien-0-discovery-yellow-trace',
    });

    expect(
      game.planetaryBoard?.planets.get(EPlanet.MARS)?.landingSlots,
    ).toHaveLength(0);
    expect(player.pieces.deployed(EPieceType.LANDER)).toBe(0);
    expect(game.alienState.getPlayerTraceCount(player, ETrace.YELLOW)).toBe(1);
  });
});
