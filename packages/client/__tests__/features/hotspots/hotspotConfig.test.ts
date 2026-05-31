import { describe, expect, it } from 'vitest';
import {
  createHotspotGeometryFromPercent,
  geometryToPercentStyle,
  moveHotspotGeometry,
  resizeHotspotGeometry,
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

  it('resizes width and height independently with the minimum hit area', () => {
    expect(
      resizeHotspotGeometry({ x: 10, y: 20, width: 197, height: 276 }, 10, 20),
    ).toEqual({
      x: 10,
      y: 20,
      width: 207,
      height: 296,
    });

    expect(
      resizeHotspotGeometry({ x: 10, y: 20, width: 30, height: 40 }, -20, -30),
    ).toEqual({
      x: 10,
      y: 20,
      width: 24,
      height: 24,
    });
  });

  it('moves geometry in scene pixels while clamping to the base coordinate area', () => {
    expect(
      moveHotspotGeometry({
        geometry: { x: 50, y: 25, width: 24, height: 24 },
        baseWidth: 200,
        baseHeight: 100,
        sceneWidth: 400,
        sceneHeight: 200,
        deltaX: 40,
        deltaY: 20,
      }),
    ).toEqual({
      x: 70,
      y: 35,
      width: 24,
      height: 24,
    });

    expect(
      moveHotspotGeometry({
        geometry: { x: 50, y: 25, width: 24, height: 24 },
        baseWidth: 200,
        baseHeight: 100,
        sceneWidth: 400,
        sceneHeight: 200,
        deltaX: -200,
        deltaY: 300,
      }),
    ).toMatchObject({
      x: 0,
      y: 100,
    });
  });

  it('does not move geometry without a measurable scene', () => {
    expect(
      moveHotspotGeometry({
        geometry: { x: 50, y: 25, width: 24, height: 24 },
        baseWidth: 200,
        baseHeight: 100,
        sceneWidth: 0,
        sceneHeight: 200,
        deltaX: 40,
        deltaY: 20,
      }),
    ).toBeUndefined();
  });
});
