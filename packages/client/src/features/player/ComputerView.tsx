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

export function ComputerView({
  computer,
  dataPoolCount,
  onPlaceData,
}: IComputerViewProps): React.JSX.Element {
  const canPlace = dataPoolCount > 0 && Boolean(onPlaceData);

  return (
    <section className='rounded border border-surface-700/55 bg-surface-950/65 p-2'>
      <div className='mb-1.5 flex items-center justify-between'>
        <p className='font-mono text-[10px] uppercase tracking-wide text-text-500'>
          Computer
        </p>
        <p className='font-mono text-[10px] text-text-400'>
          {computer.columns.length} columns
        </p>
      </div>

      <div className='flex flex-col gap-1'>
        {/* Top row */}
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
            const label = getRewardLabel(col.topReward);
            return (
              <button
                key={`top-${i}`}
                type='button'
                data-testid={`computer-slot-top-${i}`}
                className={[
                  'relative flex h-7 w-7 items-center justify-center rounded border bg-surface-900/75 transition-colors',
                  occupied
                    ? 'border-cyan-300/80'
                    : interactive
                      ? 'border-accent-500/90 hover:bg-accent-500/15'
                      : 'border-surface-700/60',
                ].join(' ')}
                onClick={() => interactive && onPlaceData?.('top', i)}
                aria-label={`Computer top slot ${i + 1}`}
              >
                {occupied ? (
                  <img
                    src='/assets/seti/tokens/data.png'
                    alt='Data token'
                    className='h-5 w-5'
                  />
                ) : label ? (
                  <span className='text-[8px] text-text-400'>{label}</span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Bottom row (only columns with tech) */}
        {computer.columns.some((c) => c.hasBottomSlot) && (
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
              const label = getRewardLabel(col.bottomReward);
              return (
                <button
                  key={`bottom-${i}`}
                  type='button'
                  data-testid={`computer-slot-bottom-${i}`}
                  className={[
                    'relative flex h-7 w-7 items-center justify-center rounded border bg-surface-900/75 transition-colors',
                    occupied
                      ? 'border-cyan-300/80'
                      : interactive
                        ? 'border-accent-500/90 hover:bg-accent-500/15'
                        : 'border-surface-700/60',
                  ].join(' ')}
                  onClick={() => interactive && onPlaceData?.('bottom', i)}
                  aria-label={`Computer bottom slot ${i + 1}`}
                >
                  {occupied ? (
                    <img
                      src='/assets/seti/tokens/data.png'
                      alt='Data token'
                      className='h-5 w-5'
                    />
                  ) : label ? (
                    <span className='text-[8px] text-text-400'>{label}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
