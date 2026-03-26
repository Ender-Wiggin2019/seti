import { vi } from 'vitest';
import { RotateDiscEffect } from '@/engine/effects/solar/RotateDiscEffect.js';

describe('RotateDiscEffect', () => {
  it('returns -1 when solar system is missing', () => {
    const game = { solarSystem: null };
    expect(RotateDiscEffect.canExecute(game as never)).toBe(false);
    expect(RotateDiscEffect.execute(game as never)).toEqual({
      rotatedDisc: -1,
    });
  });

  it('rotates next disc when solar system exists', () => {
    const game = {
      solarSystem: {
        rotateNextDisc: vi.fn(() => 2),
      },
    };

    expect(RotateDiscEffect.canExecute(game as never)).toBe(true);
    expect(RotateDiscEffect.execute(game as never)).toEqual({ rotatedDisc: 2 });
    expect(game.solarSystem.rotateNextDisc).toHaveBeenCalledOnce();
  });
});
