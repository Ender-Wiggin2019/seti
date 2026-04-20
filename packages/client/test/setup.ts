import '@testing-library/jest-dom/vitest';
import { createElement } from 'react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import '@/i18n';
import { server } from './mocks/server';

vi.mock('@seti/cards', () => ({
  CardRender: ({ card }: { card: { id: string; name: string } }) =>
    createElement('div', { 'data-testid': `seti-card-${card.id}` }, card.name),
}));

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
