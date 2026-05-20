import { PRELUDE_CARDS_BY_ID } from '@seti/common/data/preludeCards';
import { EEffectType } from '@seti/common/types/effect';
import { EResource } from '@seti/common/types/element';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { CardRender } from '@/features/cards/CardRender';
import { useDebugStore } from '@/stores/debugStore';

describe('CardRender', () => {
  beforeEach(() => {
    useDebugStore.setState({ textMode: false });
  });

  it('renders maintained PreludeCard for prelude cards in image mode', () => {
    const card = PRELUDE_CARDS_BY_ID['SR.3'];

    render(<CardRender card={card} />);

    expect(screen.getByTestId('card-render-SR.3')).toBeInTheDocument();
    expect(screen.getByTestId('seti-prelude-card-SR.3')).toBeInTheDocument();
    expect(screen.queryByTestId('text-prelude-card-SR.3')).toBeNull();
  });

  it('renders prelude cards with the text-mode renderer when text mode is enabled', () => {
    useDebugStore.setState({ textMode: true });
    const card = PRELUDE_CARDS_BY_ID['SR.3'];

    render(<CardRender card={card} />);

    expect(screen.getByTestId('card-render-SR.3')).toBeInTheDocument();
    expect(screen.getByTestId('text-prelude-card-SR.3')).toBeInTheDocument();
    expect(screen.queryByTestId('seti-prelude-card-SR.3')).toBeNull();
    expect(
      screen.getByTestId('text-prelude-card-title-SR.3'),
    ).toHaveTextContent('SR.3');
    expect(
      screen.getByTestId('text-prelude-card-upper-SR.3'),
    ).toHaveTextContent('2 red-signal');
    expect(
      screen.getByTestId('text-prelude-card-lower-SR.3'),
    ).toHaveTextContent('2 score');
    expect(
      screen.getByTestId('text-prelude-card-lower-SR.3'),
    ).toHaveTextContent('2 data');
  });

  it('keeps base cards using the existing text-mode card renderer', () => {
    useDebugStore.setState({ textMode: true });

    render(
      <CardRender
        card={{
          id: 'C.1',
          name: 'Base Card',
          price: 1,
          income: EResource.CREDIT,
          effects: [
            {
              effectType: EEffectType.BASE,
              type: EResource.DATA,
              value: 1,
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId('text-card-C.1')).toBeInTheDocument();
  });
});
