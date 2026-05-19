import { ETrace } from '@seti/common/types/element';
import { EAlienType } from '@seti/common/types/protocol/enums';
import { isAmoebaAlienBoard } from '@/engine/alien/AlienBoard.js';
import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import type { IGame } from '../../IGame.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

function hasAmoebaTraceOutsideDiscovery(
  player: IPlayer,
  game: IGame,
  traceColor: ETrace,
): boolean {
  const board = game.alienState.getBoardByType(EAlienType.AMOEBA);
  if (!isAmoebaAlienBoard(board)) return false;
  return [...board.speciesTraceSlots, ...board.overflowSlots].some((slot) =>
    slot.occupants.some(
      (occupant) =>
        occupant.source !== 'neutral' &&
        occupant.source.playerId === player.id &&
        occupant.traceColor === traceColor,
    ),
  );
}

function hasAllAmoebaTraceColorsOutsideDiscovery(
  player: IPlayer,
  game: IGame,
): boolean {
  return (
    hasAmoebaTraceOutsideDiscovery(player, game, ETrace.PINK) &&
    hasAmoebaTraceOutsideDiscovery(player, game, ETrace.YELLOW) &&
    hasAmoebaTraceOutsideDiscovery(player, game, ETrace.BLUE)
  );
}

export class SaEt14BreakthroughTheoryCard extends MissionCard {
  public constructor() {
    super(loadCardData('SA.ET.14'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef(
      'SA.ET.14',
      hasAllAmoebaTraceColorsOutsideDiscovery,
    );
  }
}
