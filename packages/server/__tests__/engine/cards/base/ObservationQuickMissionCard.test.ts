import {
  createDefaultSetupConfig,
  EStarName,
} from '@seti/common/constant/sectorSetup';
import { ESector } from '@seti/common/types/element';
import { EMainAction } from '@seti/common/types/protocol/enums';
import { vi } from 'vitest';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { MarkSectorSignalEffect } from '@/engine/effects/scan/MarkSectorSignalEffect.js';
import { findSectorById } from '@/engine/effects/scan/ScanEffectUtils.js';
import { EventLog } from '@/engine/event/EventLog.js';
import { Game } from '@/engine/Game.js';
import type { IGame } from '@/engine/IGame.js';
import { MissionTracker } from '@/engine/missions/MissionTracker.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function resolveCardId(card: string | { id?: string }): string | undefined {
  return typeof card === 'string' ? card : card.id;
}

function createFallbackGame(sectors: unknown[]): IGame {
  return {
    sectors,
    solarSystemSetup: null,
    mainDeck: new Deck<string>([]),
    cardRow: [],
    deferredActions: new DeferredActionsQueue(),
    eventLog: new EventLog(),
    random: new SeededRandom('observation-quick-mission-fallback'),
    missionTracker: new MissionTracker(),
  } as unknown as IGame;
}

function createFallbackPlayer(): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { credits: 10, energy: 3, publicity: 4, data: 0 },
  });
}

describe('ObservationQuickMissionCard (37/39/41/43)', () => {
  it('plays through the real game pipeline and marks only the star-matched sector', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'observation-quick-mission-real-play',
    );
    const player = game.players[0];
    player.hand = ['37'];
    game.mainDeck = new Deck(['refill-1', 'refill-2'], []);

    const targetSectorId =
      createDefaultSetupConfig().tilePlacements[2].sectorIds[1];
    const targetSector = findSectorById(game, targetSectorId);
    const otherRedSector = game.sectors.find(
      (sector) => sector.id !== targetSectorId && sector.color === ESector.RED,
    );

    if (!targetSector || !otherRedSector) {
      throw new Error('expected both red sectors to exist in default setup');
    }

    const targetBefore = targetSector.getPlayerMarkerCount(player.id);
    const otherBefore = otherRedSector.getPlayerMarkerCount(player.id);

    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });

    expect(targetSector.getPlayerMarkerCount(player.id)).toBe(targetBefore + 2);
    expect(otherRedSector.getPlayerMarkerCount(player.id)).toBe(otherBefore);
    expect(player.playedMissions.map(resolveCardId)).toEqual(['37']);
    expect(game.missionTracker.getMissionState(player.id, '37')).toBeDefined();
  });

  it('falls back to color-based placement when the setup cannot resolve the target star', () => {
    const yellowSector = {
      id: 'sector-a',
      color: ESector.YELLOW,
      completed: false,
      markSignal: vi.fn(() => ({ dataGained: false, vpAwarded: 0 })),
    };

    const player = createFallbackPlayer();
    const game = createFallbackGame([yellowSector]);
    const result = MarkSectorSignalEffect.markByStarName(
      player,
      game,
      EStarName.SIXTY_ONE_VIRGINIS,
    );

    expect(result).toBeNull();
  });
});
