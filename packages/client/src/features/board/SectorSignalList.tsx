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

interface ISectorSignalListProps {
  signals: readonly IPublicSectorSignal[];
  capacity: number;
  playerColors: Record<string, string>;
  textMode: boolean;
  slotTestIdPrefix?: string;
  showPlayerSignals?: boolean;
}

export function SectorSignalList({
  signals,
  capacity,
  playerColors,
  textMode,
  slotTestIdPrefix,
  showPlayerSignals = true,
}: ISectorSignalListProps): React.JSX.Element {
  const slotCount = showPlayerSignals
    ? Math.max(signals.length, capacity)
    : capacity;
  const signalIndexes = Array.from(
    { length: slotCount },
    (_, slotIndex) => slotIndex,
  );

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
