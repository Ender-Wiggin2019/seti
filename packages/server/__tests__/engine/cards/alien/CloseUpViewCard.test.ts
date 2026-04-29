import { isMovementPublicityDisabledForCurrentTurn } from '@/engine/alien/plugins/AnomaliesTurnEffects.js';
import { CloseUpViewCard } from '@/engine/cards/alien/CloseUpViewCard.js';
import {
  createAnomaliesGame,
  resolveDeferredInputs,
} from './AnomaliesCardTestHelpers.js';

describe('CloseUpViewCard', () => {
  it('gains five movement and disables movement publicity for the current turn', () => {
    const { game, player } = createAnomaliesGame('close-up-view');

    new CloseUpViewCard().play({ player, game });
    resolveDeferredInputs(game);

    expect(player.getMoveStash()).toBe(5);
    expect(isMovementPublicityDisabledForCurrentTurn(game, player.id)).toBe(
      true,
    );
  });
});
