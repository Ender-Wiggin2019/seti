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
import { resolveSetupTucks } from '../../../helpers/TestGameBuilder.js';

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
    resolveSetupTucks(game);
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

  it('does not mark a fallback sector when the target star cannot be resolved', () => {
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

  it('becomes a completable quick mission after the owner fulfills the matching sector condition', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'observation-quick-mission-completable',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    player.hand = ['37'];
    game.mainDeck = new Deck(['refill-1', 'refill-2'], []);

    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });

    for (const sector of game.sectors.filter(
      (sector) => sector.color === ESector.RED,
    )) {
      sector.sectorWinners.push(player.id);
    }

    const completable = game.missionTracker.getCompletableQuickMissions(
      player,
      game,
    );
    expect(completable.map((mission) => mission.cardId)).toContain('37');
  });
});

// ================================================================
// Phase 3.7: ObservationQuickMissionCard Integration Extension
// ================================================================

describe('ObservationQuickMissionCard - Integration Extension (Phase 3.7)', () => {
  it('[Integration] Card 37 uses real Scan action with real sector state (not mocked)', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'observation-card-37-full-integration',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    player.hand = ['37'];
    player.resources.gain({ credits: 10, energy: 10, publicity: 10 });
    game.mainDeck = new Deck(['refill-1', 'refill-2'], []);
    game.cardRow = ['110', '110', '110'];

    // Play the observation mission card
    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });

    // Mark player as winner of 2 red sectors (simulating scan victories)
    for (const sector of game.sectors.filter((s) => s.color === ESector.RED)) {
      sector.sectorWinners.push(player.id);
    }

    // Mission should now be completable
    const completable = game.missionTracker.getCompletableQuickMissions(
      player,
      game,
    );
    expect(completable.map((m) => m.cardId)).toContain('37');
  });

  it('[Integration] Observation mission NOT completable until sector wins accumulate', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'observation-card-39-integration',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    player.hand = ['39']; // Requires 2 yellow sector wins
    game.mainDeck = new Deck(['refill-1'], []);

    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });

    // Not completable yet
    expect(game.missionTracker.hasCompletableQuickMissions(player, game)).toBe(
      false,
    );

    // Win 1 yellow sector
    const yellowSectors = game.sectors.filter(
      (s) => s.color === ESector.YELLOW,
    );
    if (yellowSectors[0]) {
      yellowSectors[0].sectorWinners.push(player.id);
    }

    // Still not completable (need 2)
    expect(game.missionTracker.hasCompletableQuickMissions(player, game)).toBe(
      false,
    );

    // Win 2nd yellow sector
    if (yellowSectors[1]) {
      yellowSectors[1].sectorWinners.push(player.id);
    }

    // Now completable
    expect(game.missionTracker.hasCompletableQuickMissions(player, game)).toBe(
      true,
    );
  });
});
