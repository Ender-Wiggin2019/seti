export const MIN_HOTSPOT_SIZE = 24;

export interface IHotspotGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IHotspotGeometryOverride {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export type THotspotOverrides = Record<
  string,
  Record<string, IHotspotGeometryOverride>
>;

export type THotspotVariant = 'shared' | 'image' | 'text';

export interface ICreateHotspotGeometryFromPercentParams {
  baseWidth: number;
  baseHeight: number;
  xPct: number;
  yPct: number;
  sizePx?: number;
  widthPx?: number;
  heightPx?: number;
}

function clampSize(size: number): number {
  return Math.max(MIN_HOTSPOT_SIZE, size);
}

function formatPercent(value: number): string {
  return `${Number(value.toFixed(6))}%`;
}

export function createHotspotGeometryFromPercent({
  baseWidth,
  baseHeight,
  xPct,
  yPct,
  sizePx = MIN_HOTSPOT_SIZE,
  widthPx,
  heightPx,
}: ICreateHotspotGeometryFromPercentParams): IHotspotGeometry {
  const width = widthPx ?? sizePx;
  const height = heightPx ?? sizePx;
  return {
    x: (baseWidth * xPct) / 100,
    y: (baseHeight * yPct) / 100,
    width: clampSize(width),
    height: clampSize(height),
  };
}

export function resolveHotspotGeometry(
  base: IHotspotGeometry,
  override?: IHotspotGeometryOverride,
): IHotspotGeometry {
  return {
    x: override?.x ?? base.x,
    y: override?.y ?? base.y,
    width: clampSize(override?.width ?? base.width),
    height: clampSize(override?.height ?? base.height),
  };
}

export function resizeHotspotGeometry(
  geometry: IHotspotGeometry,
  deltaX: number,
  deltaY: number,
): IHotspotGeometry {
  return {
    ...geometry,
    width: clampSize(geometry.width + deltaX),
    height: clampSize(geometry.height + deltaY),
  };
}

export interface IMoveHotspotGeometryParams {
  geometry: IHotspotGeometry;
  baseWidth: number;
  baseHeight: number;
  sceneWidth: number;
  sceneHeight: number;
  deltaX: number;
  deltaY: number;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function moveHotspotGeometry({
  geometry,
  baseWidth,
  baseHeight,
  sceneWidth,
  sceneHeight,
  deltaX,
  deltaY,
}: IMoveHotspotGeometryParams): IHotspotGeometry | undefined {
  if (sceneWidth <= 0 || sceneHeight <= 0) return undefined;
  return {
    ...geometry,
    x:
      (clampPercent(
        (geometry.x / baseWidth) * 100 + (deltaX / sceneWidth) * 100,
      ) /
        100) *
      baseWidth,
    y:
      (clampPercent(
        (geometry.y / baseHeight) * 100 + (deltaY / sceneHeight) * 100,
      ) /
        100) *
      baseHeight,
  };
}

export function getHotspotStorageSceneId(
  sceneId: string,
  variant: THotspotVariant = 'shared',
): string {
  return variant === 'shared' ? sceneId : `${sceneId}:${variant}`;
}

export function geometryToPercentStyle(
  geometry: IHotspotGeometry,
  baseWidth: number,
  baseHeight: number,
): {
  left: string;
  top: string;
  width: string;
  height: string;
} {
  return {
    left: formatPercent((geometry.x / baseWidth) * 100),
    top: formatPercent((geometry.y / baseHeight) * 100),
    width: formatPercent((geometry.width / baseWidth) * 100),
    height: formatPercent((geometry.height / baseHeight) * 100),
  };
}
