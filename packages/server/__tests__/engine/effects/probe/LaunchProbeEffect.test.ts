import { LaunchProbeEffect } from '@/engine/effects/probe/LaunchProbeEffect.js';

describe('LaunchProbeEffect', () => {
  it('cannot execute when solar system is missing', () => {
    const player = { techs: [], probeSpaceLimit: 1, probesInSpace: 0 };
    const game = { solarSystem: null };

    expect(LaunchProbeEffect.canExecute(player as never, game as never)).toBe(
      false,
    );
  });
});
