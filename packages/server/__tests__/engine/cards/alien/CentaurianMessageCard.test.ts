import { EResource } from '@seti/common/types/element';
import { EAlienType } from '@seti/common/types/protocol/enums';
import { AlienState, isCentauriansAlienBoard } from '@/engine/alien/index.js';
import { CentaurianMessageCard } from '@/engine/cards/alien/CentaurianMessageCard.js';
import { loadCardData } from '@/engine/cards/loadCardData.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('CentaurianMessageCard', () => {
  it('queues the played card as the next pending message and places a +15 milestone', () => {
    const game = buildTestGame({ seed: 'centaurian-message-card' });
    game.alienState = AlienState.createFromHiddenAliens([
      EAlienType.CENTAURIANS,
    ]);
    const board = game.alienState.getBoardByType(EAlienType.CENTAURIANS);
    if (!isCentauriansAlienBoard(board)) {
      throw new Error('expected Centaurians board');
    }
    const player = getPlayer(game, 'p1');
    player.score = 11;
    const card = new CentaurianMessageCard(loadCardData('ET.31'));

    card.play({ player, game });

    expect(card.id).toBe('ET.31');
    expect(board.pendingMessagesByPlayer[player.id]).toEqual(['ET.31']);
    expect(board.messageMilestones).toEqual([
      {
        playerId: player.id,
        threshold: 26,
        sourceCardId: 'ET.31',
        resolved: false,
      },
    ]);
  });

  it('applies the printed immediate effect before queuing the delayed message', () => {
    const game = buildTestGame({ seed: 'centaurian-message-card-immediate' });
    game.alienState = AlienState.createFromHiddenAliens([
      EAlienType.CENTAURIANS,
    ]);
    const board = game.alienState.getBoardByType(EAlienType.CENTAURIANS);
    if (!isCentauriansAlienBoard(board)) {
      throw new Error('expected Centaurians board');
    }
    const player = getPlayer(game, 'p1');
    player.score = 8;
    const publicityBefore = player.resources.publicity;
    const creditsBefore = player.resources.credits;
    const card = new CentaurianMessageCard(loadCardData('ET.33'));

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.resources.publicity).toBe(publicityBefore + 1);
    expect(player.resources.credits).toBe(creditsBefore + 1);
    expect(board.pendingMessagesByPlayer[player.id]).toEqual(['ET.33']);
    expect(board.messageMilestones.at(-1)).toEqual({
      playerId: player.id,
      threshold: 23,
      sourceCardId: 'ET.33',
      resolved: false,
    });
  });

  it('uses the card income icon only for delayed resolution, not immediate behavior', () => {
    const game = buildTestGame({ seed: 'centaurian-message-card-income' });
    game.alienState = AlienState.createFromHiddenAliens([
      EAlienType.CENTAURIANS,
    ]);
    const player = getPlayer(game, 'p1');
    const tuckedBefore = [...player.tuckedIncomeCards];
    const creditIncomeBefore = player.income.tuckedCardIncome[EResource.CREDIT];
    const publicityBefore = player.resources.publicity;
    const card = new CentaurianMessageCard(loadCardData('ET.36'));

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.tuckedIncomeCards).toEqual(tuckedBefore);
    expect(player.income.tuckedCardIncome[EResource.CREDIT]).toBe(
      creditIncomeBefore,
    );
    expect(player.resources.publicity).toBe(publicityBefore + 2);
  });
});
