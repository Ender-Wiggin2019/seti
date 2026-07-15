import { render, screen, within } from '@testing-library/react';
import React from 'react';
import HomePage from '../pages/index';

const mockSettings = { enableAlien: true };
const mockSetSettings = jest.fn();

jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
  }),
}));

jest.mock('@/components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='layout'>{children}</div>
  ),
}));

jest.mock('@/components/Seo', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: mockSettings,
    setSettings: mockSetSettings,
  }),
}));

jest.mock('@/components/cards/base_cards/BaseCardList', () => ({
  BaseCardList: () => <div data-testid='base-card-list' />,
}));

jest.mock('@/components/filters/AdvancedFilter', () => ({
  AdvancedFilter: () => <div data-testid='advanced-filter' />,
}));

jest.mock('@/components/filters/AlienFilter', () => ({
  AlienFilter: () => <div data-testid='alien-filter' />,
}));

jest.mock('@/components/filters/CardSourceFilter', () => ({
  CardSourceFilter: () => <div data-testid='card-source-filter' />,
}));

jest.mock('@/components/filters/CreditFilter', () => ({
  CreditFilter: () => <div data-testid='credit-filter' />,
}));

jest.mock('@/components/filters/FreeActionFilter', () => ({
  ResourceFilter: () => <div data-testid='resource-filter' />,
}));

jest.mock('@/components/filters/IconFilter', () => ({
  IconFilter: () => <div data-testid='icon-filter' />,
}));

jest.mock('@/components/filters/SectorFilter', () => ({
  SectorFilter: () => <div data-testid='sector-filter' />,
}));

jest.mock('@/components/filters/TextFilter', () => ({
  TextFilter: () => <input aria-label='Filter text' />,
}));

jest.mock('@/components/buttons/SortButton', () => ({
  SortButton: () => <button type='button'>Sort</button>,
}));

jest.mock('@/components/ui/CardOdometer', () => ({
  CardOdometer: ({ name }: { name: string }) => <div>{name}</div>,
}));

jest.mock('@/components/ui/enable-alien-dialog', () => ({
  SettingsDialogButton: () => <button type='button'>Enable alien</button>,
}));

describe('HomePage', () => {
  beforeEach(() => {
    mockSetSettings.mockClear();
  });

  it('keeps alien filters above the desktop filter rail and results panel', () => {
    render(<HomePage />);

    expect(screen.getByTestId('home-explorer-layout')).not.toBeNull();

    const alienFilterBar = screen.getByTestId('home-alien-filter-bar');
    const controlGrid = screen.getByTestId('home-control-grid');
    const filterPanel = within(controlGrid).getByTestId('home-filter-panel');
    expect(filterPanel.tagName).toBe('ASIDE');
    expect(alienFilterBar.contains(screen.getByTestId('alien-filter'))).toBe(
      true,
    );
    expect(filterPanel.contains(screen.getByTestId('alien-filter'))).toBe(
      false,
    );

    const resultsPanel = within(controlGrid).getByTestId('home-results-panel');
    expect(resultsPanel.contains(screen.getByTestId('base-card-list'))).toBe(
      true,
    );
    expect(
      within(resultsPanel).getByRole('button', { name: 'Reset' }),
    ).not.toBeNull();
  });
});
