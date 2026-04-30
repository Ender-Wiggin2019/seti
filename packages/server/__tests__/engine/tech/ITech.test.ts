import type { IScanModifierContext } from '@/engine/tech/ITech.js';

describe('ITech type contract', () => {
  it('defines scan modifier context shape', () => {
    const ctx: IScanModifierContext = { signalSectors: ['s1', 's2'] };
    expect(ctx.signalSectors).toHaveLength(2);
  });
});
