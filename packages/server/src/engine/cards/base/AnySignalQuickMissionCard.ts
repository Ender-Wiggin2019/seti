import {
  EEffectType,
  type Effect,
  type IBaseEffect,
} from '@seti/common/types/effect';
import { EScanAction, ESector } from '@seti/common/types/element';
import type { EPlanet } from '@seti/common/types/protocol/enums';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { MarkSectorSignalEffect } from '@/engine/effects/scan/MarkSectorSignalEffect.js';
import { getSectorIdsWithPlayerProbes } from '@/engine/effects/scan/ScanEffectUtils.js';
import type { IGame } from '@/engine/IGame.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { MissionCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

type TAnySignalPlacementMode = 'any-sector' | 'planet-sector' | 'probe-sector';

const SIGNAL_COLORS: readonly ESector[] = [
  ESector.RED,
  ESector.YELLOW,
  ESector.BLUE,
  ESector.BLACK,
];

function extractAnySignalCount(effects: Effect[]): number {
  const signalEffect = effects.find(
    (effect): effect is IBaseEffect =>
      effect.effectType === EEffectType.BASE && effect.type === EScanAction.ANY,
  );
  return signalEffect?.value ?? 0;
}

function signalColorLabel(color: ESector): string {
  switch (color) {
    case ESector.RED:
      return 'Red';
    case ESector.YELLOW:
      return 'Yellow';
    case ESector.BLUE:
      return 'Blue';
    case ESector.BLACK:
      return 'Black';
    default:
      return color;
  }
}

/**
 * Quick mission cards with a base ANY_SIGNAL effect that needs runtime interaction.
 *
 * Supported placement rules:
 * - `any-sector`: choose signal color, then sector by that color.
 * - `planet-sector`: mark on the sector currently containing the target planet.
 * - `probe-sector`: mark on a sector containing one of your probes.
 */
export class AnySignalQuickMissionCard extends MissionCard {
  private readonly placementMode: TAnySignalPlacementMode;

  private readonly targetPlanet?: EPlanet;

  public constructor(
    cardId: string,
    options:
      | { placementMode: 'any-sector' }
      | { placementMode: 'probe-sector' }
      | { placementMode: 'planet-sector'; targetPlanet: EPlanet },
  ) {
    super(loadCardData(cardId), { behavior: {} });
    this.placementMode = options.placementMode;
    if (options.placementMode === 'planet-sector') {
      this.targetPlanet = options.targetPlanet;
    }
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): ReturnType<MissionCard['play']> {
    const count = extractAnySignalCount(this.effects);
    if (count <= 0) return undefined;

    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => this.resolveMarks(context.player, game, count),
        EPriority.DEFAULT,
      ),
    );

    return undefined;
  }

  private resolveMarks(
    player: IPlayer,
    game: IGame,
    remainingCount: number,
  ): IPlayerInput | undefined {
    if (remainingCount <= 0) {
      return undefined;
    }

    if (this.placementMode === 'planet-sector') {
      if (!this.targetPlanet) return undefined;
      return MarkSectorSignalEffect.markByPlanetWithAlternatives(
        player,
        game,
        this.targetPlanet,
        () => this.resolveMarks(player, game, remainingCount - 1),
      );
    }

    if (this.placementMode === 'probe-sector') {
      return this.markOnPlayerProbeSector(player, game, remainingCount);
    }

    return this.markWithColorChoice(player, game, () =>
      this.resolveMarks(player, game, remainingCount - 1),
    );
  }

  private markWithColorChoice(
    player: IPlayer,
    game: IGame,
    onComplete: () => IPlayerInput | undefined,
  ): IPlayerInput {
    return new SelectOption(
      player,
      SIGNAL_COLORS.map((color) => ({
        id: `any-signal-${color}`,
        label: `${signalColorLabel(color)} signal`,
        onSelect: () =>
          MarkSectorSignalEffect.markByColor(player, game, color, () =>
            onComplete(),
          ),
      })),
      'Choose signal color to mark',
    );
  }

  private markOnPlayerProbeSector(
    player: IPlayer,
    game: IGame,
    remainingCount: number,
  ): IPlayerInput | undefined {
    const sectorIds = this.getPlayerProbeSectorIds(player, game);
    if (sectorIds.length === 0) return undefined;

    const onMarked = () => this.resolveMarks(player, game, remainingCount - 1);

    if (sectorIds.length === 1) {
      return MarkSectorSignalEffect.markByIdWithAlternatives(
        player,
        game,
        sectorIds[0],
        () => onMarked(),
      );
    }

    return new SelectOption(
      player,
      sectorIds.map((sectorId) => ({
        id: `probe-sector-${sectorId}`,
        label: `Sector ${sectorId}`,
        onSelect: () =>
          MarkSectorSignalEffect.markByIdWithAlternatives(
            player,
            game,
            sectorId,
            () => onMarked(),
          ),
      })),
      'Choose sector with your probe',
    );
  }

  private getPlayerProbeSectorIds(player: IPlayer, game: IGame): string[] {
    return getSectorIdsWithPlayerProbes(game, player.id);
  }
}
