import { describe, expect, it } from 'vitest';
import { createDefaultSolarSystemExpandedMapCells } from '../../src/constant/sectorSetup';

describe('solar system expanded map cells', () => {
  it('exposes canonical layers without the old top-level cell alias', () => {
    const cells = createDefaultSolarSystemExpandedMapCells();

    expect(cells.length).toBeGreaterThan(0);
    expect(cells[0].layers[0]?.cell).toBeDefined();
    expect(Object.hasOwn(cells[0], 'cell')).toBe(false);
  });
});
