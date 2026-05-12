import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DescTextRender } from '@/features/cards/DescTextRender';

describe('DescTextRender', () => {
  it('renders desc breaks as real line breaks', () => {
    const { container } = render(
      <DescTextRender desc='First line<br>Second line<br />Third line' />,
    );

    expect(screen.getAllByTestId('desc-text-break')).toHaveLength(2);
    expect(container).toHaveTextContent('First lineSecond lineThird line');
  });

  it('renders desc tokens as readable text', () => {
    render(<DescTextRender desc='Gain {credit}<br/>Score {score-2}' />);

    const tokens = screen.getAllByTestId('desc-text-token');
    expect(tokens[0]).toHaveTextContent('credit');
    expect(tokens[1]).toHaveTextContent('2 score');
    expect(screen.getByText(/Gain/)).not.toHaveTextContent('{credit}');
  });

  it('keeps literal html text escaped', () => {
    const { container } = render(
      <DescTextRender desc='Keep <strong>literal</strong> text' />,
    );

    expect(container.querySelector('strong')).toBeNull();
    expect(container).toHaveTextContent('Keep <strong>literal</strong> text');
  });
});
