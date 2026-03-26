import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProbeToken } from '@/features/board/ProbeToken';

describe('ProbeToken', () => {
  it('maps player color to probe asset', () => {
    render(
      <ProbeToken
        playerColor='purple'
        xPercent={50}
        yPercent={50}
        offsetIndex={0}
        offsetCount={1}
      />,
    );

    const token = screen.getByAltText('purple probe');
    expect(token).toHaveAttribute(
      'src',
      '/assets/seti/tokens/probes/purpleProbe.png',
    );
  });
});
