import {
  ALL_SECTOR_POSITIONS,
  createDefaultSetupConfig,
  ESectorPosition,
} from '@seti/common/constant/sectorSetup';
import { describe, expect, it } from 'vitest';

/**
 * Cardinal positions are walked **clockwise from the top** so that the
 * sector tiles end up sitting under the wheel cells they correspond to.
 *
 * Wheel cells (server math): cell-N centre at `(N + 0.5) * 45°` measured
 * clockwise from 12 o'clock — so cell-0 is at the top-right, cells 2,3
 * are on the right, cells 4,5 are on the bottom, cells 6,7 are on the
 * left. Sector tiles are rendered at fixed cardinal positions:
 *   NORTH = top, EAST = right, SOUTH = bottom, WEST = left.
 *
 * Walking the cardinal positions in any order other than clockwise (e.g.
 * NORTH/WEST/EAST/SOUTH) means sector-N's tile renders on the opposite
 * side of the board from cell-N, so "Mark Earth" / "mark by colour"
 * pickers appear to mark the wrong sector tile even when the server
 * resolves the right sector index.
 */
describe('sectorSetup cardinal ordering', () => {
  it('ALL_SECTOR_POSITIONS walks clockwise from the top', () => {
    expect(ALL_SECTOR_POSITIONS).toEqual([
      ESectorPosition.NORTH,
      ESectorPosition.EAST,
      ESectorPosition.SOUTH,
      ESectorPosition.WEST,
    ]);
  });

  it('createDefaultSetupConfig pairs sector ids around each cardinal anchor', () => {
    const config = createDefaultSetupConfig();
    const placementsByPosition = new Map(
      config.tilePlacements.map((p) => [p.position, p.sectorIds]),
    );

    // Each tile spans 90° centred on its direction, so its two sectors are
    // the cell-pair whose centres bracket the cardinal anchor:
    //   NORTH (0°)  → sector-7 (-22.5°) + sector-0 (+22.5°)
    //   EAST  (90°) → sector-1 (67.5°) + sector-2 (112.5°)
    //   SOUTH (180°) → sector-3 (157.5°) + sector-4 (202.5°)
    //   WEST  (270°) → sector-5 (247.5°) + sector-6 (292.5°)
    expect(placementsByPosition.get(ESectorPosition.NORTH)).toEqual([
      'sector-7',
      'sector-0',
    ]);
    expect(placementsByPosition.get(ESectorPosition.EAST)).toEqual([
      'sector-1',
      'sector-2',
    ]);
    expect(placementsByPosition.get(ESectorPosition.SOUTH)).toEqual([
      'sector-3',
      'sector-4',
    ]);
    expect(placementsByPosition.get(ESectorPosition.WEST)).toEqual([
      'sector-5',
      'sector-6',
    ]);
  });
});
