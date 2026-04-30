import { EAlienType } from '@seti/common/types/BaseCard';
import { fireEvent, render, screen } from '@testing-library/react';
import { AlienFilter } from '../AlienFilter';

jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const allImplementedAliens = [
  EAlienType.ANOMALIES,
  EAlienType.CENTAURIANS,
  EAlienType.EXERTIANS,
  EAlienType.MASCAMITES,
  EAlienType.OUMUAMUA,
  EAlienType.AMOEBA,
  EAlienType.GLYPHIDS,
];

describe('AlienFilter', () => {
  it('renders alien image buttons in banner order with an Ark placeholder', () => {
    render(
      <AlienFilter
        alienTypes={allImplementedAliens}
        onFilterChange={jest.fn()}
        reset={false}
      />,
    );

    const buttons = screen.getAllByRole('button');

    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'centaurians',
      'glyphids',
      'anomalies',
      'oumuamua',
      'mascamites',
      'exertians',
      'ark',
      'amoeba',
    ]);

    expect(
      screen.getByRole('button', { name: 'centaurians' }).className,
    ).toContain('alien-filter__image--centaurians');
    expect(screen.getByRole('button', { name: 'ark' }).className).toContain(
      'alien-filter__button--placeholder',
    );
    expect(screen.getByRole('button', { name: 'ark' }).className).toContain(
      'alien-filter__image--ark',
    );
    expect(screen.queryByText('BETA')).toBeNull();
  });

  it('dims unselected image buttons and restores brightness when selected', () => {
    const onFilterChange = jest.fn();
    render(
      <AlienFilter
        alienTypes={allImplementedAliens}
        onFilterChange={onFilterChange}
        reset={false}
      />,
    );

    const centaurians = screen.getByRole('button', { name: 'centaurians' });
    const ark = screen.getByRole('button', { name: 'ark' });

    expect(centaurians.getAttribute('aria-pressed')).toBe('false');
    expect(centaurians.className).toContain('alien-filter__button');
    expect(centaurians.className).not.toContain(
      'alien-filter__button--selected',
    );
    expect((ark as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(ark);
    expect(onFilterChange).toHaveBeenCalledTimes(1);

    fireEvent.click(centaurians);
    expect(onFilterChange).toHaveBeenLastCalledWith([EAlienType.CENTAURIANS]);
    expect(centaurians.getAttribute('aria-pressed')).toBe('true');
    expect(centaurians.className).toContain('alien-filter__button--selected');
  });
});
