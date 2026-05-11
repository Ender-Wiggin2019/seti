import { MurepIdeaCompetition } from '@/engine/cards/spaceAgency/MurepIdeaCompetitionCard.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('MurepIdeaCompetition', () => {
  it('discards the current hand before gaining publicity and two cards', () => {
    const game = buildTestGame({ seed: 'sa-32' });
    const player = getPlayer(game, 'p1');
    player.hand = ['SA.1', 'SA.2'];
    const initialPublicity = player.publicity;
    const card = new MurepIdeaCompetition();

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_32');
    expect(player.hand.length).toBe(2);
    expect(player.hand).not.toEqual(expect.arrayContaining(['SA.1', 'SA.2']));
    expect(player.publicity).toBe(initialPublicity + 1);
  });

  it('keeps Exertian cards because they cannot be discarded', () => {
    const game = buildTestGame({ seed: 'sa-32-exertian' });
    const player = getPlayer(game, 'p1');
    player.hand = ['ET.41', 'SA.1'];
    const card = new MurepIdeaCompetition();

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.hand).toContain('ET.41');
    expect(player.hand).not.toContain('SA.1');
    expect(game.mainDeck.getDiscardPile()).toContain('SA.1');
    expect(game.mainDeck.getDiscardPile()).not.toContain('ET.41');
  });
});
