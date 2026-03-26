import { EPhase } from '@seti/common/types/protocol/enums';
import type { IGame } from '@/engine/IGame.js';

describe('IGame type contract', () => {
  it('accepts minimal typed shape for compile-time contract', () => {
    const game: Pick<IGame, 'id' | 'phase' | 'round'> = {
      id: 'g1',
      phase: EPhase.SETUP,
      round: 1,
    };

    expect(game.id).toBe('g1');
  });
});
