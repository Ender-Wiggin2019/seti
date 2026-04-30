import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EEffectType } from '@seti/common/types/effect';
import { EResource, ESector } from '@seti/common/types/element';
import { createGenericCard } from '@/engine/cards/base/GenericCards.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';

function createBaseCard(overrides: Partial<IBaseCard> = {}): IBaseCard {
  return {
    id: 'test-card',
    name: 'Test Card',
    price: 2,
    income: EResource.CREDIT,
    effects: [],
    sector: ESector.BLUE,
    ...overrides,
  };
}

describe('createGenericCard', () => {
  it('creates end-game card when END_GAME effect exists', () => {
    const card = createGenericCard(
      createBaseCard({
        effects: [{ effectType: EEffectType.END_GAME, desc: 'score test' }],
      }),
    );
    expect(card.kind).toBe(EServerCardKind.END_GAME);
  });

  it('creates mission card when mission effect exists', () => {
    const card = createGenericCard(
      createBaseCard({
        effects: [
          {
            effectType: EEffectType.MISSION_QUICK,
            missions: [{ req: [], reward: [] }],
          },
        ],
      }),
    );
    expect(card.kind).toBe(EServerCardKind.MISSION);
  });

  it('creates immediate card by default', () => {
    const card = createGenericCard(createBaseCard());
    expect(card.kind).toBe(EServerCardKind.IMMEDIATE);
  });
});
