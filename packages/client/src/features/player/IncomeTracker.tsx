interface IIncomeTrackerProps {
  creditIncome: number;
  energyIncome: number;
}

export function IncomeTracker({
  creditIncome,
  energyIncome,
}: IIncomeTrackerProps): React.JSX.Element {
  return (
    <section
      className='rounded border border-surface-700/45 bg-surface-900/65 px-2 py-1.5'
      data-testid='income-tracker'
    >
      <div className='mb-1 flex items-center gap-1'>
        <img
          src='/assets/seti/icons/income.png'
          alt='Income'
          className='h-4 w-4'
        />
        <p className='font-mono text-[10px] uppercase tracking-wide text-text-500'>
          Income
        </p>
      </div>
      <div className='grid grid-cols-2 gap-2 font-mono text-xs'>
        <p className='text-text-300'>
          C: <span className='font-bold text-text-100'>+{creditIncome}</span>
        </p>
        <p className='text-text-300'>
          E: <span className='font-bold text-text-100'>+{energyIncome}</span>
        </p>
      </div>
    </section>
  );
}
