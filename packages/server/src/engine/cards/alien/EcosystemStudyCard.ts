import { ETrace } from '@seti/common/types/element';
import { EAlienType } from '@seti/common/types/protocol/enums';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import type { IGame } from '@/engine/IGame.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { EndGameScoringCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutMascamitesCustom,
  createPickupBackInput,
} from './MascamitesCardUtils.js';

const CARD_ID = 'ET.5';

export class EcosystemStudy extends EndGameScoringCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutMascamitesCustom(CARD_ID),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext) {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) =>
          createPickupBackInput(context.player, game, {
            requireOwnProbe: true,
          }),
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }

  public override scoreEndGame(player: IPlayer, game: IGame): number {
    return game.alienState.getPlayerTraceCount(player, ETrace.ANY, {
      alienType: EAlienType.MASCAMITES,
    });
  }
}
