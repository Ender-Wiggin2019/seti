import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { resolvePlayerColor } from '@/lib/playerColor';
import { TokenCountBadge } from './TokenCountBadge';

interface IProbeTokenProps {
  playerColor: string;
  count?: number;
  className?: string;
}

const PROBE_ASSET_BY_COLOR: Record<string, string> = {
  '#f00': '/assets/seti/tokens/probes/redProbe.png',
  '#ff0000': '/assets/seti/tokens/probes/redProbe.png',
  '#801da1': '/assets/seti/tokens/probes/purpleProbe.png',
  '#e6eded': '/assets/seti/tokens/probes/whiteProbe.png',
  purple: '/assets/seti/tokens/probes/purpleProbe.png',
  red: '/assets/seti/tokens/probes/redProbe.png',
  white: '/assets/seti/tokens/probes/whiteProbe.png',
};
const FALLBACK_PROBE_MASK = '/assets/seti/tokens/probes/whiteProbe.png';

function resolveProbeAsset(playerColor: string, fill: string): string | null {
  const rawKey = playerColor.trim().toLowerCase();
  const fillKey = fill.trim().toLowerCase();
  return PROBE_ASSET_BY_COLOR[rawKey] ?? PROBE_ASSET_BY_COLOR[fillKey] ?? null;
}

export function ProbeToken({
  playerColor,
  count = 1,
  className,
}: IProbeTokenProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const fill = resolvePlayerColor(playerColor) ?? '#e6eded';
  const probeAsset = resolveProbeAsset(playerColor, fill);
  const label = t('client.probe_token.aria_label', {
    playerColor,
    defaultValue: `${playerColor} probe`,
  });
  return (
    <span
      className={cn(
        'pointer-events-none relative inline-flex h-5 w-5 select-none items-center justify-center',
        className,
      )}
      data-testid={probeAsset ? 'probe-token' : 'probe-token-fallback'}
    >
      <img
        src={probeAsset ?? FALLBACK_PROBE_MASK}
        alt={label}
        className='h-full w-full select-none object-contain drop-shadow-md'
        draggable={false}
      />
      {!probeAsset ? (
        <span
          aria-hidden='true'
          className='absolute inset-0 opacity-70 mix-blend-multiply'
          data-testid='probe-token-tint'
          style={{
            backgroundColor: fill,
            WebkitMaskImage: `url(${FALLBACK_PROBE_MASK})`,
            maskImage: `url(${FALLBACK_PROBE_MASK})`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
          }}
        />
      ) : null}
      <TokenCountBadge count={count} />
    </span>
  );
}
