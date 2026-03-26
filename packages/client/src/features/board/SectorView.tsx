import { cn } from '@/lib/cn';
import type { IPublicSector } from '@/types/re-exports';

interface ISectorViewProps {
  sector: IPublicSector;
  playerColors: Record<string, string>;
  xPercent: number;
  yPercent: number;
  rotationDeg: number;
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

const SKY_TILE_ASSETS = [
  '/assets/seti/sky/0010.png',
  '/assets/seti/sky/0014.png',
  '/assets/seti/sky/0015.png',
  '/assets/seti/sky/0017.png',
  '/assets/seti/sky/0018.png',
  '/assets/seti/sky/0019.png',
  '/assets/seti/sky/0021.png',
  '/assets/seti/sky/0022.png',
] as const;

function normalizeSectorColor(raw: string): string {
  return raw.replace('-signal', '').toLowerCase();
}

function markerAsset(color: string): string {
  return SKY_TOKEN_BY_COLOR[color] ?? '/assets/seti/icons/signalToken.png';
}

function skyTileAsset(sectorId: string): string | null {
  const match = sectorId.match(/(\d+)$/);
  if (!match) return null;
  const index = Number.parseInt(match[1], 10);
  return SKY_TILE_ASSETS[index] ?? null;
}

export function SectorView({
  sector,
  playerColors,
  xPercent,
  yPercent,
  rotationDeg,
  clickable,
  highlighted,
  onClick,
}: ISectorViewProps): React.JSX.Element {
  const sectorColor = normalizeSectorColor(sector.color);
  const tileAsset = skyTileAsset(sector.sectorId);
  const dataCount = sector.dataSlots.filter((slot) => slot !== null).length;
  const markerPlayerIds = sector.markerSlots.map((m) => m.playerId);

  return (
    <button
      type='button'
      data-testid={`sector-chip-${sector.sectorId}`}
      aria-label={`Sector ${sector.sectorId}`}
      className={cn(
        'absolute z-40 h-24 w-24 rounded-full p-1 text-[10px] transition-transform',
        sector.completed
          ? 'ring-2 ring-accent-500/70'
          : 'ring-1 ring-surface-400/20',
        clickable ? 'cursor-pointer hover:scale-105' : 'cursor-default',
        highlighted && 'animate-pulse ring-2 ring-accent-500/80',
      )}
      style={{
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)`,
      }}
      onClick={onClick}
      disabled={!clickable}
      title={`${sectorColor} | data ${dataCount}/${sector.dataSlots.length}`}
    >
      {tileAsset && (
        <img
          src={tileAsset}
          alt=''
          aria-hidden
          className='absolute inset-0 h-full w-full object-contain opacity-95'
          draggable={false}
        />
      )}

      <img
        src={SIGNAL_ICON_BY_COLOR[sectorColor]}
        alt=''
        aria-hidden
        className='absolute left-[50%] top-[43%] h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 object-contain'
        draggable={false}
      />

      <div className='absolute left-[46%] top-[57%] flex -translate-x-1/2 -translate-y-1/2 gap-1'>
        {sector.dataSlots.map((slot, index) => (
          <span
            key={`${sector.sectorId}-data-${index}`}
            className={cn(
              'h-2 w-2 rounded-full border border-surface-400/90',
              slot
                ? 'bg-cyan-300 shadow-[0_0_4px_rgba(34,211,238,0.6)]'
                : 'bg-surface-900/60',
            )}
          />
        ))}
      </div>

      <div className='absolute left-[43%] top-[68%] flex -translate-x-1/2 -translate-y-1/2 gap-0.5'>
        {markerPlayerIds.slice(0, 3).map((playerId, index) => {
          const playerColor = playerColors[playerId] ?? 'white';
          return (
            <img
              key={`${sector.sectorId}-marker-${playerId}-${index}`}
              src={markerAsset(playerColor)}
              alt=''
              aria-hidden
              className='h-3 w-3 object-contain'
              draggable={false}
            />
          );
        })}
      </div>
    </button>
  );
}
