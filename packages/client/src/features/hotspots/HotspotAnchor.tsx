import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import {
  geometryToPercentStyle,
  getHotspotStorageSceneId,
  type IHotspotGeometry,
  moveHotspotGeometry,
  resizeHotspotGeometry,
  resolveHotspotGeometry,
  type THotspotVariant,
} from '@/features/hotspots/hotspotConfig';
import { cn } from '@/lib/cn';
import { useDebugStore } from '@/stores/debugStore';

type THotspotShape = 'circle' | 'rect';
type TEditMode = 'move' | 'resize';
type THotspotDataAttributes = Record<`data-${string}`, string | undefined>;

interface IHotspotAnchorProps extends React.PropsWithChildren {
  sceneId: string;
  hotspotId: string;
  baseWidth: number;
  baseHeight: number;
  x: number;
  y: number;
  xPercent?: number;
  yPercent?: number;
  width?: number;
  height?: number;
  color?: string;
  opacity?: number;
  shape?: THotspotShape;
  variant?: THotspotVariant;
  debugLabel: string;
  debugInfo?: React.ReactNode;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  offsetX?: number;
  offsetY?: number;
  dataAttributes?: THotspotDataAttributes;
  testId?: string;
  title?: string;
}

interface IPointerEditState {
  mode: TEditMode;
  sceneElement: HTMLElement;
  startClientX: number;
  startClientY: number;
  startGeometry: IHotspotGeometry;
}

function readClientPoint(
  event: PointerEvent | React.PointerEvent<HTMLElement>,
): {
  clientX: number;
  clientY: number;
} {
  const nativeEvent =
    'nativeEvent' in event
      ? (event.nativeEvent as PointerEvent)
      : (event as PointerEvent);
  const rawClientX = Number.isFinite(event.clientX)
    ? event.clientX
    : nativeEvent.clientX;
  const rawClientY = Number.isFinite(event.clientY)
    ? event.clientY
    : nativeEvent.clientY;
  return {
    clientX: Number.isFinite(rawClientX) ? rawClientX : 0,
    clientY: Number.isFinite(rawClientY) ? rawClientY : 0,
  };
}

function applyColorOpacity(color: string, opacity: number): string {
  const hex = color.trim();
  const shortHexMatch = /^#([0-9a-f]{3})$/i.exec(hex);
  if (shortHexMatch) {
    const [r, g, b] = shortHexMatch[1].split('').map((part) => part + part);
    return `rgba(${Number.parseInt(r, 16)}, ${Number.parseInt(g, 16)}, ${Number.parseInt(b, 16)}, ${opacity})`;
  }

  const hexMatch = /^#([0-9a-f]{6})$/i.exec(hex);
  if (hexMatch) {
    const value = hexMatch[1];
    return `rgba(${Number.parseInt(value.slice(0, 2), 16)}, ${Number.parseInt(value.slice(2, 4), 16)}, ${Number.parseInt(value.slice(4, 6), 16)}, ${opacity})`;
  }

  return color;
}

function findSceneElement(element: HTMLElement): HTMLElement | null {
  const offsetParent = element.offsetParent;
  if (offsetParent instanceof HTMLElement) {
    return offsetParent;
  }
  return element.parentElement;
}

function formatAnchorTestId(sceneId: string, hotspotId: string): string {
  return `hotspot-anchor-${sceneId}-${hotspotId}`;
}

export function HotspotAnchor({
  sceneId,
  hotspotId,
  baseWidth,
  baseHeight,
  x,
  y,
  xPercent,
  yPercent,
  width = 24,
  height = 24,
  color = '#f59e0b',
  opacity = 0.28,
  shape = 'circle',
  variant = 'shared',
  debugLabel,
  debugInfo,
  ariaLabel,
  className,
  style,
  offsetX = 0,
  offsetY = 0,
  dataAttributes,
  testId,
  title,
  children,
}: IHotspotAnchorProps): React.JSX.Element {
  const debug = useDebugStore((state) => state.hotspotDebug);
  const showAnchorHotspots = useDebugStore((state) => state.showAnchorHotspots);
  const storageSceneId = getHotspotStorageSceneId(sceneId, variant);
  const committedOverride = useDebugStore(
    (state) => state.hotspotOverrides[storageSceneId]?.[hotspotId],
  );
  const draftOverride = useDebugStore(
    (state) => state.hotspotDraftOverrides[storageSceneId]?.[hotspotId],
  );
  const setHotspotDraftOverride = useDebugStore(
    (state) => state.setHotspotDraftOverride,
  );
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const editRef = useRef<IPointerEditState | null>(null);
  const baseGeometry = useMemo<IHotspotGeometry>(
    () => ({
      x: xPercent === undefined ? x : (baseWidth * xPercent) / 100,
      y: yPercent === undefined ? y : (baseHeight * yPercent) / 100,
      width,
      height,
    }),
    [baseHeight, baseWidth, height, width, x, xPercent, y, yPercent],
  );
  const override =
    draftOverride === undefined
      ? committedOverride
      : { ...(committedOverride ?? {}), ...draftOverride };
  const geometry = resolveHotspotGeometry(baseGeometry, override);
  const percentStyle = geometryToPercentStyle(geometry, baseWidth, baseHeight);
  const transform =
    offsetX === 0 && offsetY === 0
      ? 'translate(-50%, -50%)'
      : `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
  const debugVisible = debug && showAnchorHotspots;
  const debugBackground = applyColorOpacity(color, opacity);

  function commitOverride(next: IHotspotGeometry): void {
    setHotspotDraftOverride(storageSceneId, hotspotId, next);
  }

  function stopPointerEdit(): void {
    window.removeEventListener('pointermove', handleWindowPointerMove);
    window.removeEventListener('pointerup', handleWindowPointerUp);
    editRef.current = null;
  }

  function handleWindowPointerMove(event: PointerEvent): void {
    const edit = editRef.current;
    if (!edit) return;
    const point = readClientPoint(event);
    const dx = point.clientX - edit.startClientX;
    const dy = point.clientY - edit.startClientY;

    if (edit.mode === 'resize') {
      commitOverride(resizeHotspotGeometry(edit.startGeometry, dx, dy));
      return;
    }

    const rect = edit.sceneElement.getBoundingClientRect();
    const nextGeometry = moveHotspotGeometry({
      geometry: edit.startGeometry,
      baseWidth,
      baseHeight,
      sceneWidth: rect.width,
      sceneHeight: rect.height,
      deltaX: dx,
      deltaY: dy,
    });
    if (!nextGeometry) return;
    commitOverride(nextGeometry);
  }

  function handleWindowPointerUp(): void {
    stopPointerEdit();
  }

  function startPointerEdit(
    event: React.PointerEvent<HTMLElement>,
    mode: TEditMode,
  ): void {
    if (!debugVisible) return;
    const sceneElement = findSceneElement(event.currentTarget);
    if (!sceneElement) return;
    const point = readClientPoint(event);
    event.preventDefault();
    event.stopPropagation();
    editRef.current = {
      mode,
      sceneElement,
      startClientX: point.clientX,
      startClientY: point.clientY,
      startGeometry: geometry,
    };
    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
  }

  return (
    <div
      data-hotspot-scene={sceneId}
      data-hotspot-id={hotspotId}
      data-hotspot-variant={variant}
      data-hotspot-role='anchor'
      data-testid={testId ?? formatAnchorTestId(sceneId, hotspotId)}
      aria-label={ariaLabel}
      title={title ?? debugLabel}
      tabIndex={debugVisible ? 0 : undefined}
      {...dataAttributes}
      className={cn(
        'absolute z-70 border transition-[background-color,border-color,opacity,box-shadow]',
        debugVisible
          ? 'pointer-events-auto cursor-move border-current shadow-[0_0_0_1px_rgba(0,0,0,0.45)]'
          : 'pointer-events-none border-transparent',
        className,
      )}
      style={{
        ...percentStyle,
        ...style,
        minWidth: '24px',
        minHeight: '24px',
        borderRadius: shape === 'circle' ? '9999px' : '4px',
        backgroundColor: debugVisible ? debugBackground : 'transparent',
        color,
        transform,
      }}
      onMouseEnter={() => setShowDebugInfo(true)}
      onMouseLeave={() => setShowDebugInfo(false)}
      onFocus={() => setShowDebugInfo(true)}
      onBlur={() => setShowDebugInfo(false)}
      onPointerDown={(event) => startPointerEdit(event, 'move')}
    >
      {children}
      {debugVisible ? (
        <>
          {showDebugInfo ? (
            <span
              className='pointer-events-none absolute left-full top-1/2 z-20 ml-1 grid max-w-[220px] -translate-y-1/2 gap-0.5 rounded-sm border border-surface-950/80 bg-surface-950/95 px-1.5 py-1 font-mono text-[9px] leading-tight text-text-100 shadow-[0_4px_12px_rgba(0,0,0,0.5)]'
              data-testid={`hotspot-anchor-info-${sceneId}-${hotspotId}`}
            >
              <span className='uppercase'>{debugLabel}</span>
              {debugInfo ? (
                <span className='whitespace-normal text-text-300'>
                  {debugInfo}
                </span>
              ) : null}
            </span>
          ) : null}
          <span
            aria-hidden
            data-testid={`hotspot-anchor-resize-${sceneId}-${hotspotId}`}
            className='pointer-events-auto absolute bottom-0 right-0 z-10 h-3 w-3 cursor-nwse-resize rounded-full border border-surface-950 bg-text-100 shadow-[0_0_0_1px_rgba(0,0,0,0.55)]'
            onPointerDown={(event) => startPointerEdit(event, 'resize')}
          />
        </>
      ) : null}
    </div>
  );
}
