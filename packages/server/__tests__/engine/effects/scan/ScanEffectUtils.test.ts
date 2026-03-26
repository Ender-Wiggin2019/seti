import { ESector } from '@seti/common/types/element';
import {
  extractSectorColorFromCardItem,
  findSectorByColor,
  getAllSectors,
  getSectorAt,
} from '@/engine/effects/scan/ScanEffectUtils.js';

describe('ScanEffectUtils', () => {
  it('gets sector by index and color', () => {
    const sectors = [
      { id: 's0', color: ESector.BLUE, markSignal: () => ({}) },
      { id: 's1', color: ESector.RED, markSignal: () => ({}) },
    ];
    const game = { sectors };

    expect(getSectorAt(game as never, 1)?.id).toBe('s1');
    expect(findSectorByColor(game as never, ESector.BLUE)?.id).toBe('s0');
    expect(getAllSectors(game as never)).toHaveLength(2);
  });

  it('extracts sector color from card-like object', () => {
    expect(extractSectorColorFromCardItem({ sector: ESector.YELLOW })).toBe(
      ESector.YELLOW,
    );
    expect(extractSectorColorFromCardItem('c1')).toBeNull();
  });
});
