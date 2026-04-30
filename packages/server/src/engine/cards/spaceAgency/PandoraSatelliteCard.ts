import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustomAnd,
  countPlayerSignalsInSector,
  markSectorSignalWithoutData,
  pushCoreAction,
} from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.37';
const HANDLED_CUSTOM_ID = 'sa.desc.card_37';

export class PandoraSatellite extends ImmediateCard {
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
        (sector) => countPlayerSignalsInSector(sector, context.player.id) > 0,
      );
      for (const sector of eligibleSectors) {
        markSectorSignalWithoutData(context.player, game, sector);
      }
      return undefined;
    });
    return undefined;
  }
}
