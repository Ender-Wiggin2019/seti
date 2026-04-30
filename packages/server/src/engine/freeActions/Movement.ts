import { validateMovementPath } from '@seti/common/rules/freeActions';
import type {
  IInputResponse,
  TMovementTarget,
} from '@seti/common/types/protocol/actions';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import type { IPlayerInputModel } from '@seti/common/types/protocol/playerInput';
import { GameError } from '@/shared/errors/GameError.js';
import { isMovementPublicityDisabledForCurrentTurn } from '../alien/plugins/AnomaliesTurnEffects.js';
import { ESolarSystemElementType } from '../board/SolarSystem.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import { EMissionEventType } from '../missions/IMission.js';
import type { IPlayer } from '../player/IPlayer.js';
import { TechModifierQuery } from '../tech/TechModifierQuery.js';
import {
  emitMovementStepTurnEvent,
  shouldIgnoreAsteroidLeaveCostForTurnEffects,
} from '../turnEffects/TurnEffects.js';
import { toPublicSolarSystemState } from '../utils/stateProjection.js';
import {
  findLegacyProbeMovementPieceAtSpace,
  findPlayerMovablePieces,
  resolveMovementTarget,
} from './movementTargets.js';

export interface IMovementResult {
  probeId: string;
  capsuleId?: string;
  path: string[];
  totalCost: number;
  publicityGained: number;
  pendingInput?: IPlayerInput;
}

export interface IMovementOptions {
  target?: TMovementTarget;
  /** @deprecated Use target: { type: 'mascamites-capsule', id } instead. */
  capsuleId?: string;
}

interface IPublicityRecord {
  publicityGained: number;
}

class MovementPendingInput implements IPlayerInput {
  public constructor(
    private readonly input: IPlayerInput,
    private readonly remainingInputs: readonly IPlayerInput[],
    private readonly onComplete: () => void,
  ) {}

  public get inputId(): string {
    return this.input.inputId;
  }

  public get type(): IPlayerInput['type'] {
    return this.input.type;
  }

  public get player(): IPlayer {
    return this.input.player;
  }

  public get title(): string | undefined {
    return this.input.title;
  }

  public toModel(): IPlayerInputModel {
    return this.input.toModel();
  }

  public process(response: IInputResponse): IPlayerInput | undefined {
    const nextInput = this.input.process(response);
    if (nextInput !== undefined) {
      return new MovementPendingInput(
        nextInput,
        this.remainingInputs,
        this.onComplete,
      );
    }

    const [nextMovementInput, ...rest] = this.remainingInputs;
    if (nextMovementInput !== undefined) {
      return new MovementPendingInput(nextMovementInput, rest, this.onComplete);
    }

    this.onComplete();
    return undefined;
  }
}

export class MovementFreeAction {
  static canExecute(
    player: IPlayer,
    game: IGame,
    options: IMovementOptions = {},
  ): boolean {
    if (game.solarSystem === null) return false;

    const target = this.normalizeMovementTarget(options);
    const hasMovementTarget = target
      ? resolveMovementTarget(game, player.id, target) !== undefined
      : findPlayerMovablePieces(game, player.id).length > 0;

    if (!hasMovementTarget) {
      return false;
    }

    return player.getMoveStash() > 0 || player.resources.energy > 0;
  }

  static execute(
    player: IPlayer,
    game: IGame,
    path: string[],
    options: IMovementOptions = {},
  ): IMovementResult {
    if (game.solarSystem === null) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Solar system not initialized',
      );
    }

    if (path.length < 2) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Movement path must have at least 2 spaces',
      );
    }

    const startSpaceId = path[0];
    const target = this.normalizeMovementTarget(options);
    const movementPiece =
      target !== undefined
        ? resolveMovementTarget(game, player.id, target)
        : findLegacyProbeMovementPieceAtSpace(game, player.id, startSpaceId);
    if (!movementPiece) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        `No movable piece found for player ${player.id}`,
        { playerId: player.id, spaceId: startSpaceId, target },
      );
    }
    if (movementPiece.spaceId !== startSpaceId) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        `Movement target ${movementPiece.target.type}:${movementPiece.target.id} is not at space ${startSpaceId}`,
        {
          playerId: player.id,
          spaceId: startSpaceId,
          target: movementPiece.target,
        },
      );
    }

    const publicState = toPublicSolarSystemState(game.solarSystem);
    const validation = validateMovementPath(publicState, path);

    if (!validation.valid) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        `Invalid movement path: ${validation.errors.join(', ')}`,
        { path, errors: validation.errors },
      );
    }

    const effectiveCost = this.getEffectiveMovementCost(player, game, path);

    if (effectiveCost > player.getMoveStash()) {
      throw new GameError(
        EErrorCode.INSUFFICIENT_RESOURCES,
        'Not enough movement points',
        {
          required: effectiveCost,
          available: player.getMoveStash(),
        },
      );
    }

    const techQuery = TechModifierQuery.fromTechIds(player.techs);
    const publicityRecords: IPublicityRecord[] = [];
    const pendingInputs: IPlayerInput[] = [];
    const movementPublicityDisabled = isMovementPublicityDisabledForCurrentTurn(
      game,
      player.id,
    );
    for (let i = 0; i < path.length - 1; i++) {
      const fromSpace = this.findSpace(game, path[i]);
      const toSpace = this.findSpace(game, path[i + 1]);
      const result = movementPiece.moveStep(
        game,
        path[i],
        path[i + 1],
        toSpace,
      );
      this.recordVisitEvents(game, path[i + 1]);

      let stepPublicity = movementPublicityDisabled
        ? 0
        : result.publicityGained;

      if (
        techQuery.hasAsteroidPublicity() &&
        this.isAsteroidSpace(game, path[i + 1]) &&
        !movementPublicityDisabled
      ) {
        stepPublicity += 1;
      }

      let publicityRecord: IPublicityRecord = {
        publicityGained: stepPublicity,
      };
      if (fromSpace && toSpace) {
        const event = {
          fromSpace,
          toSpace,
          publicityGained: stepPublicity,
        };
        publicityRecord = event;
        const pendingInput = emitMovementStepTurnEvent(game, player, event);
        if (pendingInput !== undefined) {
          pendingInputs.push(pendingInput);
        }
      }

      publicityRecords.push(publicityRecord);
    }

    player.spendMove(effectiveCost);

    const gainMovementPublicity = () => {
      const totalPublicity = publicityRecords.reduce(
        (total, record) => total + record.publicityGained,
        0,
      );
      if (totalPublicity > 0) {
        player.resources.gain({ publicity: totalPublicity });
      }
    };

    const publicityGained = publicityRecords.reduce(
      (total, record) => total + record.publicityGained,
      0,
    );

    if (pendingInputs.length === 0) {
      gainMovementPublicity();
    }

    const [firstPendingInput, ...remainingPendingInputs] = pendingInputs;

    return {
      probeId: movementPiece.pieceId,
      capsuleId: movementPiece.legacyResult?.capsuleId,
      path,
      totalCost: effectiveCost,
      publicityGained,
      pendingInput:
        firstPendingInput !== undefined
          ? new MovementPendingInput(
              firstPendingInput,
              remainingPendingInputs,
              gainMovementPublicity,
            )
          : undefined,
    };
  }

  private static getEffectiveMovementCost(
    player: IPlayer,
    game: IGame,
    path: string[],
  ): number {
    const asteroidLeaveCost = shouldIgnoreAsteroidLeaveCostForTurnEffects(
      game,
      player.id,
    )
      ? 0
      : TechModifierQuery.fromTechIds(player.techs).getAsteroidLeaveCost(1);

    let totalCost = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const fromSpace = game.solarSystem?.spaces.find((s) => s.id === path[i]);
      const fromIsAsteroid =
        fromSpace?.elements.some(
          (element) =>
            element.type === ESolarSystemElementType.ASTEROID &&
            element.amount > 0,
        ) ?? false;
      totalCost += 1 + (fromIsAsteroid ? asteroidLeaveCost : 0);
    }

    return totalCost;
  }

  private static isAsteroidSpace(game: IGame, spaceId: string): boolean {
    const space = this.findSpace(game, spaceId);
    if (!space) {
      return false;
    }

    return space.elements.some(
      (element) =>
        element.type === ESolarSystemElementType.ASTEROID && element.amount > 0,
    );
  }

  private static normalizeMovementTarget(
    options: IMovementOptions,
  ): TMovementTarget | undefined {
    if (options.target) {
      return options.target;
    }
    if (options.capsuleId !== undefined) {
      return { type: 'mascamites-capsule', id: options.capsuleId };
    }
    return undefined;
  }

  private static findSpace(game: IGame, spaceId: string) {
    return game.solarSystem?.spaces.find(
      (candidate) => candidate.id === spaceId,
    );
  }

  private static recordVisitEvents(game: IGame, spaceId: string): void {
    const space = game.solarSystem?.spaces.find(
      (candidate) => candidate.id === spaceId,
    );
    if (!space) {
      return;
    }

    for (const element of space.elements) {
      if (
        (element.type === ESolarSystemElementType.PLANET ||
          element.type === ESolarSystemElementType.EARTH) &&
        element.planet
      ) {
        game.missionTracker.recordEvent({
          type: EMissionEventType.PROBE_VISITED_PLANET,
          planet: element.planet,
        });
      }
      if (
        element.type === ESolarSystemElementType.ASTEROID &&
        element.amount > 0
      ) {
        game.missionTracker.recordEvent({
          type: EMissionEventType.PROBE_VISITED_ASTEROIDS,
        });
      }
    }
  }
}
