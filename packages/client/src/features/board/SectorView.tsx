import { cn } from '@/lib/cn';
import type { IPublicSector } from '@/types/re-exports';

interface ISectorViewProps {
  sector: IPublicSector;
  playerColors: Record<string, string>;
  xPercent: number;
  yPercent: number;
  clickable: boolean;
  highlighted: boolean;
  onClick: () => void;
}

const SIGNAL_ICON_BY_COLOR: Record<string, string> = {
  red: '/assets/seti/icons/signalRed.png',
  yellow: '/assets/seti/icons/signalYellow.png',
  blue: '/assets/seti/icons/signalBlue.png',
  black: '/assets/seti/icons/signalBlack.png',
};

const SKY_TOKEN_BY_COLOR: Record<string, string> = {
  red: '/assets/seti/tokens/sky/redSky.png',
  purple: '/assets/seti/tokens/sky/purpleSky.png',
  white: '/assets/seti/tokens/sky/whiteSky.png',
};

function normalizeSectorColor(raw: string): string {
  return raw.replace('-signal', '');
}

function markerAsset(color: string): string {
  return SKY_TOKEN_BY_COLOR[color] ?? '/assets/seti/icons/signalToken.png';
}

export function SectorView({
  sector,
  playerColors,
  xPercent,
  yPercent,
  clickable,
  highlighted,
  onClick,
}: ISectorViewProps): React.JSX.Element {
  const sectorColor = normalizeSectorColor(sector.color);
  const dataCount = sector.dataSlots.filter((slot) => slot !== null).length;
  const markerPlayerIds = sector.markerSlots.map((m) => m.playerId);

  return (
    <button
      type='button'
      data-testid={`sector-chip-${sector.sectorId}`}
      aria-label={`Sector ${sector.sectorId}`}
      className={cn(
        'absolute z-40 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-surface-900/90 p-1 text-[10px] shadow-lg backdrop-blur-sm transition-all',
        sector.completed
          ? 'border-accent-400/90 ring-1 ring-accent-500/60'
          : 'border-surface-600/80',
        clickable
          ? 'cursor-pointer hover:scale-105 hover:border-accent-400/70'
          : 'cursor-default',
        highlighted &&
          'animate-pulse border-accent-500 ring-2 ring-accent-500/60',
      )}
      style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
      onClick={onClick}
      disabled={!clickable}
      title={`${sectorColor} | data ${dataCount}/${sector.dataSlots.length}`}
    >
      <img
        src={SIGNAL_ICON_BY_COLOR[sectorColor]}
        alt=''
        aria-hidden
        className='mx-auto h-3 w-3 object-contain'
        draggable={false}
      />

      <div className='mt-0.5 flex justify-center gap-0.5'>
        {sector.dataSlots.map((slot, index) => (
          <span
            key={`${sector.sectorId}-data-${index}`}
            className={cn(
              'h-1.5 w-1.5 rounded-full border border-surface-500/80',
              slot ? 'bg-cyan-300' : 'bg-transparent',
            )}
          />
        ))}
      </div>

      <div className='mt-0.5 flex justify-center gap-0.5'>
        {markerPlayerIds.slice(0, 3).map((playerId, index) => {
          const playerColor = playerColors[playerId] ?? 'white';
          return (
            <img
              key={`${sector.sectorId}-marker-${playerId}-${index}`}
              src={markerAsset(playerColor)}
              alt=''
              aria-hidden
              className='h-2.5 w-2.5 object-contain'
              draggable={false}
            />
          );
        })}
      </div>
    </button>
  );
}
