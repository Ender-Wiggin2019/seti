import { describe, expect, it } from 'vitest';
import { alienCards } from '@/data/alienCards';

describe('alienCards assets', () => {
  it('uses the synced seti-assets sprite path for alien cards', () => {
    const spriteSources = new Set(
      alienCards
        .map((card) => card.position?.src)
        .filter((source): source is string => Boolean(source)),
    );

    expect([...spriteSources].sort()).toEqual([
      '/seti-assets/aliens/anomalies.webp',
      '/seti-assets/aliens/centaurians.webp',
      '/seti-assets/aliens/exertians.webp',
      '/seti-assets/aliens/mascamites.webp',
      '/seti-assets/aliens/oumuamua.webp',
    ]);
  });
});
