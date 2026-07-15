import { TECH_STACK_LAYOUT } from '@/constant/boardLayout';
import { ETech } from '@/types/element';
import { ETechId, getTechId } from '@/types/tech';
import { describe, expect, it } from 'vitest';

describe('tech board layout', () => {
  it('places canonical tech ids in physical board order', () => {
    const visibleTechIds = TECH_STACK_LAYOUT.map(({ tech, level }) =>
      getTechId(tech, level),
    );

    expect(visibleTechIds).toEqual([
      ETechId.PROBE_DOUBLE_PROBE,
      ETechId.PROBE_ASTEROID,
      ETechId.PROBE_ROVER_DISCOUNT,
      ETechId.PROBE_MOON,
      ETechId.SCAN_EARTH_LOOK,
      ETechId.SCAN_POP_SIGNAL,
      ETechId.SCAN_HAND_SIGNAL,
      ETechId.SCAN_ENERGY_LAUNCH,
      ETechId.COMPUTER_VP_CREDIT,
      ETechId.COMPUTER_VP_ENERGY,
      ETechId.COMPUTER_VP_CARD,
      ETechId.COMPUTER_VP_PUBLICITY,
    ]);
  });

  it('keeps each tech family in one row', () => {
    expect(TECH_STACK_LAYOUT.slice(0, 4).map((slot) => slot.tech)).toEqual([
      ETech.PROBE,
      ETech.PROBE,
      ETech.PROBE,
      ETech.PROBE,
    ]);
    expect(TECH_STACK_LAYOUT.slice(4, 8).map((slot) => slot.tech)).toEqual([
      ETech.SCAN,
      ETech.SCAN,
      ETech.SCAN,
      ETech.SCAN,
    ]);
    expect(TECH_STACK_LAYOUT.slice(8, 12).map((slot) => slot.tech)).toEqual([
      ETech.COMPUTER,
      ETech.COMPUTER,
      ETech.COMPUTER,
      ETech.COMPUTER,
    ]);
  });
});
