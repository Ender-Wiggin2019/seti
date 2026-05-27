import '@testing-library/jest-dom/vitest';
import { createElement } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import '@/i18n';
import { server } from './mocks/server';

function ensureLocalStorage(): void {
  if (
    typeof window === 'undefined' ||
    typeof window.localStorage?.clear === 'function'
  ) {
    return;
  }

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: createMemoryStorage(),
  });
}

function clearLocalStorage(): void {
  ensureLocalStorage();
  window.localStorage.clear();
}

function createMemoryStorage(): Storage {
  const entries = new Map<string, string>();

  return {
    get length() {
      return entries.size;
    },
    clear() {
      entries.clear();
    },
    getItem(key: string) {
      return entries.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(entries.keys())[index] ?? null;
    },
    removeItem(key: string) {
      entries.delete(key);
    },
    setItem(key: string, value: string) {
      entries.set(key, value);
    },
  };
}

vi.mock('@seti/cards', () => ({
  CardRender: ({ card }: { card: { id: string; name: string } }) =>
    createElement('div', { 'data-testid': `seti-card-${card.id}` }, card.name),
  PreludeCard: ({
    card,
  }: {
    card: {
      id: string;
      upperEffects?: Array<{ type?: string; value?: number }>;
      lowerEffects?: Array<{ type?: string; value?: number }>;
    };
  }) =>
    createElement(
      'div',
      { 'data-testid': `seti-prelude-card-${card.id}` },
      card.id,
      [...(card.upperEffects ?? []), ...(card.lowerEffects ?? [])].map(
        (effect, index) =>
          createElement('div', {
            key: `${card.id}-${index}`,
            'data-testid': `seti-effect-${effect.type ?? 'unknown'}`,
            'data-value': effect.value,
          }),
      ),
    ),
  IconFactory: ({ iconItem }: { iconItem: { type: string; value?: number } }) =>
    createElement('div', {
      'data-testid': `seti-icon-${iconItem.type}`,
      'data-value': iconItem.value,
    }),
  EffectFactory: ({ effect }: { effect: { type?: string; value?: number } }) =>
    createElement('div', {
      'data-testid': `seti-effect-${effect.type ?? 'unknown'}`,
      'data-value': effect.value,
    }),
  DescRender: ({ desc }: { desc: string }) =>
    createElement('div', {
      'data-testid': `seti-desc-${desc.replace(/[{}]/g, '')}`,
    }),
  TagIcon: ({ type }: { type: string }) =>
    createElement('div', { 'data-testid': `seti-tag-${type}` }),
  // CardContext stubs — production wires per-card claim flags through
  // these but tests don't exercise the rendering path; pass-through
  // provider + null context keep <CardRender> consumers happy.
  CardRenderContextProvider: ({ children }: { children: unknown }) =>
    createElement('div', null, children as never),
  useCardRenderContext: () => null,
}));

beforeAll(() => {
  ensureLocalStorage();
  server.listen({ onUnhandledRequest: 'error' });
});

beforeEach(() => {
  clearLocalStorage();
});

afterEach(() => {
  clearLocalStorage();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
