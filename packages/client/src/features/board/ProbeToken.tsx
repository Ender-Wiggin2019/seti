import { cn } from '@/lib/cn';

interface IProbeTokenProps {
  playerColor: string;
  className?: string;
}

const PROBE_ASSET_BY_COLOR: Record<string, string> = {
  red: '/assets/seti/tokens/probes/redProbe.png',
  purple: '/assets/seti/tokens/probes/purpleProbe.png',
  white: '/assets/seti/tokens/probes/whiteProbe.png',
};

export function ProbeToken({
  playerColor,
  className,
}: IProbeTokenProps): React.JSX.Element {
  const asset = PROBE_ASSET_BY_COLOR[playerColor] ?? PROBE_ASSET_BY_COLOR.white;

  return (
    <img
      src={asset}
      alt={`${playerColor} probe`}
      className={cn(
        'pointer-events-none h-5 w-5 select-none drop-shadow-md',
        className,
      )}
      draggable={false}
    />
  );
}
