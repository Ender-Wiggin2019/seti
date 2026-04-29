import { SelectOption } from '@/engine/input/SelectOption.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustomAnd,
  countPlayerSignalsInSector,
  markSectorSignalWithoutData,
  pushCoreAction,
} from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.22';
const HANDLED_CUSTOM_ID = 'sa.desc.card_22';

export class TessSatellite extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutCustomAnd(
        CARD_ID,
        [HANDLED_CUSTOM_ID],
        ['markAnySignal'],
      ),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    pushCoreAction(context.player, context.game, (game) => {
      const eligibleSectors = game.sectors.filter(
        (sector) => countPlayerSignalsInSector(sector, context.player.id) >= 3,
      );
      if (eligibleSectors.length === 0) return undefined;

      return new SelectOption(
        context.player,
        eligibleSectors.map((sector) => ({
          id: sector.id,
          label: `Sector ${sector.id}`,
          onSelect: () => {
            markSectorSignalWithoutData(context.player, game, sector);
            markSectorSignalWithoutData(context.player, game, sector);
            return undefined;
          },
        })),
        'Choose sector for TESS Satellite',
      );
    });
    return undefined;
  }
}
