import { describe, expect, it } from 'vitest';
import { alienCards } from '@/data/alienCards';
import { EPlanet } from '@/types/element';
import { getMascamitesSampleDeliveryDestination } from '@/utils/mascamitesSampleDelivery';

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

  it('stores Mascamites sample delivery destinations as structured card data', () => {
    const deliveryDestinations = new Map(
      alienCards
        .filter((card) => card.id.startsWith('ET.'))
        .map((card) => [card.id, getMascamitesSampleDeliveryDestination(card)]),
    );

    expect(deliveryDestinations.get('ET.1')).toBe(EPlanet.EARTH);
    expect(deliveryDestinations.get('ET.2')).toBe(EPlanet.EARTH);
    expect(deliveryDestinations.get('ET.3')).toBe(EPlanet.EARTH);
    expect(deliveryDestinations.get('ET.4')).toBe(EPlanet.MARS);
    expect(deliveryDestinations.get('ET.6')).toBe(EPlanet.EARTH);
    expect(deliveryDestinations.get('ET.7')).toBe(EPlanet.EARTH);
  });
});
