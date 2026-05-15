import { EOrganizationId } from '@seti/common/types/organization';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import { SelectOption } from '../../input/SelectOption.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { Organization } from '../Organization.js';

interface IOrbitalMoveOption {
  id: string;
  label: string;
  probeId: string;
  fromSpaceId: string;
  toSpaceId: string;
}

export class OrbitalDynamics extends Organization {
  public constructor() {
    super(EOrganizationId.ORBITAL_DYNAMICS);
  }

  public override hasImplementedPower(): boolean {
    return true;
  }

  public override canUsePower(player: IPlayer, game: IGame): boolean {
    return this.buildMoveOptions(player, game, new Set()).length > 0;
  }

  public override usePower(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
    const input = this.createMoveInput(player, game, new Set(), true);
    if (!input) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'Orbital Dynamics has no movable probes',
        { playerId: player.id },
      );
    }
    return input;
  }

  protected override applyPlayerConfig(player: IPlayer, _game: IGame): void {
    player.probeSpaceLimit = Math.max(player.probeSpaceLimit, 2);
  }

  private createMoveInput(
    player: IPlayer,
    game: IGame,
    movedProbeIds: Set<string>,
    requireMove: boolean,
  ): IPlayerInput | undefined {
    const moveOptions = this.buildMoveOptions(player, game, movedProbeIds);
    if (moveOptions.length === 0 && !requireMove) {
      return undefined;
    }

    const options = moveOptions.map((move) => ({
      id: move.id,
      label: move.label,
      onSelect: () => this.moveProbe(player, game, move, movedProbeIds),
    }));
    if (!requireMove) {
      options.unshift({
        id: 'done',
        label: 'Done',
        onSelect: () => undefined,
      });
    }

    return new SelectOption(player, options, 'Choose an Orbital Dynamics move');
  }

  private moveProbe(
    player: IPlayer,
    game: IGame,
    move: IOrbitalMoveOption,
    movedProbeIds: Set<string>,
  ): IPlayerInput | undefined {
    if (!game.solarSystem) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Solar system not initialized',
      );
    }

    const result = game.solarSystem.moveProbe(
      move.probeId,
      move.fromSpaceId,
      move.toSpaceId,
    );
    if (result.publicityGained > 0) {
      player.resources.gain({ publicity: result.publicityGained });
    }

    const nextMovedProbeIds = new Set(movedProbeIds);
    nextMovedProbeIds.add(move.probeId);
    player.oncePerRoundUsed[this.id] = true;

    if (nextMovedProbeIds.size >= 2) {
      return undefined;
    }
    return this.createMoveInput(player, game, nextMovedProbeIds, false);
  }

  private buildMoveOptions(
    player: IPlayer,
    game: IGame,
    movedProbeIds: Set<string>,
  ): IOrbitalMoveOption[] {
    if (!game.solarSystem) return [];

    const moves: IOrbitalMoveOption[] = [];
    for (const space of game.solarSystem.spaces) {
      for (const probe of space.occupants) {
        if (probe.playerId !== player.id || movedProbeIds.has(probe.id)) {
          continue;
        }
        for (const adjacent of game.solarSystem.getAdjacentSpaces(space.id)) {
          moves.push({
            id: `${probe.id}:${adjacent.id}`,
            label: `${probe.id} to ${adjacent.id}`,
            probeId: probe.id,
            fromSpaceId: space.id,
            toSpaceId: adjacent.id,
          });
        }
      }
    }
    return moves;
  }
}
