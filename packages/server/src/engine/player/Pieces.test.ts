import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { EPieceType, Pieces } from './Pieces.js';

describe('Pieces', () => {
  it('uses default inventory when omitted', () => {
    const pieces = new Pieces();
    expect(pieces.available(EPieceType.PROBE)).toBeGreaterThan(0);
    expect(pieces.available(EPieceType.SECTOR_MARKER)).toBeGreaterThan(0);
  });

  it('rejects invalid inventory amounts', () => {
    expect(
      () =>
        new Pieces({
          [EPieceType.PROBE]: -1,
        }),
    ).toThrow(GameError);
  });

  it('deploys and returns pieces while tracking availability', () => {
    const pieces = new Pieces({
      [EPieceType.PROBE]: 2,
      [EPieceType.ORBITER]: 1,
      [EPieceType.LANDER]: 1,
      [EPieceType.SECTOR_MARKER]: 3,
    });

    pieces.deploy(EPieceType.PROBE);
    expect(pieces.available(EPieceType.PROBE)).toBe(1);
    expect(pieces.deployed(EPieceType.PROBE)).toBe(1);

    pieces.return(EPieceType.PROBE);
    expect(pieces.available(EPieceType.PROBE)).toBe(2);
    expect(pieces.deployed(EPieceType.PROBE)).toBe(0);
  });

  it('throws when deploying unavailable piece', () => {
    const pieces = new Pieces({
      [EPieceType.PROBE]: 1,
      [EPieceType.ORBITER]: 1,
      [EPieceType.LANDER]: 1,
      [EPieceType.SECTOR_MARKER]: 1,
    });

    pieces.deploy(EPieceType.PROBE);
    expect(() => pieces.deploy(EPieceType.PROBE)).toThrow(GameError);
  });

  it('throws when returning non-deployed piece', () => {
    const pieces = new Pieces({
      [EPieceType.PROBE]: 1,
      [EPieceType.ORBITER]: 1,
      [EPieceType.LANDER]: 1,
      [EPieceType.SECTOR_MARKER]: 1,
    });

    expect(() => pieces.return(EPieceType.ORBITER)).toThrow(GameError);
    try {
      pieces.return(EPieceType.ORBITER);
    } catch (error) {
      const gameError = error as GameError;
      expect(gameError.code).toBe(EErrorCode.INVALID_ACTION);
    }
  });
});
