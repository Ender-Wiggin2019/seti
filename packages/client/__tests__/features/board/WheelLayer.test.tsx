import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WheelLayer } from '@/features/board/WheelLayer';

describe('WheelLayer', () => {
  it('applies 45-degree rotation steps', () => {
    render(<WheelLayer ring={2} angle={2} />);

    const ring = screen.getByTestId('wheel-layer-ring-2');
    expect(ring.style.transform).toContain('rotate(-90deg)');
  });

  it('keeps rotation continuous when wrapped angle crosses 7 -> 0', () => {
    const { rerender } = render(<WheelLayer ring={1} angle={7} />);

    const ring = screen.getByTestId('wheel-layer-ring-1');
    expect(ring.style.transform).toContain('rotate(-315deg)');

    rerender(<WheelLayer ring={1} angle={0} />);

    expect(ring.style.transform).toContain('rotate(-360deg)');
  });
});
