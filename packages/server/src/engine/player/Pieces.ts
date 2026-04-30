import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';

export enum EPieceType {
  PROBE = 'PROBE',
  ORBITER = 'ORBITER',
  LANDER = 'LANDER',
  SECTOR_MARKER = 'SECTOR_MARKER',
}

export interface IPieceInventory {
  [EPieceType.PROBE]: number;
  [EPieceType.ORBITER]: number;
  [EPieceType.LANDER]: number;
  [EPieceType.SECTOR_MARKER]: number;
}

const DEFAULT_PIECE_INVENTORY: IPieceInventory = {
  [EPieceType.PROBE]: 10,
  [EPieceType.ORBITER]: 10,
  [EPieceType.LANDER]: 10,
  [EPieceType.SECTOR_MARKER]: 20,
};

function assertValidPieceAmount(pieceType: EPieceType, amount: number): void {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new GameError(
      EErrorCode.VALIDATION_ERROR,
      'Piece amount must be a non-negative integer',
      { pieceType, amount },
    );
  }
}

function createZeroInventory(): IPieceInventory {
  return {
    [EPieceType.PROBE]: 0,
    [EPieceType.ORBITER]: 0,
    [EPieceType.LANDER]: 0,
    [EPieceType.SECTOR_MARKER]: 0,
  };
}

export class Pieces {
  private totalInventory: IPieceInventory;

  private deployedInventory: IPieceInventory;

  public constructor(
    inventory: Partial<IPieceInventory> = DEFAULT_PIECE_INVENTORY,
  ) {
    this.totalInventory = {
      [EPieceType.PROBE]:
        inventory[EPieceType.PROBE] ??
        DEFAULT_PIECE_INVENTORY[EPieceType.PROBE],
      [EPieceType.ORBITER]:
        inventory[EPieceType.ORBITER] ??
        DEFAULT_PIECE_INVENTORY[EPieceType.ORBITER],
      [EPieceType.LANDER]:
        inventory[EPieceType.LANDER] ??
        DEFAULT_PIECE_INVENTORY[EPieceType.LANDER],
      [EPieceType.SECTOR_MARKER]:
        inventory[EPieceType.SECTOR_MARKER] ??
        DEFAULT_PIECE_INVENTORY[EPieceType.SECTOR_MARKER],
    };
    for (const pieceType of Object.values(EPieceType)) {
      assertValidPieceAmount(pieceType, this.totalInventory[pieceType]);
    }
    this.deployedInventory = createZeroInventory();
  }

  public deploy(pieceType: EPieceType): void {
    if (this.available(pieceType) <= 0) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'No available piece to deploy',
        {
          pieceType,
        },
      );
    }
    this.deployedInventory[pieceType] += 1;
  }

  public return(pieceType: EPieceType): void {
    if (this.deployedInventory[pieceType] <= 0) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'No deployed piece available to return',
        { pieceType },
      );
    }
    this.deployedInventory[pieceType] -= 1;
  }

  public available(pieceType: EPieceType): number {
    return this.totalInventory[pieceType] - this.deployedInventory[pieceType];
  }

  public deployed(pieceType: EPieceType): number {
    return this.deployedInventory[pieceType];
  }
}
