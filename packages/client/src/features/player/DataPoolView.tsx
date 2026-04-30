import { useTranslation } from 'react-i18next';

interface IDataPoolViewProps {
  count: number;
  max: number;
}

/**
 * DataPoolView — mission-log styled gauge for the data-token pool.
 * A hairline meter sits under a mono readout, with a subtle accent
 * flag only when the pool is full (because "full" is a game-state
 * moment that demands action, not a warning).
 */
export function DataPoolView({
  count,
  max,
}: IDataPoolViewProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const ratio = max <= 0 ? 0 : Math.min(100, Math.round((count / max) * 100));
  const isFull = count >= max;

  return (
    <section className='instrument-panel p-2' data-testid='data-pool-view'>
      <div className='section-head mb-1.5'>
        <span aria-hidden className='section-head__tick' />
        <p className='micro-label'>
          {t('client.data_pool.title', { defaultValue: 'Data Pool' })}
        </p>
        <div aria-hidden className='section-head__rule' />
      </div>

      <div className='flex items-baseline gap-1'>
        <p className='readout text-lg font-semibold text-text-100 leading-none tabular-nums'>
          {`${count} / ${max}`}
        </p>
        {isFull ? (
          <span className='ml-auto font-mono text-[9px] uppercase tracking-[0.14em] text-accent-400'>
            {t('client.data_pool.full', { defaultValue: 'Full' })}
          </span>
        ) : null}
      </div>

      <div className='mt-1.5'>
        <div className='meter' data-full={isFull}>
          <div className='meter__fill' style={{ width: `${ratio}%` }} />
        </div>
        <div className='tick-row mt-0.5' aria-hidden />
      </div>
    </section>
  );
}
