import type React from 'react';
import type { IPublicSectorSignal } from '@/types/re-exports';

export const DEFAULT_SECTOR_DATA_SIZE_PX = 21;

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
          : {
              backgroundColor: playerColor ?? '#888',
              borderColor: playerColor ?? '#888',
            }),
      }}
    />
  );
}

interface ISectorSignalListProps {
  signals: readonly IPublicSectorSignal[];
  capacity: number;
  playerColors: Record<string, string>;
  textMode: boolean;
  slotTestIdPrefix?: string;
}

export function SectorSignalList({
  signals,
  capacity,
  playerColors,
  textMode,
  slotTestIdPrefix,
}: ISectorSignalListProps): React.JSX.Element {
  const signalIndexes = Array.from(
    { length: Math.max(signals.length, capacity) },
    (_, slotIndex) => slotIndex,
  );

  return (
    <>
      {signalIndexes.map((slotIndex) => (
        <SectorSignalDot
          key={slotIndex}
          signal={signals[slotIndex]}
          playerColors={playerColors}
          textMode={textMode}
          testId={
            slotTestIdPrefix ? `${slotTestIdPrefix}-${slotIndex}` : undefined
          }
        />
      ))}
    </>
  );
}
