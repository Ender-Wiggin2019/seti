import { CardRegistry } from '@/engine/cards/CardRegistry.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';
import { registerAlienCards } from '@/engine/cards/register/registerAlienCards.js';

describe('registerAlienCards', () => {
  it('registers expected alien card id range', () => {
    const registry = new CardRegistry();

    registerAlienCards(registry);

    expect(registry.has('ET.1')).toBe(true);
    expect(registry.has('ET.55')).toBe(true);
    expect(registry.create('ET.1').id).toBe('ET.1');
  });

  it('creates advanced alien cards that have no printed executable effects', () => {
    const registry = new CardRegistry();

    registerAlienCards(registry);

    for (let index = 31; index <= 55; index += 1) {
      const cardId = `ET.${index}`;
      const card = registry.create(cardId);

      expect(card.id).toBe(cardId);
      expect(card.kind).toBe(EServerCardKind.IMMEDIATE);
      expect(card.behavior).toEqual({});
    }
  });

  it('treats Centaurian cards as energy-cost immediate cards, not missions', () => {
    const registry = new CardRegistry();

    registerAlienCards(registry);

    const vesselDesigns = registry.create('ET.31');

    expect(vesselDesigns.kind).toBe(EServerCardKind.IMMEDIATE);
    expect(vesselDesigns.requirements.resources).toEqual({ energy: 1 });
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
    });
    expect(registry.create('ET.11').behavior.custom).toBeUndefined();
    expect(registry.create('ET.14').behavior.custom).toBeUndefined();
    expect(registry.create('ET.17').behavior.custom).toBeUndefined();
    expect(registry.create('ET.20').behavior).toMatchObject({
      markAnySignal: 1,
    });
    expect(registry.create('ET.20').behavior.custom).toBeUndefined();
  });
});
