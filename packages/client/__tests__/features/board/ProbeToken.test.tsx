import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProbeToken } from '@/features/board/ProbeToken';

describe('ProbeToken', () => {
  // Probes use the white-probe PNG as a CSS mask + the player's hex
  // color as the fill, so any of the four player slugs (green /
  // orange / purple / white) renders a tinted probe from a single
  // source asset.
  it('paints the probe with the player color hex via mask-image', () => {
    render(<ProbeToken playerColor='purple' />);

    const token = screen.getByRole('img', { name: 'purple probe' });
    expect(token).toHaveStyle({ backgroundColor: '#801da1' });
    expect(token.style.maskImage || token.style.webkitMaskImage).toContain(
      '/assets/seti/tokens/probes/whiteProbe.png',
    );
  });

  it('passes through hex literals (debug fixtures keep working)', () => {
    render(<ProbeToken playerColor='#abc123' />);

    const token = screen.getByRole('img', { name: '#abc123 probe' });
    expect(token).toHaveStyle({ backgroundColor: '#abc123' });
  });
});
