import { cn } from '@/lib/cn';

interface IProbeTokenProps {
  playerColor: string;
  xPercent: number;
  yPercent: number;
  offsetIndex: number;
  offsetCount: number;
}

const PROBE_ASSET_BY_COLOR: Record<string, string> = {
  red: '/assets/seti/tokens/probes/redProbe.png',
  purple: '/assets/seti/tokens/probes/purpleProbe.png',
  white: '/assets/seti/tokens/probes/whiteProbe.png',
};

function tokenOffset(index: number, count: number): { x: number; y: number } {
  if (count <= 1) return { x: 0, y: 0 };
  const radius = 8;
  const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

export function ProbeToken({
  playerColor,
  xPercent,
  yPercent,
  offsetIndex,
  offsetCount,
}: IProbeTokenProps): React.JSX.Element {
  const offset = tokenOffset(offsetIndex, offsetCount);
  const asset = PROBE_ASSET_BY_COLOR[playerColor] ?? PROBE_ASSET_BY_COLOR.white;

  return (
    <img
      src={asset}
      alt={`${playerColor} probe`}
      className={cn(
        'pointer-events-none absolute z-40 h-5 w-5 select-none drop-shadow-md',
      )}
      style={{
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
      }}
      draggable={false}
    />
  );
}
