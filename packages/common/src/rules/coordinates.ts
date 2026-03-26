export interface ICartesianCoordinates {
  x: number;
  y: number;
}

const STEPS_PER_RING = 32;
const RING_MULTIPLIER = 100;

export function systemPosToCoords(
  pos: number,
  center: number,
  ringRadii: number[],
): ICartesianCoordinates {
  const ringIndex = Math.floor(pos / RING_MULTIPLIER);
  const ringStep = pos % RING_MULTIPLIER;
  const radius = ringRadii[ringIndex];
  if (radius === undefined) {
    throw new Error(`Unknown ring index in pos: ${pos}`);
  }

  const normalizedStep =
    ((ringStep % STEPS_PER_RING) + STEPS_PER_RING) % STEPS_PER_RING;
  const angle = (normalizedStep / STEPS_PER_RING) * Math.PI * 2 - Math.PI / 2;

  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  };
}

export function coordsToSystemPos(
  x: number,
  y: number,
  center: number,
  ringRadii: number[],
): number | null {
  if (ringRadii.length === 0) {
    return null;
  }

  const deltaX = x - center;
  const deltaY = y - center;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  let closestRingIndex = -1;
  let minDelta = Number.POSITIVE_INFINITY;
  for (let index = 0; index < ringRadii.length; index += 1) {
    const delta = Math.abs(distance - ringRadii[index]);
    if (delta < minDelta) {
      minDelta = delta;
      closestRingIndex = index;
    }
  }
  if (closestRingIndex < 0) {
    return null;
  }

  const angle = Math.atan2(deltaY, deltaX);
  const normalizedAngle = (angle + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
  const step =
    Math.round((normalizedAngle / (Math.PI * 2)) * STEPS_PER_RING) %
    STEPS_PER_RING;

  return closestRingIndex * RING_MULTIPLIER + step;
}
