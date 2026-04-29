import type { ISelectCardInputModel } from '@seti/common/types/protocol/playerInput';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { PartOfEverydayLifeCard } from '@/engine/cards/alien/PartOfEverydayLifeCard.js';
import {
  createAnomaliesGame,
  resolveDeferredInputs,
  setMainDeck,
} from './AnomaliesCardTestHelpers.js';

describe('PartOfEverydayLifeCard', () => {
  it('draws three cards, discards one for its corner, then discards one for its income resource', () => {
    const { game, player } = createAnomaliesGame('part-of-everyday-life');
    setMainDeck(game, ['ET.17', 'ET.12', 'ET.20', '55']);
    const scoreBefore = player.score;
    const moveBefore = player.getMoveStash();
    const creditsBefore = player.resources.credits;
    let discardStep = 0;

    new PartOfEverydayLifeCard().play({ player, game });
    resolveDeferredInputs(game, (model) => {
      if (model.type !== EPlayerInputType.CARD) return '';
      discardStep += 1;
      const cards = (model as ISelectCardInputModel).cards;
      if (discardStep === 1) {
        return cards.find((card) => card.id.includes('ET.17'))?.id ?? '';
      }
      return cards.find((card) => card.id.includes('ET.12'))?.id ?? '';
    });

    expect(player.score).toBe(scoreBefore + 1);
    expect(player.getMoveStash()).toBe(moveBefore + 1);
    expect(player.resources.credits).toBe(creditsBefore + 1);
    expect(player.hand).toContain('ET.20');
    expect(player.hand).not.toContain('ET.17');
    expect(player.hand).not.toContain('ET.12');
  });
});
