import { ETech } from '@seti/common/types/element';
import { ETechId } from '@seti/common/types/tech';
import { ResearchTechEffect } from '@/engine/effects/tech/ResearchTechEffect.js';

describe('ResearchTechEffect', () => {
  it('returns false when tech board is unavailable', () => {
    const can = ResearchTechEffect.canExecute(
      { id: 'p1' } as never,
      { techBoard: null } as never,
    );
    expect(can).toBe(false);
  });

  it('filters available techs by category', () => {
    const techBoard = {
      getAvailableTechs: () => [
        ETechId.PROBE_DOUBLE_PROBE,
        ETechId.SCAN_EARTH_LOOK,
      ],
    };

    const ids = ResearchTechEffect.getFilteredTechs(
      { id: 'p1' } as never,
      { techBoard } as never,
      { mode: 'category', categories: [ETech.PROBE] },
    );

    expect(ids).toEqual([ETechId.PROBE_DOUBLE_PROBE]);
  });
});
