import { useTranslation } from 'react-i18next';

interface IIncomeTrackerProps {
  creditIncome: number;
  energyIncome: number;
  cardIncome: number;
  /**
   * Per-resource income contributed by *tucked* cards (i.e.
   * excluding the printed starting income card). When provided we
   * surface this as a small "+N" suffix so players can see how much
   * of each stream they've grown during play.
   */
  tuckedCreditIncome?: number;
  tuckedEnergyIncome?: number;
  tuckedCardIncome?: number;
}

interface IStreamProps {
  label: string;
  value: number;
  tuckedValue?: number;
  icon: string;
}

function Stream({
  label,
  value,
  tuckedValue,
  icon,
}: IStreamProps): React.JSX.Element {
  const isZero = value === 0;
  const showTucked = tuckedValue !== undefined && tuckedValue > 0;
  return (
    <div className='flex items-center gap-1.5'>
      <img src={icon} alt='' aria-hidden className='h-3.5 w-3.5 shrink-0' />
      <div className='min-w-0'>
        <p className='micro-label leading-none'>{label}</p>
        <p
          className={
            isZero
              ? 'readout mt-0.5 text-[13px] text-text-500 leading-none'
              : 'readout mt-0.5 text-[13px] text-text-100 leading-none'
          }
        >
          <span className='text-accent-400'>{isZero ? '·' : '+'}</span>
          {value}
          {showTucked ? (
            <span
              className='ml-1 font-mono text-[10px] text-text-400'
              title='Income from tucked cards (excludes starting income card)'
              data-testid='income-tucked-suffix'
            >
              ({`+${tuckedValue}`})
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

/**
 * IncomeTracker — "next tick" income readout. Three streams (credit,
 * energy, cards) rendered like instrumentation channels, each with a
 * micro-label and a mono +N readout.
 */
export function IncomeTracker({
  creditIncome,
  energyIncome,
  cardIncome,
  tuckedCreditIncome,
  tuckedEnergyIncome,
  tuckedCardIncome,
}: IIncomeTrackerProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <section
      className='instrument-panel px-2 py-1.5'
      data-testid='income-tracker'
    >
      <div className='section-head mb-1.5'>
        <span aria-hidden className='section-head__tick' />
        <p className='micro-label'>
          {t('client.income_tracker.title', { defaultValue: 'Income' })}
        </p>
        <div aria-hidden className='section-head__rule' />
      </div>
      <div className='grid grid-cols-3 gap-2'>
        <Stream
          label={t('client.income_tracker.credit', { defaultValue: 'Credit' })}
          value={creditIncome}
          tuckedValue={tuckedCreditIncome}
          icon='/assets/seti/icons/money.png'
        />
        <Stream
          label={t('client.income_tracker.energy', { defaultValue: 'Energy' })}
          value={energyIncome}
          tuckedValue={tuckedEnergyIncome}
          icon='/assets/seti/icons/energy.png'
        />
        <Stream
          label={t('client.income_tracker.card', { defaultValue: 'Cards' })}
          value={cardIncome}
          tuckedValue={tuckedCardIncome}
          icon='/assets/seti/icons/draw.png'
        />
      </div>
    </section>
  );
}
