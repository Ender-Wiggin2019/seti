import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import nextI18NextConfig from '../../next-i18next.config';

const mockI18n = { language: 'en' };

jest.mock('next-i18next', () => ({
  appWithTranslation: jest.fn((Component) => Component),
  useTranslation: jest.fn(() => ({ i18n: mockI18n })),
}));

jest.mock('next/script', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('react-i18next', () => ({
  I18nextProvider: jest.fn(() => null),
}));

function loadApp() {
  let App: ((props: AppProps) => React.ReactElement) | undefined;

  jest.isolateModules(() => {
    App = require('../pages/_app').default;
  });

  if (!App) {
    throw new Error('Failed to load app');
  }

  return App;
}

function collectElementProps(
  node: React.ReactNode,
  type: React.ElementType,
): Record<string, unknown>[] {
  if (!React.isValidElement(node)) {
    return [];
  }

  const props = node.props as { children?: React.ReactNode };
  const nestedProps = React.Children.toArray(props.children).flatMap((child) =>
    collectElementProps(child, type),
  );

  if (node.type === type) {
    return [props as Record<string, unknown>, ...nestedProps];
  }

  return nestedProps;
}

describe('MyApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes the next-i18next config into appWithTranslation', () => {
    loadApp();

    expect(appWithTranslation).toHaveBeenCalledWith(
      expect.any(Function),
      nextI18NextConfig,
    );
  });

  it('provides the next-i18next instance to direct react-i18next consumers', () => {
    const App = loadApp();

    const tree = App({
      Component: () => <div>page</div>,
      pageProps: {},
      router: {} as AppProps['router'],
    });

    const providerProps = collectElementProps(tree, I18nextProvider);

    expect(providerProps).toEqual([
      expect.objectContaining({ i18n: mockI18n }),
    ]);
  });
});
