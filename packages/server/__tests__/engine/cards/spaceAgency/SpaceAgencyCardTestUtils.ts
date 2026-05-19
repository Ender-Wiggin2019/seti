import type { ISelectOptionInputModel } from '@seti/common/types/protocol/playerInput';
import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import type { Game } from '@/engine/Game.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { getPlayer } from '../../../helpers/TestGameBuilder.js';

export function activateMission(game: Game, playerId: string, cardId: string) {
  const player = getPlayer(game, playerId);
  const card = getCardRegistry().create(cardId);
  const def = card.getMissionDef?.();
  if (def) {
    game.missionTracker.registerMission(def, player.id);
  } else {
    game.missionTracker.registerMissionFromCard(cardId, player.id);
    expect(
      game.missionTracker.getMissionState(player.id, cardId),
    ).toBeDefined();
  }
  player.playedMissions.push(card);
  return { player, card, def };
}

export function quickMissionIds(game: Game, playerId: string): string[] {
  const player = getPlayer(game, playerId);
  return game.missionTracker
    .getCompletableQuickMissions(player, game)
    .map((mission) => `${mission.cardId}-${mission.branchIndex}`);
}

export function triggerOptions(game: Game, playerId: string): string[] {
  const player = getPlayer(game, playerId);
  const input = game.missionTracker.checkAndPromptTriggers(player, game);
  const model = input?.toModel() as ISelectOptionInputModel | undefined;
  return model?.options.map((option) => String(option.id)) ?? [];
}

export function clearDataPool(player: IPlayer): void {
  player.dataPool.remove(player.dataPool.count);
}
