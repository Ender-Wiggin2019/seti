import type React from 'react';
import type { IPublicSectorSignal } from '@/types/re-exports';

// The printed sector data slot is a small oval inscribed in the tile arc.
// 21px badly overflowed the printed slot — scaled down so the rendered
// dots sit inside it.
export const DEFAULT_SECTOR_DATA_SIZE_PX = 13;

interface ISectorSignalDotProps {
  signal?: IPublicSectorSignal;
  playerColors: Record<string, string>;
  textMode: boolean;
  testId?: string;
}

export function SectorSignalDot({
  signal,
  playerColors,
  textMode,
  testId,
}: ISectorSignalDotProps): React.JSX.Element {
  const isData = signal?.type === 'data';
  const isEmpty = signal == null;
  const playerId = signal?.type === 'player' ? signal.playerId : undefined;
  const playerColor = playerId ? playerColors[playerId] : undefined;

  return (
    <span
      className='inline-block shrink-0 rounded-full border'
      data-testid={testId}
      data-signal-type={signal?.type ?? 'empty'}
      data-player-id={playerId}
      style={{
        width: textMode
          ? 'var(--sector-text-data-size, 8px)'
          : `var(--sector-data-size, ${DEFAULT_SECTOR_DATA_SIZE_PX}px)`,
        height: textMode
          ? 'var(--sector-text-data-size, 8px)'
          : `var(--sector-data-size, ${DEFAULT_SECTOR_DATA_SIZE_PX}px)`,
        ...(isData
          ? textMode
            ? {
                borderColor: 'rgba(255, 255, 255, 0.95)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }
            : {
                borderColor: 'rgba(103, 232, 249, 0.8)',
                backgroundColor: 'rgba(165, 243, 252, 0.9)',
              }
          : isEmpty
            ? {
                borderColor: 'transparent',
                backgroundColor: 'transparent',
                opacity: 0,
              }
            : {
                backgroundColor: playerColor ?? '#888',
                borderColor: playerColor ?? '#888',
              }),
      }}
    />
  );
}

interface ISectorSignalListArcLayout {
  /**
   * Distance from the dot's parent (the SectorNodeView wrapper) to the
   * arc center, in CSS px. Larger = flatter arc; smaller = tighter curve.
   */
  radiusPx: number;
  /**
   * Diameter of each dot in CSS px. Adjacent dots are placed tangent
   * (touching, no gap) regardless of how many dots a slot has — so a
   * 4-data slot is narrower than a 6-data slot but each pair of
   * neighbouring dots still touches. The whole list is centred on the
   * wrapper.
   */
  dotDiameterPx: number;
}

interface ISectorSignalListProps {
  signals: readonly IPublicSectorSignal[];
  capacity: number;
  playerColors: Record<string, string>;
  textMode: boolean;
  slotTestIdPrefix?: string;
  showPlayerSignals?: boolean;
  /**
   * When provided (real mode only), dots are positioned along a curved
   * arc instead of a horizontal row, matching the printed sector tile's
   * data slot. The parent must be `position: relative` so each dot's
   * `position: absolute` resolves against it.
   */
  arc?: ISectorSignalListArcLayout;
}

export function SectorSignalList({
  signals,
  capacity,
  playerColors,
  textMode,
  slotTestIdPrefix,
  showPlayerSignals = true,
  arc,
}: ISectorSignalListProps): React.JSX.Element {
  const slotCount = showPlayerSignals
    ? Math.max(signals.length, capacity)
    : capacity;
  const signalIndexes = Array.from(
    { length: slotCount },
    (_, slotIndex) => slotIndex,
  );

  if (arc && !textMode && slotCount > 0) {
    // The arc holds at most `capacity` dots — the printed slot can't
    // physically fit more. Anything beyond that is OVERFLOW: per
    // rule-raw "any excess signals you mark in the sector count
    // towards winning", these markers stay in a temporary stack on
    // the right until the active player's main action finishes and
    // sector resolution settles them.
    const arcCount = Math.min(slotCount, capacity);
    const arcIndexes = Array.from({ length: arcCount }, (_, i) => i);
    const overflowSignals = signals
      .slice(capacity)
      .filter(
        (s): s is IPublicSectorSignal =>
          showPlayerSignals || s?.type !== 'player',
      );

    // Adjacent dots are tangent on the arc: the chord between two
    // consecutive dot centres equals one dot diameter. Solving
    // `2r·sin(step/2) = d` for `step` gives `step = 2·asin(d / 2r)`.
    const stepDeg =
      arcCount <= 1
        ? 0
        : (2 * Math.asin(arc.dotDiameterPx / (2 * arc.radiusPx)) * 180) /
          Math.PI;
    const totalSpanDeg = (arcCount - 1) * stepDeg;
    const dotDiameterPx = arc.dotDiameterPx;
    const startDeg = -totalSpanDeg / 2;
    // The right end of the arc — that's where the overflow bin sits.
    const endRad = (totalSpanDeg / 2) * (Math.PI / 180);
    const overflowAnchorX = Math.sin(endRad) * arc.radiusPx;
    const overflowAnchorY = arc.radiusPx - Math.cos(endRad) * arc.radiusPx;
    return (
      <>
        {arcIndexes.map((slotIndex) => {
          const signal = signals[slotIndex];
          const visibleSignal =
            !showPlayerSignals && signal?.type === 'player' ? undefined : signal;
          const angleDeg = startDeg + stepDeg * slotIndex;
          // The arc's centre of curvature points toward the sun (board
          // centre). In tile-local coordinates the arc bows upward: dot
          // Y is lowest at the centre and increases (downward) at the
          // ends.
          const rad = (angleDeg * Math.PI) / 180;
          const x = Math.sin(rad) * arc.radiusPx;
          const y = arc.radiusPx - Math.cos(rad) * arc.radiusPx;
          return (
            <span
              key={slotIndex}
              className='pointer-events-none absolute'
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                ['--sector-data-size' as string]: `${dotDiameterPx}px`,
              }}
            >
              <SectorSignalDot
                signal={visibleSignal}
                playerColors={playerColors}
                textMode={textMode}
                testId={
                  slotTestIdPrefix
                    ? `${slotTestIdPrefix}-${slotIndex}`
                    : undefined
                }
              />
            </span>
          );
        })}
        {overflowSignals.map((signal, i) => {
          // Stack overflow markers in a row to the right of the rightmost
          // arc dot, packed flush against each other. They sit horizontal
          // (no curvature) since this is just a holding area.
          const offsetX = overflowAnchorX + dotDiameterPx * (i + 1);
          const offsetY = overflowAnchorY;
          return (
            <span
              key={`overflow-${i}`}
              className='pointer-events-none absolute'
              data-testid={
                slotTestIdPrefix
                  ? `${slotTestIdPrefix}-overflow-${i}`
                  : undefined
              }
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
                ['--sector-data-size' as string]: `${dotDiameterPx}px`,
              }}
            >
              <SectorSignalDot
                signal={signal}
                playerColors={playerColors}
                textMode={textMode}
              />
            </span>
          );
        })}
      </>
    );
  }

  return (
    <>
      {signalIndexes.map((slotIndex) => {
        const signal = signals[slotIndex];
        const visibleSignal =
          !showPlayerSignals && signal?.type === 'player' ? undefined : signal;

        return (
          <SectorSignalDot
            key={slotIndex}
            signal={visibleSignal}
            playerColors={playerColors}
            textMode={textMode}
            testId={
              slotTestIdPrefix ? `${slotTestIdPrefix}-${slotIndex}` : undefined
            }
          />
        );
      })}
    </>
  );
}
