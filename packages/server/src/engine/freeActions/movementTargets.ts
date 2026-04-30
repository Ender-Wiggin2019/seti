import type { TMovementTarget } from '@seti/common/types/protocol/actions';
import { EAlienType } from '@seti/common/types/protocol/enums';
import type { ISolarProbe, ISolarSystemSpace } from '../board/SolarSystem.js';
import type { IGame } from '../IGame.js';

export interface IMovementStepResult {
  pieceId: string;
  publicityGained: number;
}

export interface IMovablePieceRuntime {
  pieceId: string;
  playerId: string;
  spaceId: string;
  target: TMovementTarget;
  legacyResult?: { capsuleId?: string };
  moveStep(
    game: IGame,
    fromSpaceId: string,
    toSpaceId: string,
    toSpace: ISolarSystemSpace | undefined,
  ): IMovementStepResult;
}

interface IMascamitesCapsuleLike {
  capsuleId: string;
  ownerId: string;
  spaceId: string;
}

interface IMascamitesCapsuleBoardLike {
  capsules: IMascamitesCapsuleLike[];
}

class ProbeMovementPiece implements IMovablePieceRuntime {
  public readonly pieceId: string;
  public readonly playerId: string;
  public readonly target: TMovementTarget;

  public constructor(
    private readonly probe: ISolarProbe,
    public spaceId: string,
  ) {
    this.pieceId = probe.id;
    this.playerId = probe.playerId;
    this.target = { type: 'probe', id: probe.id };
  }

  public moveStep(
    game: IGame,
    fromSpaceId: string,
    toSpaceId: string,
  ): IMovementStepResult {
    const result = game.solarSystem!.moveProbe(
      this.probe.id,
      fromSpaceId,
      toSpaceId,
    );
    this.spaceId = toSpaceId;
    return {
      pieceId: result.probeId,
      publicityGained: result.publicityGained,
    };
  }
}

class MascamitesCapsuleMovementPiece implements IMovablePieceRuntime {
  public readonly pieceId: string;
  public readonly playerId: string;
  public readonly target: TMovementTarget;
  public readonly legacyResult: { capsuleId: string };

  public constructor(
    private readonly capsule: IMascamitesCapsuleLike,
    public spaceId: string,
  ) {
    this.pieceId = capsule.capsuleId;
    this.playerId = capsule.ownerId;
    this.target = { type: 'mascamites-capsule', id: capsule.capsuleId };
    this.legacyResult = { capsuleId: capsule.capsuleId };
  }

  public moveStep(
    _game: IGame,
    _fromSpaceId: string,
    toSpaceId: string,
    toSpace: ISolarSystemSpace | undefined,
  ): IMovementStepResult {
    this.capsule.spaceId = toSpaceId;
    this.spaceId = toSpaceId;
    return {
      pieceId: this.capsule.capsuleId,
      publicityGained: getPublicityOnEnter(toSpace),
    };
  }
}

export function findPlayerMovablePieces(
  game: IGame,
  playerId: string,
): IMovablePieceRuntime[] {
  return [
    ...findPlayerProbePieces(game, playerId),
    ...findPlayerMascamitesCapsulePieces(game, playerId),
  ];
}

export function resolveMovementTarget(
  game: IGame,
  playerId: string,
  target: TMovementTarget,
): IMovablePieceRuntime | undefined {
  return findPlayerMovablePieces(game, playerId).find(
    (piece) =>
      piece.target.type === target.type && piece.target.id === target.id,
  );
}

export function findLegacyProbeMovementPieceAtSpace(
  game: IGame,
  playerId: string,
  spaceId: string,
): IMovablePieceRuntime | undefined {
  return findPlayerProbePieces(game, playerId).find(
    (piece) => piece.spaceId === spaceId,
  );
}

function findPlayerProbePieces(
  game: IGame,
  playerId: string,
): IMovablePieceRuntime[] {
  if (game.solarSystem === null) {
    return [];
  }

  const pieces: IMovablePieceRuntime[] = [];
  for (const space of game.solarSystem.spaces) {
    for (const probe of space.occupants) {
      if (probe.playerId === playerId) {
        pieces.push(new ProbeMovementPiece(probe, space.id));
      }
    }
  }
  return pieces;
}

function findPlayerMascamitesCapsulePieces(
  game: IGame,
  playerId: string,
): IMovablePieceRuntime[] {
  const board = getMascamitesCapsuleBoard(game);
  if (!board) {
    return [];
  }

  return board.capsules
    .filter((capsule) => capsule.ownerId === playerId)
    .map(
      (capsule) => new MascamitesCapsuleMovementPiece(capsule, capsule.spaceId),
    );
}

function getMascamitesCapsuleBoard(
  game: IGame,
): IMascamitesCapsuleBoardLike | undefined {
  const alienState = (
    game as {
      alienState?: {
        getBoardByType?: (alienType: EAlienType) => unknown;
      };
    }
  ).alienState;
  const board = alienState?.getBoardByType?.(EAlienType.MASCAMITES);
  if (!isMascamitesCapsuleBoardLike(board)) {
    return undefined;
  }
  return board;
}

function isMascamitesCapsuleBoardLike(
  board: unknown,
): board is IMascamitesCapsuleBoardLike {
  return (
    typeof board === 'object' &&
    board !== null &&
    Array.isArray((board as { capsules?: unknown }).capsules) &&
    (board as { capsules: unknown[] }).capsules.every(isMascamitesCapsuleLike)
  );
}

function isMascamitesCapsuleLike(
  capsule: unknown,
): capsule is IMascamitesCapsuleLike {
  if (typeof capsule !== 'object' || capsule === null) {
    return false;
  }
  const candidate = capsule as Partial<IMascamitesCapsuleLike>;
  return (
    typeof candidate.capsuleId === 'string' &&
    typeof candidate.ownerId === 'string' &&
    typeof candidate.spaceId === 'string'
  );
}

function getPublicityOnEnter(space: ISolarSystemSpace | undefined): number {
  if (!space?.hasPublicityIcon) {
    return 0;
  }
  return Math.max(1, Math.trunc(space.publicityIconAmount ?? 1));
}
