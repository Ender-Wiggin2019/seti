import { ETech } from '@seti/common/types/element';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import { buildTestGame } from '../../../helpers/TestGameBuilder.js';
import {
  activateMission,
  quickMissionIds,
  triggerOptions,
} from './SpaceAgencyCardTestUtils.js';

describe('Space Agency generic mission cards', () => {
  it('SA.9 completes with three fulfilled sectors and grants publicity', () => {
    const game = buildTestGame({ seed: 'sa-9-generic' });
    const { player } = activateMission(game, 'p1', 'SA.9');
    for (const sector of game.sectors.slice(0, 3)) {
      sector.sectorWinners.push(player.id);
    }
    const publicityBefore = player.resources.publicity;

    expect(quickMissionIds(game, player.id)).toContain('SA.9-0');
    game.missionTracker.completeMissionBranch(player, game, 'SA.9', 0);

    expect(player.resources.publicity).toBe(publicityBefore + 3);
  });

  it('SA.24, SA.25, and SA.26 remain valid generic tech-trigger full missions', () => {
    const game = buildTestGame({ seed: 'sa-24-26-completion' });
    const cards = [
      ['SA.24', ETech.PROBE, 'complete-SA.24-0'],
      ['SA.25', ETech.SCAN, 'complete-SA.25-0'],
      ['SA.26', ETech.COMPUTER, 'complete-SA.26-0'],
    ] as const;

    for (const [cardId, techCategory, optionId] of cards) {
      const { player } = activateMission(game, 'p1', cardId);
      game.missionTracker.recordEvent({
        type: EMissionEventType.TECH_RESEARCHED,
        techCategory,
      });
      expect(triggerOptions(game, player.id)).toContain(optionId);
    }
  });
});
