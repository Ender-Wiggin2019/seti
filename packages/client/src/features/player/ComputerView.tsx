import type { IPublicComputerState } from '@/types/re-exports';

interface IComputerViewProps {
  computer: IPublicComputerState;
  dataPoolCount: number;
  onPlaceData?: (slotIndex: number) => void;
}

function isTopSlotAvailable(
  topSlots: Array<string | null>,
  slotIndex: number,
): boolean {
  if (topSlots[slotIndex]) {
    return false;
  }
  return topSlots.slice(0, slotIndex).every(Boolean);
}

function isBottomSlotAvailable(
  topSlots: Array<string | null>,
  bottomSlots: Array<string | null>,
  slotIndex: number,
): boolean {
  if (bottomSlots[slotIndex]) {
    return false;
  }
  if (!topSlots[slotIndex]) {
    return false;
  }
  return bottomSlots.slice(0, slotIndex).every(Boolean);
}

function slotIsAvailable(
  computer: IPublicComputerState,
  absoluteIndex: number,
): boolean {
  const topCount = computer.topSlots.length;
  if (absoluteIndex < topCount) {
    return isTopSlotAvailable(computer.topSlots, absoluteIndex);
  }

  const bottomIndex = absoluteIndex - topCount;
  return isBottomSlotAvailable(
    computer.topSlots,
    computer.bottomSlots,
    bottomIndex,
  );
}

export function ComputerView({
  computer,
  dataPoolCount,
  onPlaceData,
}: IComputerViewProps): React.JSX.Element {
  const slots = [...computer.topSlots, ...computer.bottomSlots];
  const canPlaceData = dataPoolCount > 0 && Boolean(onPlaceData);

  return (
    <section className='rounded border border-surface-700/55 bg-surface-950/65 p-2'>
      <div className='mb-1.5 flex items-center justify-between'>
        <p className='font-mono text-[10px] uppercase tracking-wide text-text-500'>
          Computer
        </p>
        <p className='font-mono text-[10px] text-text-400'>Top/Bottom</p>
      </div>

      <div className='grid grid-cols-3 gap-1'>
        {slots.map((slot, absoluteIndex) => {
          const occupied = Boolean(slot);
          const available = slotIsAvailable(computer, absoluteIndex);
          const interactive = canPlaceData && !occupied && available;
          return (
            <button
              key={`computer-slot-${absoluteIndex}`}
              type='button'
              data-testid={`computer-slot-${absoluteIndex}`}
              className={[
                'relative h-7 w-7 rounded border bg-surface-900/75 transition-colors',
                occupied
                  ? 'border-cyan-300/80'
                  : interactive
                    ? 'border-accent-500/90 hover:bg-accent-500/15'
                    : 'border-surface-700/60',
              ].join(' ')}
              onClick={() => {
                if (interactive) {
                  onPlaceData?.(absoluteIndex);
                }
              }}
              aria-label={`Computer slot ${absoluteIndex + 1}`}
            >
              {occupied ? (
                <img
                  src='/assets/seti/tokens/data.png'
                  alt='Data token'
                  className='h-5 w-5'
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
