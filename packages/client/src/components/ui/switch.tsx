import { cn } from '@/lib/cn';

/**
 * Switch — toggle with a metal track and anodized-blue active state.
 * Off state is a dark well with a hairline metal rim.
 * On state lights the track with the primary accent.
 */
interface ISwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  id,
  'aria-label': ariaLabel,
}: ISwitchProps): React.JSX.Element {
  return (
    <button
      type='button'
      id={id}
      role='switch'
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        // Track
        'relative inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer items-center',
        'rounded-full p-px',
        'border border-[color:var(--metal-edge)]',
        'shadow-hairline-inset',
        'transition-[background-color,box-shadow,border-color] duration-200',
        // Off vs on — use design-system signal tokens so the switch lives in
        // the same palette as buttons, badges, and indicators.
        checked
          ? cn(
              'bg-[color-mix(in_oklab,var(--signal-blue-lo)_88%,var(--surface-instrument))]',
              'border-[color:var(--signal-blue-lo)]',
              'shadow-[inset_0_1px_0_oklch(0.82_0.08_240/0.42),0_0_0_1px_oklch(0.68_0.11_240/0.22)]',
            )
          : 'bg-[var(--surface-void)]',
        'focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background-950',
        'focus-visible:ring-[var(--signal-blue)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      {/* Thumb — bevelled metal bead */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none block h-[18px] w-[18px] rounded-full',
          'bg-[oklch(0.92_0.008_260)]',
          'shadow-[inset_0_-1px_0_oklch(0.60_0.02_260/0.4),0_1px_2px_oklch(0.08_0.018_260/0.6)]',
          'transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
          checked ? 'translate-x-[18px]' : 'translate-x-0',
        )}
      />
    </button>
  );
}
