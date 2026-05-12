import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EEffectType } from '@seti/common/types/effect';
import { EResource, ESector } from '@seti/common/types/element';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TextCard } from '@/features/cards/TextCard';

function createComplexCard(): IBaseCard {
  return {
    id: 'C.42',
    name: 'Signal Analysis',
    price: 4,
    priceType: EResource.CREDIT,
    freeAction: [{ type: EResource.DATA, value: 1 }],
    sector: ESector.RED,
    income: EResource.ENERGY,
    effects: [
      {
        effectType: EEffectType.BASE,
        type: EResource.CREDIT,
        value: 2,
        desc: 'gain credits',
      },
      {
        effectType: EEffectType.MISSION_FULL,
        desc: 'complete a signal study',
        missions: [
          {
            req: [
              {
                effectType: EEffectType.BASE,
                type: EResource.DATA,
                value: 1,
              },
            ],
            reward: [
              {
                effectType: EEffectType.BASE,
                type: EResource.SCORE,
                value: 3,
              },
            ],
          },
          {
            req: [
              {
                effectType: EEffectType.CUSTOMIZED,
                id: 'scan-sector',
                desc: 'scan any sector',
              },
            ],
            reward: [
              {
                effectType: EEffectType.BASE,
                type: EResource.CARD_ANY,
                value: 1,
              },
            ],
          },
        ],
      },
      {
        effectType: EEffectType.BASE,
        type: EResource.PUBLICITY,
        value: 1,
      },
    ],
  };
}

function createBaseOnlyCard(): IBaseCard {
  return {
    id: 'C.7',
    name: 'Simple Signal',
    price: 1,
    priceType: EResource.CREDIT,
    sector: ESector.BLUE,
    income: EResource.CREDIT,
    effects: [
      {
        effectType: EEffectType.BASE,
        type: EResource.DATA,
        value: 1,
      },
    ],
  };
}

function createEndGameCard(): IBaseCard {
  return {
    id: 'C.99',
    name: 'Long Baseline Array',
    price: 5,
    priceType: EResource.CREDIT,
    income: EResource.PUBLICITY,
    effects: [
      {
        effectType: EEffectType.BASE,
        type: EResource.CREDIT,
        value: 2,
      },
      {
        effectType: EEffectType.END_GAME,
        desc: 'score installed instruments',
        score: 2,
        per: {
          effectType: EEffectType.BASE,
          type: EResource.DATA,
          value: 1,
        },
      },
    ],
  };
}

function createEnergyPriceCard(): IBaseCard {
  return {
    id: 'C.3',
    name: 'Energy Probe',
    price: 3,
    priceType: EResource.ENERGY,
    income: EResource.ENERGY,
    effects: [],
  };
}

function createHtmlDescCard(): IBaseCard {
  return {
    id: 'C.50',
    name: 'Line Break Study',
    price: 2,
    priceType: EResource.CREDIT,
    income: EResource.DATA,
    description: 'First instruction<br>Second instruction with {score-2}',
    effects: [
      {
        effectType: EEffectType.CUSTOMIZED,
        id: 'multi-line-effect',
        desc: 'Gain {credit}<br/>Then archive {energy-1}',
      },
    ],
  };
}

describe('TextCard', () => {
  it('keeps the same fixed envelope as image cards', () => {
    render(<TextCard card={createComplexCard()} />);

    const card = screen.getByTestId('text-card-C.42');
    expect(card).toHaveStyle({ width: '150px', height: '209px' });
    expect(card).toHaveClass('overflow-hidden');
  });

  it('keeps metadata and income fixed while the effect body scrolls', () => {
    render(<TextCard card={createComplexCard()} />);

    expect(screen.getByTestId('text-card-title-C.42')).toHaveClass('shrink-0');
    expect(screen.getByTestId('text-card-meta-C.42')).toHaveClass('shrink-0');
    expect(screen.getByTestId('text-card-income-C.42')).toHaveClass('shrink-0');
    expect(screen.getByTestId('text-card-free-action-C.42')).toHaveTextContent(
      'Free Action: 1 data',
    );
    expect(screen.getByTestId('text-card-sector-C.42')).toHaveTextContent(
      'Sector: red-signal',
    );

    const body = screen.getByTestId('text-card-body-C.42');
    expect(body).toHaveClass('min-h-0', 'flex-1', 'overflow-y-auto');
  });

  it('renders price as a top-left compact resource badge', () => {
    render(<TextCard card={createComplexCard()} />);

    const price = screen.getByTestId('text-card-price-C.42');
    expect(price).toHaveTextContent('4 C');
    expect(screen.getByTestId('text-card-price-value-C.42')).toHaveClass(
      'text-[15px]',
      'font-bold',
    );
    expect(screen.getByTestId('text-card-price-type-C.42')).toHaveClass(
      'text-[8px]',
    );
    expect(screen.getByTestId('text-card-title-C.42')).not.toHaveTextContent(
      '#C.42',
    );
    expect(screen.getByTestId('text-card-title-C.42')).not.toHaveTextContent(
      '4 credit',
    );
  });

  it('uses E for energy price in the compact badge', () => {
    render(<TextCard card={createEnergyPriceCard()} />);

    expect(screen.getByTestId('text-card-price-C.3')).toHaveTextContent('3 E');
  });

  it('renders readable effect and mission sections', () => {
    render(<TextCard card={createComplexCard()} />);

    expect(screen.getByTestId('text-card-title-C.42')).toHaveTextContent(
      'Signal Analysis',
    );
    expect(screen.getByTestId('text-card-income-C.42')).toHaveTextContent(
      'Income: energy',
    );

    const effectSection = screen.getByTestId('text-card-effects-C.42');
    expect(effectSection).toHaveTextContent('Effect:');
    expect(effectSection).toHaveTextContent('2 credit (gain credits)');
    expect(effectSection).toHaveTextContent('1 publicity');

    const missionSection = screen.getByTestId('text-card-missions-C.42');
    expect(missionSection).toHaveClass(
      'rounded-sm',
      'border',
      'border-surface-600/70',
      'bg-surface-900/45',
    );
    expect(missionSection).toHaveTextContent('Mission:');
    expect(missionSection).toHaveTextContent('complete a signal study');
    expect(within(missionSection).getByText('1 data -> 3 score')).toBeVisible();
    expect(
      within(missionSection).getByText('scan any sector -> 1 any-card'),
    ).toBeVisible();
  });

  it('hides the mission section when the card has no quick or full mission', () => {
    render(<TextCard card={createBaseOnlyCard()} />);

    expect(screen.getByTestId('text-card-effects-C.7')).toHaveTextContent(
      '1 data',
    );
    expect(screen.queryByTestId('text-card-missions-C.7')).toBeNull();
  });

  it('renders end game effects in a separate section', () => {
    render(<TextCard card={createEndGameCard()} />);

    const effectSection = screen.getByTestId('text-card-effects-C.99');
    expect(effectSection).toHaveTextContent('2 credit');
    expect(effectSection).not.toHaveTextContent('END:');

    const endGameSection = screen.getByTestId('text-card-end-game-C.99');
    expect(endGameSection).toHaveClass(
      'rounded-sm',
      'border',
      'border-surface-600/70',
      'bg-surface-900/45',
    );
    expect(endGameSection).toHaveTextContent('End Game:');
    expect(endGameSection).toHaveTextContent(
      'score installed instruments (+2VP per 1 data)',
    );
    expect(screen.queryByTestId('text-card-missions-C.99')).toBeNull();
  });

  it('renders desc line breaks and tokens as readable text', () => {
    render(<TextCard card={createHtmlDescCard()} />);

    const effectSection = screen.getByTestId('text-card-effects-C.50');
    expect(effectSection.querySelectorAll('br')).toHaveLength(1);
    expect(effectSection).toHaveTextContent('Gain credit');
    expect(effectSection).toHaveTextContent('Then archive 1 energy');
    expect(effectSection).not.toHaveTextContent('<br');
    expect(effectSection).not.toHaveTextContent('{credit}');

    const body = screen.getByTestId('text-card-body-C.50');
    expect(body.querySelectorAll('br')).toHaveLength(2);
    expect(body).toHaveTextContent('Second instruction with 2 score');
    expect(body).not.toHaveTextContent('{score-2}');
  });
});
