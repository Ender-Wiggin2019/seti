import { ETrace } from '@seti/common/types/element';
import { EOrganizationId } from '@seti/common/types/organization';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { ResearchTechAction } from '../../actions/ResearchTech.js';
import { LaunchProbeEffect } from '../../effects/probe/LaunchProbeEffect.js';
import { ScanEffect } from '../../effects/scan/ScanEffect.js';
import { EGameRuntimeEvent } from '../../events/GameEventBus.js';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import { EMissionEventType } from '../../missions/IMission.js';
import type { IPlayer } from '../../player/IPlayer.js';
import type { IOrganizationMainActionPayload } from '../Organization.js';
import { Organization } from '../Organization.js';

type TXenolabTile = 'launch' | 'scan' | 'research';

interface IXenolabState {
  tiles?: Partial<Record<TXenolabTile, boolean>>;
}

const DEFAULT_TILES: Record<TXenolabTile, boolean> = {
  launch: true,
  scan: true,
  research: true,
};

export class Xenolab extends Organization {
  public constructor() {
    super(EOrganizationId.XENOLAB);
  }

  public override hasImplementedMainAction(): boolean {
    return true;
  }

  public override canUseMainAction(
    player: IPlayer,
    game: IGame,
    payload: IOrganizationMainActionPayload = {},
  ): boolean {
    const tile = this.resolveTile(payload);
    if (!tile) {
      return (Object.keys(DEFAULT_TILES) as TXenolabTile[]).some((candidate) =>
        this.canUseTile(player, game, candidate),
      );
    }
    return this.canUseTile(player, game, tile);
  }

  public override useMainAction(
    player: IPlayer,
    game: IGame,
    payload: IOrganizationMainActionPayload = {},
  ): IPlayerInput | undefined {
    const tile = this.resolveTile(payload);
    if (!tile) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Xenolab requires an actionId of launch, scan, or research',
        { playerId: player.id, payload },
      );
    }
    if (!this.canUseTile(player, game, tile)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Xenolab tile is not currently available',
        { playerId: player.id, tile },
      );
    }

    let pendingInput: IPlayerInput | undefined;
    switch (tile) {
      case 'launch':
        player.resources.spend({ credits: 1 });
        LaunchProbeEffect.execute(player, game);
        game.missionTracker.recordEvent({
          type: EMissionEventType.PROBE_LAUNCHED,
        });
        break;
      case 'scan':
        player.resources.spend({ energy: 2 });
        pendingInput = ScanEffect.execute(player, game);
        game.missionTracker.recordEvent({
          type: EMissionEventType.SCAN_PERFORMED,
        });
        break;
      case 'research':
        player.resources.spend({ publicity: 4 });
        pendingInput = ResearchTechAction.execute(player, game, true, {
          mode: 'all',
        });
        break;
    }

    this.setTile(player, tile, false);
    return pendingInput;
  }

  public override restore(player: IPlayer, game: IGame): void {
    this.ensureState(player);
    super.restore(player, game);
  }

  protected override registerEvents(player: IPlayer, game: IGame): void {
    const owner = this.getEventOwner(player);
    game.eventBus.unsubscribeOwner(owner);
    game.eventBus.subscribe(
      EGameRuntimeEvent.TRACE_PLACED,
      (context) => {
        if (context.player !== player) {
          return undefined;
        }

        const tile = this.getTileForTrace(context.traceColor);
        if (tile) {
          this.setTile(player, tile, true);
        }
        return undefined;
      },
      { owner },
    );
  }

  private canUseTile(
    player: IPlayer,
    game: IGame,
    tile: TXenolabTile,
  ): boolean {
    const tiles = this.ensureState(player).tiles;
    if (tiles?.[tile] !== true) {
      return false;
    }

    switch (tile) {
      case 'launch':
        return (
          player.resources.credits >= 1 &&
          LaunchProbeEffect.canExecute(player, game)
        );
      case 'scan':
        return player.resources.energy >= 2;
      case 'research':
        return (
          player.resources.publicity >= 4 &&
          ResearchTechAction.canExecute(player, game, true, { mode: 'all' })
        );
    }
  }

  private ensureState(player: IPlayer): IXenolabState {
    const state = (player.organizationState[this.id] ?? {}) as IXenolabState;
    state.tiles = { ...DEFAULT_TILES, ...(state.tiles ?? {}) };
    player.organizationState[this.id] = state as Record<string, unknown>;
    return state;
  }

  private setTile(player: IPlayer, tile: TXenolabTile, active: boolean): void {
    const state = this.ensureState(player);
    state.tiles = { ...DEFAULT_TILES, ...(state.tiles ?? {}), [tile]: active };
    player.organizationState[this.id] = state as Record<string, unknown>;
  }

  private resolveTile(
    payload: IOrganizationMainActionPayload,
  ): TXenolabTile | undefined {
    const actionId = payload.actionId;
    if (actionId === 'launch' || actionId === 'xenolab-launch') {
      return 'launch';
    }
    if (actionId === 'scan' || actionId === 'xenolab-scan') {
      return 'scan';
    }
    if (actionId === 'research' || actionId === 'xenolab-research') {
      return 'research';
    }
    return undefined;
  }

  private getTileForTrace(traceColor: unknown): TXenolabTile | undefined {
    if (traceColor === ETrace.BLUE) {
      return 'launch';
    }
    if (traceColor === ETrace.YELLOW) {
      return 'scan';
    }
    if (traceColor === ETrace.RED || String(traceColor).includes('purple')) {
      return 'research';
    }
    return undefined;
  }
}
