import { CardRegistry } from '@/engine/cards/CardRegistry.js';
import { registerAlienCards } from '@/engine/cards/register/registerAlienCards.js';

describe('registerAlienCards', () => {
  it('registers expected alien card id range', () => {
    const registry = new CardRegistry();

    registerAlienCards(registry);

    expect(registry.has('ET.1')).toBe(true);
    expect(registry.has('ET.55')).toBe(true);
    expect(registry.create('ET.1').id).toBe('ET.1');
  });

  it('registers anomalies ET.11-ET.20 with executable behavior metadata', () => {
    const registry = new CardRegistry();

    registerAlienCards(registry);

    for (const cardId of [
      'ET.11',
      'ET.12',
      'ET.13',
      'ET.14',
      'ET.15',
      'ET.16',
      'ET.17',
      'ET.18',
      'ET.19',
      'ET.20',
    ]) {
      expect(registry.has(cardId)).toBe(true);
      expect(registry.create(cardId).id).toBe(cardId);
    }

    expect(registry.create('ET.11').behavior).toMatchObject({
      launchProbe: true,
      custom: expect.arrayContaining(['desc.et-11']),
    });
    expect(registry.create('ET.14').behavior.custom).toEqual(
      expect.arrayContaining(['desc.et-14']),
    );
    expect(registry.create('ET.17').behavior.custom).toEqual(
      expect.arrayContaining(['desc.et-17']),
    );
    expect(registry.create('ET.20').behavior).toMatchObject({
      markAnySignal: 1,
      custom: expect.arrayContaining(['desc.et-20']),
    });
  });
});
