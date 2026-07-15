import { describe, expect, it } from 'vitest';
import { normalizeRivalBoardConfigId } from '@/constant/solo';

describe('solo constants', () => {
  it('accepts canonical rival board ids', () => {
    expect(normalizeRivalBoardConfigId('rival-board-4')).toBe('rival-board-4');
  });

  it('rejects non-canonical rival board ids', () => {
    expect(() => normalizeRivalBoardConfigId('automaBoard4')).toThrow(
      'Unknown rival board config id: automaBoard4',
    );
    expect(() => normalizeRivalBoardConfigId('unknown-rival-board')).toThrow(
      'Unknown rival board config id: unknown-rival-board',
    );
  });
});
