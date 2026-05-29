import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { resolvePlayerColor } from '@/lib/playerColor';

interface IProbeTokenProps {
  playerColor: string;
  className?: string;
}

/**
 * Probe silhouette uses the white-probe PNG as an alpha mask and
 * paints it with the player's hex color via `mask-image` + a solid
 * `backgroundColor`. This way every player slug — including the
 * rulebook's green/orange that don't ship as standalone art — renders
 * with the correct retail-piece tint from a single source asset.
 *
 * The drop-shadow keeps the metallic dimensionality of the original
 * sculpt; the `mask-image` shape doesn't carry shading by itself, so
 * the shadow gives the chip enough silhouette weight to read on the
 * solar board background.
 */
const PROBE_MASK = '/assets/seti/tokens/probes/whiteProbe.png';

export function ProbeToken({
  playerColor,
  className,
}: IProbeTokenProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const fill = resolvePlayerColor(playerColor) ?? '#e6eded';

  return (
    <span
      role='img'
      aria-label={t('client.probe_token.aria_label', {
        playerColor,
        defaultValue: `${playerColor} probe`,
      })}
      className={cn(
        'pointer-events-none inline-block h-5 w-5 select-none drop-shadow-md',
        className,
      )}
      style={{
        backgroundColor: fill,
        WebkitMaskImage: `url(${PROBE_MASK})`,
        maskImage: `url(${PROBE_MASK})`,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  );
}
