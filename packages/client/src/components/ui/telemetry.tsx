import { cn } from '@/lib/cn';

/**
 * TelemetryTile — a recessed mono readout used in clusters of 2-6.
 * Mission-log label above, large mono value below, optional sub-readout
 * and signal indicator at the right edge.
 *
 * Per .impeccable.md §Component Vocabulary: never standalone. Always
 * grouped in a CSS grid with at least one sibling tile.
 */
export type TSignal = 'blue' | 'violet' | 'green' | 'amber' | 'red';

interface ITelemetryTileProps {
  label: string;
  value: React.ReactNode;
  /** Small caption below the value — units, deltas, etc. */
  sub?: React.ReactNode;
  /** Tints the value with the matching signal color. */
  signal?: TSignal;
  /** When true, the signal indicator pulses (active state). */
  active?: boolean;
  className?: string;
}

export function TelemetryTile({
  label,
  value,
  sub,
  signal,
  active,
  className,
}: ITelemetryTileProps): React.JSX.Element {
  return (
    <div
      className={cn('telemetry-tile', className)}
      data-signal={signal}
      role='group'
      aria-label={label}
    >
      <div className='telemetry-tile__label'>
        <span>{label}</span>
        {signal && (
          <span
            aria-hidden
            className='signal-dot ml-auto'
            data-signal={signal}
            data-active={active ? 'true' : 'false'}
          />
        )}
      </div>
      <div className='telemetry-tile__value'>{value}</div>
      {sub != null && <div className='telemetry-tile__sub'>{sub}</div>}
    </div>
  );
}

/**
 * SignalIndicator — 8px dot with matched glow plus an adjacent label.
 * Per .impeccable.md: meaning is always paired with a textual label;
 * never color-only.
 */
interface ISignalIndicatorProps {
  signal: TSignal | 'off';
  label: string;
  active?: boolean;
  className?: string;
}

export function SignalIndicator({
  signal,
  label,
  active,
  className,
}: ISignalIndicatorProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2',
        'font-mono text-[0.6875rem] uppercase tracking-microlabel',
        SIGNAL_TEXT[signal],
        className,
      )}
    >
      <span
        aria-hidden
        className='signal-dot'
        data-signal={signal}
        data-active={active ? 'true' : 'false'}
      />
      {label}
    </span>
  );
}

const SIGNAL_TEXT: Record<TSignal | 'off', string> = {
  blue: 'text-[oklch(0.86_0.10_240)]',
  violet: 'text-[oklch(0.84_0.13_305)]',
  green: 'text-[oklch(0.86_0.13_155)]',
  amber: 'text-[oklch(0.88_0.13_75)]',
  red: 'text-[oklch(0.84_0.16_25)]',
  off: 'text-text-500',
};

/**
 * ReadoutRow — `LABEL: VALUE` row, optionally with a trailing signal indicator.
 * The connective tissue of every panel.
 */
interface IReadoutRowProps {
  label: string;
  value: React.ReactNode;
  signal?: TSignal | 'off';
  signalActive?: boolean;
  className?: string;
}

export function ReadoutRow({
  label,
  value,
  signal,
  signalActive,
  className,
}: IReadoutRowProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 py-2',
        className,
      )}
    >
      <span className='micro-label'>{label}</span>
      <span className='flex items-center gap-2'>
        <span className='readout text-sm text-text-100'>{value}</span>
        {signal && (
          <span
            aria-hidden
            className='signal-dot'
            data-signal={signal}
            data-active={signalActive ? 'true' : 'false'}
          />
        )}
      </span>
    </div>
  );
}

/**
 * Bulletin — a mission-log bulletin block. Used as a simple inline
 * notice (not the toast — see Toaster). Timestamp + title + body.
 */
interface IBulletinProps {
  timestamp?: string;
  title: string;
  body?: React.ReactNode;
  signal?: TSignal;
  className?: string;
}

export function Bulletin({
  timestamp,
  title,
  body,
  signal,
  className,
}: IBulletinProps): React.JSX.Element {
  return (
    <article
      className={cn(
        'relative rounded-[5px] overflow-hidden',
        'bg-[oklch(0.13_0.025_258/0.85)] border border-[color:var(--metal-edge-soft)]',
        'p-3.5',
        className,
      )}
    >
      {/* 1px hairline accent on the bottom edge — never a left stripe. */}
      {signal && (
        <span
          aria-hidden
          className='pointer-events-none absolute inset-x-0 bottom-0 h-px'
          style={{ background: `var(--signal-${signal})` }}
        />
      )}
      <div className='flex items-start gap-3'>
        {timestamp && (
          <span className='font-mono text-[0.6875rem] tracking-readout text-text-700 pt-0.5 tabular-nums'>
            {timestamp}
          </span>
        )}
        <div className='flex-1 min-w-0'>
          <p className='font-body text-sm font-medium text-text-100 leading-snug'>
            {title}
          </p>
          {body && (
            <p className='mt-1 text-xs leading-relaxed text-text-500'>
              {body}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
