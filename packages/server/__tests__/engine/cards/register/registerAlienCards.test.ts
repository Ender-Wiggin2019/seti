import { alienCards } from '@seti/common/data/alienCards';
import {
  EResource,
  EScanAction,
  ETech,
  ETrace,
} from '@seti/common/types/element';
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

  it('creates Exertian advanced alien cards that have no printed executable effects', () => {
    const registry = new CardRegistry();

    registerAlienCards(registry);

    for (let index = 41; index <= 55; index += 1) {
      const cardId = `ET.${index}`;
      const card = registry.create(cardId);

      expect(card.id).toBe(cardId);
      expect(card.kind).toBe(EServerCardKind.IMMEDIATE);
      expect(card.behavior).toEqual({});
    }
  });

  it('treats Centaurian cards as energy-cost immediate message cards, not missions', () => {
    const registry = new CardRegistry();

    registerAlienCards(registry);

    const vesselDesigns = registry.create('ET.31');

    expect(vesselDesigns.kind).toBe(EServerCardKind.IMMEDIATE);
    expect(vesselDesigns.requirements.resources).toEqual({ energy: 1 });
    expect(vesselDesigns.behavior).toEqual({ launchProbe: true });
  });

  it('registers Centaurian message card descriptions in common metadata', () => {
    const centaurianCards = alienCards.filter((card) =>
      /^ET\.(3[1-9]|40)$/.test(card.id),
    );

    expect(centaurianCards).toHaveLength(10);
    for (const card of centaurianCards) {
      expect(card.effects).toBeDefined();
      expect(card.effects?.length).toBeGreaterThan(0);
    }
    expect(alienCards.find((card) => card.id === 'ET.38')?.freeAction).toEqual([
      { type: EResource.PUBLICITY, value: 2 },
    ]);
  });

  it('registers executable Centaurian immediate effects by card id', () => {
    const registry = new CardRegistry();

    registerAlienCards(registry);

    expect(registry.create('ET.31').behavior).toMatchObject({
      launchProbe: true,
    });
    expect(registry.create('ET.32').behavior).toMatchObject({
      gainResources: { data: 2 },
    });
    expect(registry.create('ET.33').behavior).toMatchObject({
      gainResources: { publicity: 1, credits: 1 },
    });
    expect(registry.create('ET.34').behavior).toMatchObject({
      drawCards: 1,
    });
    expect(registry.create('ET.35').behavior).toMatchObject({
      gainResources: { data: 1 },
    });
    expect(registry.create('ET.36').behavior).toMatchObject({
      gainResources: { publicity: 2 },
    });
    expect(registry.create('ET.37').behavior).toMatchObject({
      drawCards: 1,
    });
    expect(registry.create('ET.38').behavior).toMatchObject({
      rotateSolarSystem: true,
      researchTech: ETech.COMPUTER,
    });
    expect(registry.create('ET.39').behavior).toMatchObject({
      rotateSolarSystem: true,
      researchTech: ETech.SCAN,
    });
    expect(registry.create('ET.40').behavior).toMatchObject({
      markAnySignal: 2,
    });

    for (const cardId of [
      'ET.31',
      'ET.32',
      'ET.33',
      'ET.34',
      'ET.35',
      'ET.36',
      'ET.37',
      'ET.38',
      'ET.39',
      'ET.40',
    ]) {
      expect(registry.create(cardId).behavior.custom).toBeUndefined();
    }
  });

  it('keeps delayed Centaurian effects out of immediate runtime behavior', () => {
    const registry = new CardRegistry();

    registerAlienCards(registry);

    expect(registry.create('ET.34').behavior.markTrace).toBeUndefined();
    expect(registry.create('ET.35').behavior.markTrace).toBeUndefined();
    expect(registry.create('ET.36').behavior.markTrace).toBeUndefined();
    expect(registry.create('ET.37').behavior.markTrace).toBeUndefined();
    expect(registry.create('ET.40').behavior.tuckForIncome).toBeUndefined();

    const printedTraceTypes = alienCards
      .find((card) => card.id === 'ET.34')
      ?.effects?.map((effect) => ('type' in effect ? effect.type : undefined));
    expect(printedTraceTypes).toContain(ETrace.RED);
    expect(
      alienCards
        .find((card) => card.id === 'ET.40')
        ?.effects?.some(
          (effect) => 'type' in effect && effect.type === EScanAction.ANY,
        ),
    ).toBe(true);
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
