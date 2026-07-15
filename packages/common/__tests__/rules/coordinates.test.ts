import { describe, expect, it } from 'vitest';
import { coordsToSystemPos, systemPosToCoords } from '@/rules/coordinates';

const RADII = [100, 200, 300];
const CENTER = 500;

describe('systemPosToCoords', () => {
  it('returns top-of-ring position for step 0 (12-o-clock)', () => {
    const coords = systemPosToCoords(0, CENTER, RADII);
    expect(coords.x).toBeCloseTo(CENTER, 5);
    expect(coords.y).toBeCloseTo(CENTER - RADII[0], 5);
  });

  it('computes position on ring 1', () => {
    const coords = systemPosToCoords(100, CENTER, RADII);
    expect(coords.x).toBeCloseTo(CENTER, 5);
    expect(coords.y).toBeCloseTo(CENTER - RADII[1], 5);
  });

  it('computes position on ring 2', () => {
    const coords = systemPosToCoords(200, CENTER, RADII);
    expect(coords.x).toBeCloseTo(CENTER, 5);
    expect(coords.y).toBeCloseTo(CENTER - RADII[2], 5);
  });

  it('handles step 8 (quarter turn = 3-o-clock)', () => {
    const coords = systemPosToCoords(8, CENTER, RADII);
    expect(coords.x).toBeCloseTo(CENTER + RADII[0], 5);
    expect(coords.y).toBeCloseTo(CENTER, 5);
  });

  it('throws for unknown ring index', () => {
    expect(() => systemPosToCoords(500, CENTER, RADII)).toThrow(
      'Unknown ring index',
    );
  });
});

describe('coordsToSystemPos', () => {
  it('round-trips with systemPosToCoords for ring 0 step 0', () => {
    const coords = systemPosToCoords(0, CENTER, RADII);
    const pos = coordsToSystemPos(coords.x, coords.y, CENTER, RADII);
    expect(pos).toBe(0);
  });

  it('round-trips for ring 1 step 8', () => {
    const coords = systemPosToCoords(108, CENTER, RADII);
    const pos = coordsToSystemPos(coords.x, coords.y, CENTER, RADII);
    expect(pos).toBe(108);
  });

  it('returns null with empty radii', () => {
    const pos = coordsToSystemPos(500, 500, CENTER, []);
    expect(pos).toBeNull();
  });
});
