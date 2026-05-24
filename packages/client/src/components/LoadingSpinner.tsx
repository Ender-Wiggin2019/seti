import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

interface ILoadingSpinnerProps {
  label?: string;
  /**
   * `inline` — compact ring + label, sits in a flow.
   * `block`  — centered scanning ring with mission-log label.
   * `scanline` — full-width container with the scanline sweep recipe.
   */
  variant?: 'inline' | 'block' | 'scanline';
  className?: string;
}

/**
 * LoadingSpinner — three loading affordances.
 *
 * - `inline` and `block` use a scanning-dish ring (anodized blue) with a
 *   mono micro-label. Instrumentation, not marketing.
 * - `scanline` is the spec-mandated container loader: a 1px line sweeps
 *   the container at 1.6s exponential ease-out, paired with a mission-log
 *   status text ('Establishing uplink…').
 */
export function LoadingSpinner(props: ILoadingSpinnerProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const variant = props.variant ?? 'inline';
  const label = props.label ?? t('client.common.loading');

  if (variant === 'scanline') {
    return (
      <div
        className={cn(
          'scanline relative w-full overflow-hidden',
          'rounded-[6px]',
          'border border-[color:var(--metal-edge-soft)]',
          'bg-[oklch(0.13_0.025_258/0.6)]',
          'px-5 py-6',
          props.className,
        )}
        role='status'
        aria-live='polite'
      >
        <div className='flex items-center gap-2.5'>
          <span
            aria-hidden
            className='signal-dot'
            data-signal='blue'
            data-active='true'
          />
          <span className='font-mono text-[0.6875rem] uppercase tracking-microlabel text-text-300'>
            {label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-3',
        variant === 'block' && 'flex-col justify-center py-10',
        props.className,
      )}
      role='status'
      aria-live='polite'
    >
      <span className='relative inline-flex h-5 w-5 items-center justify-center'>
        <span
          aria-hidden
          className='absolute inset-0 rounded-full border border-[color:var(--metal-edge)]'
        />
        <span
          aria-hidden
          className='absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[oklch(0.74_0.12_240)] border-r-[oklch(0.74_0.12_240/0.5)]'
          style={{ animationDuration: '1.1s' }}
        />
        <span
          aria-hidden
          className='relative h-1 w-1 rounded-full bg-[oklch(0.82_0.10_240)] shadow-[0_0_4px_oklch(0.68_0.11_240/0.8)]'
        />
      </span>
      <span className='font-mono text-[0.6875rem] uppercase tracking-microlabel text-text-500'>
        {label}
      </span>
    </div>
  );
}
