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
        'transition-[background-color,box-shadow] duration-200',
        // Off vs on
        checked
          ? 'bg-[oklch(0.58_0.10_240)] border-[oklch(0.42_0.10_240)] shadow-[inset_0_1px_0_oklch(0.82_0.10_240/0.55),0_0_0_1px_oklch(0.68_0.11_240/0.35)]'
          : 'bg-[oklch(0.15_0.02_260)]',
        'focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background-950',
        'focus-visible:ring-[oklch(0.68_0.11_240)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      {/* Thumb — bevelled metal bead */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none block h-[18px] w-[18px] rounded-full',
          'bg-gradient-to-b from-[oklch(0.98_0.008_260)] to-[oklch(0.85_0.01_260)]',
          'shadow-[inset_0_-1px_0_oklch(0.60_0.02_260/0.4),0_1px_2px_oklch(0.08_0.018_260/0.6)]',
          'transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
          checked ? 'translate-x-[18px]' : 'translate-x-0',
        )}
      />
    </button>
  );
}
