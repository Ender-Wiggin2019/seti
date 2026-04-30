import { EStarName } from '@seti/common/constant/sectorSetup';
import { ESector } from '@seti/common/types/element';
import { EMainAction } from '@seti/common/types/protocol/enums';
import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';
import { EPriority } from '@/engine/deferred/Priority.js';
import {
  findSectorById,
  findSectorIdByStarName,
} from '@/engine/effects/scan/ScanEffectUtils.js';
import { Game } from '@/engine/Game.js';
import { scoreEndGameCard } from '@/engine/scoring/GoldScoringTile.js';
import { resolveSetupTucks } from '../../../helpers/TestGameBuilder.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function resolveCardId(card: string | { id?: string }): string | undefined {
  return typeof card === 'string' ? card : card.id;
}

export function expectObservationEndGameCard(config: {
  cardId: string;
  starName: EStarName;
  sectorColor: ESector;
  signalCount: number;
}): void {
  const registryCard = getCardRegistry().create(config.cardId);
  expect(registryCard.id).toBe(config.cardId);
  expect(registryCard.kind).toBe(EServerCardKind.END_GAME);
  expect(registryCard.behavior.custom).toBeUndefined();

  const priorityGame = Game.create(
    TEST_PLAYERS,
    { playerCount: 2 },
    `observation-endgame-priority-${config.cardId}`,
  );
  const priorityPlayer = priorityGame.players[0];
  registryCard.play({ player: priorityPlayer, game: priorityGame });
  expect(priorityGame.deferredActions.peek()?.priority).toBe(
    EPriority.CORE_EFFECT,
  );

  const game = Game.create(
    TEST_PLAYERS,
    { playerCount: 2 },
    `observation-endgame-${config.cardId}`,
  );
  resolveSetupTucks(game);
  const player = game.players[0];
  player.hand = [config.cardId];

  const targetSectorId = findSectorIdByStarName(
    game.solarSystemSetup,
    config.starName,
  );
  if (!targetSectorId) {
    throw new Error(`missing sector for star ${config.starName}`);
  }

  const targetSector = findSectorById(game, targetSectorId);
  const otherSameColorSector = game.sectors.find(
    (sector) =>
      sector.id !== targetSectorId && sector.color === config.sectorColor,
  );
  if (!targetSector || !otherSameColorSector) {
    throw new Error(`missing target/alternate sector for ${config.cardId}`);
  }

  const targetBefore = targetSector.getPlayerMarkerCount(player.id);
  const otherBefore = otherSameColorSector.getPlayerMarkerCount(player.id);

  game.processMainAction(player.id, {
    type: EMainAction.PLAY_CARD,
    payload: { cardIndex: 0 },
  });

  expect(targetSector.getPlayerMarkerCount(player.id)).toBe(
    targetBefore + config.signalCount,
  );
  expect(otherSameColorSector.getPlayerMarkerCount(player.id)).toBe(
    otherBefore,
  );
  expect(player.endGameCards.map(resolveCardId)).toEqual([config.cardId]);

  const scoringGame = Game.create(
    TEST_PLAYERS,
    { playerCount: 2 },
    `observation-endgame-scoring-${config.cardId}`,
  );
  resolveSetupTucks(scoringGame);
  const scoringPlayer = scoringGame.players[0];
  const scoringSector = scoringGame.sectors.find(
    (sector) => sector.color === config.sectorColor,
  );
  const otherColorSector = scoringGame.sectors.find(
    (sector) => sector.color !== config.sectorColor,
  );
  if (!scoringSector || !otherColorSector) {
    throw new Error(`missing scoring sector for ${config.cardId}`);
  }

  scoringSector.sectorWinners.push(scoringPlayer.id, scoringPlayer.id, 'p2');
  otherColorSector.sectorWinners.push(scoringPlayer.id);

  expect(scoreEndGameCard(config.cardId, scoringPlayer, scoringGame)).toBe(6);
}
