import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { describe, expect, it } from 'vitest';
import {
  normalizeGameStateCards,
  normalizePlayerInputCards,
} from '@/lib/cardNormalization';
import { createMockGameState } from '../../test/mocks/gameState';

describe('cardNormalization', () => {
  it('normalizes id-only cards in projected game state', () => {
    const state = createMockGameState({
      cardRow: ['8'] as never,
      players: [
        {
          ...createMockGameState().players[0],
          hand: ['80'] as never,
          playedMissions: ['16'] as never,
        },
        createMockGameState().players[1],
      ],
    });

    const normalized = normalizeGameStateCards(state);

    expect(normalized.cardRow[0]?.id).toBe('8');
    expect(normalized.cardRow[0]?.name).toBeTruthy();
    expect(normalized.players[0]?.hand?.[0]?.id).toBe('80');
    expect(normalized.players[0]?.hand?.[0]?.name).toBeTruthy();
    expect(normalized.players[0]?.playedMissions?.[0]?.id).toBe('16');
  });

  it('normalizes id-only cards in pending input models (including nested options)', () => {
    const input = {
      inputId: 'root',
      type: EPlayerInputType.OR,
      options: [
        {
          inputId: 'card-prompt',
          type: EPlayerInputType.CARD,
          cards: [{ id: '8' }, { id: '16' }],
          minSelections: 1,
          maxSelections: 1,
        },
      ],
    } as never;

    const normalized = normalizePlayerInputCards(input);
    if (normalized.type !== EPlayerInputType.OR) {
      throw new Error('Expected OR input');
    }

    const nested = normalized.options[0];
    if (nested.type !== EPlayerInputType.CARD) {
      throw new Error('Expected CARD input');
    }

    expect(nested.cards[0]?.id).toBe('8');
    expect(nested.cards[0]?.name).toBeTruthy();
    expect(nested.cards[1]?.id).toBe('16');
  });
});
