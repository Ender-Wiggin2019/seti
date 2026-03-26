interface IDataPoolViewProps {
  count: number;
  max: number;
}

export function DataPoolView({
  count,
  max,
}: IDataPoolViewProps): React.JSX.Element {
  const ratio = max <= 0 ? 0 : Math.min(100, Math.round((count / max) * 100));
  const isFull = count >= max;

  return (
    <section
      className='rounded border border-surface-700/55 bg-surface-950/65 p-2'
      data-testid='data-pool-view'
    >
      <div className='mb-1 flex items-center gap-1'>
        <img
          src='/assets/seti/icons/data.png'
          alt='Data pool'
          className='h-4 w-4'
        />
        <p className='font-mono text-[10px] uppercase tracking-wide text-text-500'>
          Data Pool
        </p>
      </div>
      <p className='font-mono text-sm font-bold text-text-100'>
        {count} / {max}
      </p>
      <div className='mt-1 h-1.5 w-full rounded bg-surface-800/80'>
        <div
          className={[
            'h-full rounded transition-[width]',
            isFull ? 'bg-warning-400' : 'bg-cyan-400',
          ].join(' ')}
          style={{ width: `${ratio}%` }}
        />
      </div>
      {isFull ? (
        <p className='mt-1 text-[10px] font-medium uppercase tracking-wide text-warning-300'>
          Full
        </p>
      ) : null}
    </section>
  );
}
