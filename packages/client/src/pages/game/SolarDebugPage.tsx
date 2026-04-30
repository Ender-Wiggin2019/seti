import {
  createDefaultSetupConfig,
  type ISolarSystemWheelCell,
  type TSolarSystemWheelIndex,
} from '@seti/common/constant/sectorSetup';
import { useMemo, useState } from 'react';
import { WheelLayer } from '@/features/board/WheelLayer';

const WHEELS: ReadonlyArray<TSolarSystemWheelIndex> = [1, 2, 3, 4];

function toSlotName(slot: ISolarSystemWheelCell): string {
  if (slot.cell.planet) {
    return slot.cell.planet.toLowerCase();
  }
  return slot.cell.type.toLowerCase();
}

function toSlotLabel(slot: ISolarSystemWheelCell, index: number): string {
  const publicitySuffix = slot.cell.hasPublicityIcon ? '*' : '';
  return `${index}:${toSlotName(slot)}${publicitySuffix}`;
}

export function SolarDebugPage(): React.JSX.Element {
  const wheels = useMemo(() => createDefaultSetupConfig().wheels, []);
  const [activeBandByWheel, setActiveBandByWheel] = useState<
    Record<TSolarSystemWheelIndex, number>
  >({
    1: 0,
    2: 1,
    3: 2,
    4: 3,
  });

  return (
    <main className='min-h-screen bg-background-950 p-6 text-text-100'>
      <header className='mb-6'>
        <h1 className='font-display text-xl font-bold uppercase tracking-wider'>
          Solar Wheel Debug
        </h1>
        <p className='mt-1 text-xs text-text-400'>
          Each wheel is a 4x8 matrix. Labels use
          <span className='mx-1 font-mono text-text-300'>index:type</span>
          and <span className='mx-1 font-mono text-text-300'>*</span>
          marks publicity icons.
        </p>
      </header>

      <section className='grid grid-cols-1 gap-5 xl:grid-cols-2'>
        {WHEELS.map((wheel) => {
          const activeBand = activeBandByWheel[wheel] ?? 0;
          const wheelGrid = wheels[wheel];
          const activeRow = wheelGrid[activeBand];
          const slotLabels = activeRow.map((slot, index) =>
            toSlotLabel(slot, index),
          );

          return (
            <article
              key={`solar-debug-wheel-${wheel}`}
              className='rounded-lg border border-surface-700/50 bg-surface-900/35 p-4'
            >
              <h2 className='mb-3 font-mono text-sm uppercase tracking-wide text-text-200'>
                Wheel {wheel}
              </h2>

              <div className='mb-3 flex flex-wrap items-center gap-2'>
                {wheelGrid.map((_, bandIndex) => (
                  <button
                    key={`wheel-${wheel}-band-${bandIndex}`}
                    type='button'
                    onClick={() =>
                      setActiveBandByWheel((prev) => ({
                        ...prev,
                        [wheel]: bandIndex,
                      }))
                    }
                    className={[
                      'rounded border px-2 py-0.5 font-mono text-[11px] uppercase transition-colors',
                      bandIndex === activeBand
                        ? 'border-accent-500/70 bg-accent-500/20 text-accent-100'
                        : 'border-surface-700/70 bg-surface-800/60 text-text-300 hover:bg-surface-700/70',
                    ].join(' ')}
                  >
                    Band {bandIndex + 1}
                  </button>
                ))}
              </div>

              <div
                className='relative mx-auto aspect-square w-full max-w-[380px] overflow-hidden rounded-md border border-surface-700/50'
                style={{
                  backgroundImage: 'url(/assets/seti/boards/background.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <WheelLayer ring={wheel} angle={0} slotLabels={slotLabels} />
              </div>

              <div className='mt-3 space-y-1'>
                {wheelGrid.map((row, rowIndex) => (
                  <div
                    key={`wheel-${wheel}-row-${rowIndex}`}
                    className={[
                      'grid grid-cols-[56px_repeat(8,minmax(0,1fr))] items-center gap-1 rounded px-2 py-1 font-mono text-[10px]',
                      rowIndex === activeBand
                        ? 'bg-surface-800/70 text-text-100'
                        : 'bg-surface-900/45 text-text-400',
                    ].join(' ')}
                  >
                    <span>{`Band ${rowIndex + 1}`}</span>
                    {row.map((slot, index) => (
                      <span
                        key={`wheel-${wheel}-row-${rowIndex}-slot-${index}`}
                        className='truncate text-center'
                        title={`${index}:${toSlotName(slot)}`}
                      >
                        {toSlotLabel(slot, index)}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
