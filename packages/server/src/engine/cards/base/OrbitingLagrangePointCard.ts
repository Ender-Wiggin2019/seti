import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { MarkSectorSignalEffect } from '@/engine/effects/scan/MarkSectorSignalEffect.js';
import {
  findSectorById,
  getSectorIdsWithPlayerProbes,
} from '@/engine/effects/scan/ScanEffectUtils.js';
import type { IGame } from '@/engine/IGame.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import { behaviorWithoutCustomIds } from './baseSignalBatchCardUtils.js';

const CARD_ID = '120';
const HANDLED_CUSTOM_ID = 'desc.card-120';

export class OrbitingLagrangePointCard extends ImmediateCard {
  private returnToHandAfterPlay = false;

  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutCustomIds(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  public override canReturnToHandAfterPlay(): boolean {
    return this.returnToHandAfterPlay;
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    this.returnToHandAfterPlay = false;
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => this.createProbeSectorSignalInput(context.player, game),
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }

  private createProbeSectorSignalInput(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
    const sectors = getSectorIdsWithPlayerProbes(game, player.id)
      .map((sectorId) => findSectorById(game, sectorId))
      .filter(
        (sector): sector is NonNullable<typeof sector> => sector !== null,
      );

    if (sectors.length === 0) return undefined;
    if (sectors.length === 1) {
      return this.markSelectedSector(player, game, sectors[0].id);
    }

    return new SelectOption(
      player,
      sectors.map((sector) => ({
        id: sector.id,
        label: `Sector ${sector.id}`,
        onSelect: () => this.markSelectedSector(player, game, sector.id),
      })),
      'Choose sector with your probe',
    );
  }

  private markSelectedSector(
    player: IPlayer,
    game: IGame,
    sectorId: string,
  ): IPlayerInput | undefined {
    return MarkSectorSignalEffect.markByIdWithAlternatives(
      player,
      game,
      sectorId,
      (result) => {
        if (result) {
          const sector = findSectorById(game, result.sectorId);
          this.returnToHandAfterPlay =
            sector?.getPlayerMarkerCount(player.id) === 1;
        }
        return undefined;
      },
    );
  }
}
