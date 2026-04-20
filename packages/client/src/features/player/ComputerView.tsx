import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import type { IPublicComputerState } from '@/types/re-exports';

interface IComputerViewProps {
  computer: IPublicComputerState;
  dataPoolCount: number;
  onPlaceData?: (row: 'top' | 'bottom', columnIndex: number) => void;
}

function canPlaceTopSlot(
  computer: IPublicComputerState,
  columnIndex: number,
): boolean {
  const col = computer.columns[columnIndex];
  if (col.topFilled) return false;
  return computer.columns.slice(0, columnIndex).every((c) => c.topFilled);
}

function canPlaceBottomSlot(
  computer: IPublicComputerState,
  columnIndex: number,
): boolean {
  const col = computer.columns[columnIndex];
  if (!col.hasBottomSlot) return false;
  if (!col.topFilled) return false;
  return !col.bottomFilled;
}

function getRewardLabel(
  reward: {
    vp?: number;
    credits?: number;
    energy?: number;
    publicity?: number;
    drawCard?: number;
    tuckIncome?: number;
  } | null,
): string | null {
  if (!reward) return null;
  if (reward.vp) return `${reward.vp}VP`;
  if (reward.credits) return `${reward.credits}¢`;
  if (reward.energy) return `${reward.energy}⚡`;
  if (reward.publicity) return `${reward.publicity}★`;
  if (reward.drawCard) return `${reward.drawCard}🃏`;
  if (reward.tuckIncome) return 'Tuck';
  return null;
}

interface ISlotProps {
  occupied: boolean;
  interactive: boolean;
  label: string | null;
  onClick: () => void;
  testId: string;
  ariaLabel: string;
}

function Slot({
  occupied,
  interactive,
  label,
  onClick,
  testId,
  ariaLabel,
}: ISlotProps): React.JSX.Element {
  return (
    <button
      type='button'
      data-testid={testId}
      aria-label={ariaLabel}
      disabled={!interactive}
      className={cn(
        'relative flex h-7 w-7 items-center justify-center rounded-[3px] transition-[background,border-color,box-shadow] duration-150',
        'focus-visible:outline-none focus-visible:shadow-focus-ring',
        occupied
          ? [
              'border border-[color:var(--metal-edge)] bg-[oklch(0.13_0.02_260)]',
              'shadow-[inset_0_1px_0_oklch(0.96_0.008_260/0.15)]',
            ]
          : interactive
            ? [
                'border border-accent-500/60 bg-accent-500/[0.07]',
                'shadow-[inset_0_0_0_1px_oklch(0.68_0.11_240/0.15)]',
                'hover:bg-accent-500/15 hover:border-accent-500/90',
                'cursor-pointer',
              ]
            : [
                'border border-[color:var(--metal-edge-soft)] bg-background-900/70',
                'shadow-hairline-inset',
                'cursor-not-allowed',
              ],
      )}
      onClick={onClick}
    >
      {occupied ? (
        <>
          <img
            src='/assets/seti/tokens/data.png'
            alt=''
            aria-hidden
            className='h-5 w-5'
          />
          <span
            aria-hidden
            className='pointer-events-none absolute inset-0 rounded-[3px] bg-[radial-gradient(circle_at_center,oklch(0.96_0.008_260/0.12),transparent_70%)]'
          />
        </>
      ) : label ? (
        <span
          className={cn(
            'font-mono text-[8px] tracking-[0.04em]',
            interactive ? 'text-accent-400' : 'text-text-500',
          )}
        >
          {label}
        </span>
      ) : null}
    </button>
  );
}

export function ComputerView({
  computer,
  dataPoolCount,
  onPlaceData,
}: IComputerViewProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const canPlace = dataPoolCount > 0 && Boolean(onPlaceData);
  const hasBottomRow = computer.columns.some((c) => c.hasBottomSlot);

  return (
    <section className='instrument-panel p-2'>
      <div className='section-head mb-1.5'>
        <span aria-hidden className='section-head__tick' />
        <p className='micro-label'>
          {t('client.computer_view.title', { defaultValue: 'Computer' })}
        </p>
        <div aria-hidden className='section-head__rule' />
        <span className='font-mono text-[10px] tabular-nums text-text-500'>
          {computer.columns.length}
          <span className='opacity-50'> COL</span>
        </span>
      </div>

      <div className='flex flex-col gap-1'>
        <div
          className='grid gap-1'
          style={{
            gridTemplateColumns: `repeat(${computer.columns.length}, 1fr)`,
          }}
        >
          {computer.columns.map((col, i) => {
            const occupied = col.topFilled;
            const available = canPlaceTopSlot(computer, i);
            const interactive = canPlace && !occupied && available;
            return (
              <Slot
                key={`top-${i}`}
                occupied={occupied}
                interactive={interactive}
                label={getRewardLabel(col.topReward)}
                onClick={() => interactive && onPlaceData?.('top', i)}
                testId={`computer-slot-top-${i}`}
                ariaLabel={`Computer top slot ${i + 1}`}
              />
            );
          })}
        </div>

        {hasBottomRow ? (
          <div
            className='grid gap-1'
            style={{
              gridTemplateColumns: `repeat(${computer.columns.length}, 1fr)`,
            }}
          >
            {computer.columns.map((col, i) => {
              if (!col.hasBottomSlot) {
                return <div key={`bottom-${i}`} className='h-7 w-7' />;
              }
              const occupied = col.bottomFilled;
              const available = canPlaceBottomSlot(computer, i);
              const interactive = canPlace && !occupied && available;
              return (
                <Slot
                  key={`bottom-${i}`}
                  occupied={occupied}
                  interactive={interactive}
                  label={getRewardLabel(col.bottomReward)}
                  onClick={() => interactive && onPlaceData?.('bottom', i)}
                  testId={`computer-slot-bottom-${i}`}
                  ariaLabel={`Computer bottom slot ${i + 1}`}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
