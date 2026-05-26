import { describe, expect, it } from 'vitest';
import {
  createHotspotGeometryFromPercent,
  geometryToPercentStyle,
  resolveHotspotGeometry,
} from '@/features/hotspots/hotspotConfig';

describe('hotspotConfig', () => {
  it('converts percentage anchors into the scene base coordinate system', () => {
    expect(
      createHotspotGeometryFromPercent({
        baseWidth: 400,
        baseHeight: 200,
        xPct: 25,
        yPct: 75,
        sizePx: 32,
      }),
    ).toEqual({
      x: 100,
      y: 150,
      width: 32,
      height: 32,
    });
  });

  it('merges local overrides while keeping a 24px minimum hit area', () => {
    expect(
      resolveHotspotGeometry(
        { x: 50, y: 60, width: 12, height: 10 },
        { x: 90, width: 18 },
      ),
    ).toEqual({
      x: 90,
      y: 60,
      width: 24,
      height: 24,
    });
  });

  it('formats percent styles without floating point noise', () => {
    expect(
      geometryToPercentStyle(
        {
          x: (1421 * 35) / 100,
          y: (461 * 30) / 100,
          width: (1421 * 8.5) / 100,
          height: 24,
        },
        1421,
        461,
      ),
    ).toMatchObject({
      left: '35%',
      top: '30%',
      width: '8.5%',
    });
  });
});
