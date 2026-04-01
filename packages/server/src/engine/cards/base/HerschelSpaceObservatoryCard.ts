import { ESector } from '@seti/common/types/element';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { MarkSectorSignalEffect } from '@/engine/effects/scan/MarkSectorSignalEffect.js';
import { findAllSectorsByColor } from '@/engine/effects/scan/ScanEffectUtils.js';
import type { IGame } from '@/engine/IGame.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { MissionCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

function countPlayerSignaledSectors(player: IPlayer, game: IGame): number {
  return game.sectors.reduce((count, sectorLike) => {
    const sector = sectorLike as {
      signals?: Array<{ type: string; playerId?: string }>;
    };
    const hasSignal =
      sector.signals?.some(
        (signal) => signal.type === 'player' && signal.playerId === player.id,
      ) ?? false;
    return hasSignal ? count + 1 : count;
  }, 0);
}

/**
 * Card No.134 — Herschel Space Observatory.
 * Immediate: mark one signal in a sector where you have a probe.
 * QUICK_MISSION: have your signals in 4 different sectors.
 */
export class HerschelSpaceObservatory extends MissionCard {
  public constructor() {
    super(loadCardData('134'), { behavior: {} });
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef(
      '134',
      (player, game) => countPlayerSignaledSectors(player, game) >= 4,
    );
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): ReturnType<MissionCard['play']> {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => this.createSignalInput(context.player, game),
        EPriority.DEFAULT,
      ),
    );
    return undefined;
  }

  private createSignalInput(player: IPlayer, game: IGame) {
    const sectorIdsWithProbe = this.getSectorIdsWithProbe(player, game);
    if (sectorIdsWithProbe.size === 0) {
      return undefined;
    }

    const availableColors = Object.values(ESector).filter((color) =>
      findAllSectorsByColor(game, color).some((sector) =>
        sectorIdsWithProbe.has(sector.id),
      ),
    );

    if (availableColors.length === 0) {
      return undefined;
    }
    if (availableColors.length === 1) {
      return this.createSectorInputForColor(
        player,
        game,
        availableColors[0],
        sectorIdsWithProbe,
      );
    }

    return new SelectOption(
      player,
      availableColors.map((color) => ({
        id: `herschel-color-${color}`,
        label: color,
        onSelect: () =>
          this.createSectorInputForColor(
            player,
            game,
            color,
            sectorIdsWithProbe,
          ),
      })),
      'Choose signal color',
    );
  }

  private createSectorInputForColor(
    player: IPlayer,
    game: IGame,
    color: ESector,
    sectorIdsWithProbe: ReadonlySet<string>,
  ) {
    const sectors = findAllSectorsByColor(game, color).filter((sector) =>
      sectorIdsWithProbe.has(sector.id),
    );
    if (sectors.length === 0) {
      return undefined;
    }
    if (sectors.length === 1) {
      MarkSectorSignalEffect.markOnSector(player, game, sectors[0]);
      return undefined;
    }
    return new SelectOption(
      player,
      sectors.map((sector) => ({
        id: `herschel-sector-${sector.id}`,
        label: `Sector ${sector.id}`,
        onSelect: () => {
          MarkSectorSignalEffect.markOnSector(player, game, sector);
          return undefined;
        },
      })),
      'Choose sector to mark signal',
    );
  }

  private getSectorIdsWithProbe(player: IPlayer, game: IGame): Set<string> {
    const sectorIds = new Set<string>();
    if (!game.solarSystem) {
      return sectorIds;
    }

    for (const space of game.solarSystem.spaces) {
      if (
        space.ringIndex <= 0 ||
        !space.occupants.some((occupant) => occupant.playerId === player.id)
      ) {
        continue;
      }
      const sectorIndex = Math.floor(space.indexInRing / space.ringIndex);
      const sector = game.sectors[sectorIndex];
      if (sector) {
        sectorIds.add(sector.id);
      }
    }
    return sectorIds;
  }
}
