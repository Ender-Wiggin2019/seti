import { cn } from '@/lib/cn';
import type { IPublicSector } from '@/types/re-exports';

interface ISectorViewProps {
  sector: IPublicSector;
  playerColors: Record<string, string>;
  slotIndex: number;
  sectorImageSrc: string;
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

const DATA_TOKEN_SRC = '/assets/seti/tokens/data.png';
const SECTOR_ARC_DEG = 45;
const SECTOR_GAP_DEG = 4;
const OUTER_RADIUS_PERCENT = 49.5;
const INNER_RADIUS_PERCENT = 41.5;
const ARC_STEPS = 14;

function normalizeSectorColor(raw: string): string {
  return raw.replace('-signal', '').toLowerCase();
}

function markerAsset(color: string): string {
  return SKY_TOKEN_BY_COLOR[color] ?? '/assets/seti/icons/signalToken.png';
}

function signalAsset(color: string): string {
  return SIGNAL_ICON_BY_COLOR[color] ?? '/assets/seti/icons/signalToken.png';
}

function tokenPlacementStyle(
  xPercent: number,
  yPercent: number,
): React.CSSProperties {
  return {
    left: `calc(${xPercent}% - 15px)`,
    top: `calc(${yPercent}% - 15px)`,
    width: '30px',
    height: '30px',
    transform: 'translate(0px, 0px)',
  };
}

function polarPoint(
  radiusPercent: number,
  angleDeg: number,
): { x: number; y: number } {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: 50 + Math.cos(angleRad) * radiusPercent,
    y: 50 + Math.sin(angleRad) * radiusPercent,
  };
}

function buildSectorClipPath(slotIndex: number): string {
  const centerAngle = -90 + slotIndex * SECTOR_ARC_DEG;
  const startAngle = centerAngle - SECTOR_ARC_DEG / 2 + SECTOR_GAP_DEG / 2;
  const endAngle = centerAngle + SECTOR_ARC_DEG / 2 - SECTOR_GAP_DEG / 2;
  const points: string[] = [];

  for (let i = 0; i <= ARC_STEPS; i += 1) {
    const t = i / ARC_STEPS;
    const angle = startAngle + (endAngle - startAngle) * t;
    const p = polarPoint(OUTER_RADIUS_PERCENT, angle);
    points.push(`${p.x}% ${p.y}%`);
  }

  for (let i = ARC_STEPS; i >= 0; i -= 1) {
    const t = i / ARC_STEPS;
    const angle = startAngle + (endAngle - startAngle) * t;
    const p = polarPoint(INNER_RADIUS_PERCENT, angle);
    points.push(`${p.x}% ${p.y}%`);
  }

  return `polygon(${points.join(',')})`;
}

function sectorTokenPoint(
  slotIndex: number,
  radiusPercent: number,
  offsetDeg: number,
): { x: number; y: number } {
  const centerAngle = -90 + slotIndex * SECTOR_ARC_DEG;
  return polarPoint(radiusPercent, centerAngle + offsetDeg);
}

export function SectorView({
  sector,
  playerColors,
  slotIndex,
  sectorImageSrc,
  clickable,
  highlighted,
  onClick,
}: ISectorViewProps): React.JSX.Element {
  const sectorColor = normalizeSectorColor(sector.color);
  const dataCount = sector.dataSlots.filter((slot) => slot !== null).length;
  const markerPlayerIds = sector.markerSlots.map((marker) => marker.playerId);
  const clipPath = buildSectorClipPath(slotIndex);
  const dataOffsets = [-9, -4.5, 0, 4.5, 9, 13.5];
  const markerOffsets = [-6, 0, 6, 12, 18, 24, 30, 36];
  const overflowMarkerCount = Math.max(
    0,
    markerPlayerIds.length - markerOffsets.length,
  );

  return (
    <button
      type='button'
      data-testid={`sector-chip-${sector.sectorId}`}
      aria-label={`Sector ${sector.sectorId}`}
      className={cn(
        'component-wrap seti-sector-chip absolute inset-0 z-40 p-0 text-[10px] transition-all duration-200',
        clickable && 'selectable',
        clickable ? 'cursor-pointer hover:brightness-110' : 'cursor-default',
        highlighted && 'animate-pulse',
      )}
      style={{ clipPath }}
      onClick={onClick}
      disabled={!clickable}
      title={`${sectorColor} | data ${dataCount}/${sector.dataSlots.length}`}
    >
      <div className='relative h-full w-full'>
        <img
          src={sectorImageSrc}
          alt=''
          aria-hidden
          className='seti-sector-slice absolute inset-0 h-full w-full object-cover'
          draggable={false}
        />

        <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(6,10,18,0.05)_0%,rgba(6,10,18,0.35)_55%,rgba(6,10,18,0.8)_100%)]' />

        <div
          className='absolute -translate-x-1/2 -translate-y-1/2'
          style={{
            ...tokenPlacementStyle(
              sectorTokenPoint(slotIndex, 45.5, -15).x,
              sectorTokenPoint(slotIndex, 45.5, -15).y,
            ),
          }}
        >
          <img
            src={signalAsset(sectorColor)}
            alt=''
            aria-hidden
            className='h-6 w-6 object-contain drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]'
            draggable={false}
          />
        </div>

        <div className='absolute inset-0'>
          {sector.dataSlots.map((slot, index) => {
            const position = sectorTokenPoint(
              slotIndex,
              47,
              dataOffsets[index] ?? dataOffsets[dataOffsets.length - 1],
            );

            if (slot === null) {
              return (
                <span
                  key={`${sector.sectorId}-data-empty-${index}`}
                  data-testid={`sector-data-empty-${index}`}
                  className='absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-surface-200/50 bg-surface-950/80'
                  style={{ left: `${position.x}%`, top: `${position.y}%` }}
                />
              );
            }

            return (
              <div
                key={`${sector.sectorId}-data-token-${index}`}
                data-testid={`sector-data-filled-${index}`}
                className='component-wrap cgo-component type-undefined'
                style={tokenPlacementStyle(position.x, position.y)}
              >
                <div className='component-inner component-inner data'>
                  <div
                    className='component-display'
                    style={{
                      backgroundImage: `url(${DATA_TOKEN_SRC})`,
                      width: '100%',
                      height: '100%',
                      transform: 'scale(1.8)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className='absolute inset-0'>
          {markerPlayerIds
            .slice(0, markerOffsets.length)
            .map((playerId, index) => {
              const position = sectorTokenPoint(
                slotIndex,
                44.2,
                markerOffsets[index],
              );
              const playerColor = playerColors[playerId] ?? 'white';
              return (
                <div
                  key={`${sector.sectorId}-marker-${playerId}-${index}`}
                  data-testid={`sector-marker-${index}`}
                  className='component-wrap cgo-component type-undefined'
                  style={tokenPlacementStyle(position.x, position.y)}
                >
                  <div className='component-inner component-inner playerMarker'>
                    <div
                      className='component-display'
                      style={{
                        backgroundImage: `url(${markerAsset(playerColor)})`,
                        width: '100%',
                        height: '100%',
                        transform: 'scale(2)',
                      }}
                    />
                  </div>
                </div>
              );
            })}

          {overflowMarkerCount > 0 && (
            <span className='absolute left-1/2 top-[9%] -translate-x-1/2 rounded bg-surface-950/70 px-1.5 py-0.5 font-mono text-[10px] text-text-100'>
              +{overflowMarkerCount}
            </span>
          )}

          {sector.completed && (
            <span className='absolute left-1/2 top-[16%] -translate-x-1/2 rounded bg-accent-500/85 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-surface-950'>
              done
            </span>
          )}
        </div>

        <div
          className={cn(
            'absolute inset-0 transition-all duration-200',
            sector.completed
              ? 'ring-2 ring-inset ring-accent-400/70'
              : 'ring-1 ring-inset ring-surface-200/30',
          )}
          style={{ clipPath }}
        />

        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-200',
            highlighted
              ? 'bg-accent-500/12 opacity-100'
              : 'bg-transparent opacity-0',
          )}
          style={{ clipPath }}
          aria-hidden
        />

        <div className='absolute left-1/2 top-[4%] -translate-x-1/2 rounded bg-surface-950/55 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-text-100'>
          {sector.sectorId}
        </div>

        <div className='absolute left-1/2 top-[24%] -translate-x-1/2 rounded bg-surface-950/55 px-1.5 py-0.5 font-mono text-[9px] text-text-200'>
          {dataCount}/{sector.dataSlots.length}
        </div>

        <div className='sr-only'>
          {markerPlayerIds.map((playerId, index) => (
            <span key={`${sector.sectorId}-marker-id-${playerId}-${index}`}>
              {playerId}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
