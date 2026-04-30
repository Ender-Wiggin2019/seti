import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SelectPlanetInput } from '@/features/input/SelectPlanetInput';
import { EPlanet, EPlayerInputType } from '@/types/re-exports';

describe('SelectPlanetInput', () => {
  it('renders planets and submits selected planet', () => {
    const onSubmit = vi.fn();
    render(
      <SelectPlanetInput
        model={{
          inputId: 'input-planet',
          type: EPlayerInputType.PLANET,
          options: [EPlanet.MARS, EPlanet.JUPITER],
        }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: EPlanet.JUPITER }));
    expect(onSubmit).toHaveBeenCalledWith({
      type: EPlayerInputType.PLANET,
      planet: EPlanet.JUPITER,
    });
  });
});
