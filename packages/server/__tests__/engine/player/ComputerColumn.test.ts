import { ComputerColumn, TECH_TOP_REWARD } from '@/engine/player/ComputerColumn.js';

describe('ComputerColumn', () => {
  it('uses config top reward before tech placement and TECH_TOP_REWARD after placement', () => {
    const column = new ComputerColumn({
      topReward: { credits: 1 },
      techSlotAvailable: true,
    });

    expect(column.topReward).toEqual({ credits: 1 });
    expect(column.hasBottomSlot).toBe(false);

    column.placeTech({ techId: 'computer-tech-1' as never, bottomReward: { energy: 1 } });

    expect(column.topReward).toEqual(TECH_TOP_REWARD);
    expect(column.bottomReward).toEqual({ energy: 1 });
    expect(column.hasBottomSlot).toBe(true);
  });

  it('enforces top-before-bottom placement order', () => {
    const column = new ComputerColumn({ topReward: null, techSlotAvailable: true });
    column.placeTech({ techId: 'computer-tech-1' as never, bottomReward: { vp: 1 } });

    expect(() => column.placeBottomData()).toThrow('Top slot must be filled');

    expect(column.placeTopData()).toEqual(TECH_TOP_REWARD);
    expect(column.placeBottomData()).toEqual({ vp: 1 });
  });

  it('throws when placing tech on non-tech column', () => {
    const column = new ComputerColumn({ topReward: { publicity: 1 }, techSlotAvailable: false });

    expect(() =>
      column.placeTech({ techId: 'computer-tech-2' as never, bottomReward: { credits: 1 } }),
    ).toThrow('does not accept tech placement');
  });

  it('clear resets filled state but keeps placed tech', () => {
    const column = new ComputerColumn({ topReward: null, techSlotAvailable: true });
    column.placeTech({ techId: 'computer-tech-3' as never, bottomReward: { credits: 1 } });
    column.placeTopData();
    column.placeBottomData();

    column.clear();

    const state = column.getState();
    expect(state.topFilled).toBe(false);
    expect(state.bottomFilled).toBe(false);
    expect(state.techId).toBe('computer-tech-3');
  });
});
