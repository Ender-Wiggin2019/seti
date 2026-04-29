import { ETechId } from '@seti/common/types/tech';
import { PlayCardAction } from '@/engine/actions/PlayCard.js';
import { PIXL } from '@/engine/cards/base/PixlCard.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { EventLog } from '@/engine/event/EventLog.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { TechBoard } from '@/engine/tech/TechBoard.js';
import { createTech } from '@/engine/tech/TechRegistry.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';
import { stubTurnLockFields } from '../../../helpers/stubTurnLock.js';

function createPlayer(): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    score: 10,
    resources: { publicity: 5 },
    computerColumnConfigs: [{ topReward: null, techSlotAvailable: false }],
  });
}

function createGame(): IGame {
  const solarSystem = {
    rotationCounter: 0,
    rotateNextDisc() {
      const rotatedDisc = this.rotationCounter;
      this.rotationCounter += 1;
      return rotatedDisc;
    },
  };

  return {
    ...stubTurnLockFields(),
    mainDeck: new Deck<string>([]),
    deferredActions: new DeferredActionsQueue(),
    eventLog: new EventLog(),
    random: new SeededRandom('pixl-card'),
    missionTracker: { recordEvent: () => undefined },
    techBoard: {
      getAvailableTechs: () => [ETechId.COMPUTER_VP_CREDIT],
      canResearch: () => true,
      take: () => ({
        tile: {
          tech: createTech(ETechId.COMPUTER_VP_CREDIT),
          bonuses: [],
        },
        vpBonus: 0,
      }),
    },
    solarSystem,
    alienState: null,
  } as unknown as IGame;
}

describe('PIXL', () => {
  it('loads expected card metadata', () => {
    const card = new PIXL();

    expect(card.id).toBe('119');
  });

  it('researches a computer tech and scores once for each publicity', () => {
    const card = new PIXL();
    const player = createPlayer();
    const game = createGame();

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.techs).toEqual([ETechId.COMPUTER_VP_CREDIT]);
    expect(player.score).toBe(15);
    expect(game.solarSystem?.rotationCounter).toBe(1);
  });

  it('skips unavailable computer tech but still rotates and scores for publicity', () => {
    const player = createPlayer();
    const game = createGame();
    const emptyTechBoard = new TechBoard(new SeededRandom('empty-tech-board'));
    for (const stack of emptyTechBoard.stacks.values()) {
      stack.tiles = [];
    }
    game.techBoard = emptyTechBoard;
    player.hand = ['119'];

    const result = PlayCardAction.execute(player, game, 0);
    game.deferredActions.drain(game);

    expect(result.cardId).toBe('119');
    expect(player.techs).toEqual([]);
    expect(player.score).toBe(15);
    expect(game.solarSystem?.rotationCounter).toBe(1);
  });
});
