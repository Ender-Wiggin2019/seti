import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

interface ILoadingSpinnerProps {
  label?: string;
  /** `inline` sits in a flow; `block` centers itself with instrument padding. */
  variant?: 'inline' | 'block';
}

/**
 * LoadingSpinner — a scanning-dish ring in anodized blue.
 *
 * The outer ring rotates slowly (2.5s); the inner arc rotates fast
 * to feel like a detector sweep. The label renders as a mono
 * micro-label — instrumentation, not marketing.
 */
export function LoadingSpinner(props: ILoadingSpinnerProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const variant = props.variant ?? 'inline';
  const label = props.label ?? t('client.common.loading');

  return (
    <div
      className={cn(
        'inline-flex items-center gap-3',
        variant === 'block' && 'flex-col justify-center py-10',
      )}
      role='status'
      aria-live='polite'
    >
      <span className='relative inline-flex h-5 w-5 items-center justify-center'>
        {/* Outer hairline ring — always present, not spinning. */}
        <span
          aria-hidden
          className='absolute inset-0 rounded-full border border-[color:var(--metal-edge)]'
        />
        {/* Spinning arc — accent-500, 270° arc via conic mask trick. */}
        <span
          aria-hidden
          className='absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[oklch(0.74_0.12_240)] border-r-[oklch(0.74_0.12_240/0.5)]'
          style={{ animationDuration: '1.1s' }}
        />
        {/* Inner dot — the probe. */}
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
