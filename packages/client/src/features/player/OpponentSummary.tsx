import { useTranslation } from 'react-i18next';
import type { IPublicPlayerState } from '@/types/re-exports';

interface IOpponentSummaryProps {
  opponents: IPublicPlayerState[];
}

interface IOpponentStatProps {
  labelKey: string;
  fallback: string;
  value: number | string;
}

function OpponentStat({
  labelKey,
  fallback,
  value,
}: IOpponentStatProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const label = t(labelKey, { defaultValue: fallback });
  return (
    <p className='font-mono text-[10px] tracking-[0.06em] text-text-300 tabular-nums'>
      {`${label}: ${value}`}
    </p>
  );
}

export function OpponentSummary({
  opponents,
}: IOpponentSummaryProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <section className='instrument-panel p-2'>
      <div className='section-head mb-1.5'>
        <span aria-hidden className='section-head__tick' />
        <p className='micro-label'>
          {t('client.opponent_summary.title', { defaultValue: 'Opponents' })}
        </p>
        <div aria-hidden className='section-head__rule' />
      </div>

      <div className='space-y-1.5'>
        {opponents.map((player) => (
          <details
            key={player.playerId}
            className='group rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/70 px-2 py-1 shadow-hairline-inset open:bg-background-900/90'
          >
            <summary className='flex cursor-pointer list-none items-center justify-between gap-2'>
              <span className='flex min-w-0 items-center gap-1.5'>
                <span
                  aria-hidden
                  className='h-2.5 w-2.5 shrink-0 rounded-full border border-[oklch(0.96_0.008_260/0.5)] shadow-[inset_0_1px_0_oklch(1_0_0/0.3)]'
                  style={{ backgroundColor: player.color }}
                />
                <span className='truncate text-[12px] font-medium text-text-100'>
                  {player.playerName}
                </span>
                {player.passed ? (
                  <span className='chip shrink-0 font-mono text-[9px] tracking-[0.14em]'>
                    {t('client.opponent_summary.passed', {
                      defaultValue: 'PASS',
                    })}
                  </span>
                ) : null}
              </span>
              <span className='flex items-baseline gap-1 shrink-0'>
                <span className='readout text-[13px] font-semibold text-text-100 leading-none'>
                  {player.score}
                </span>
                <span className='font-mono text-[9px] uppercase tracking-[0.14em] text-text-500'>
                  VP
                </span>
                <span
                  aria-hidden
                  className='ml-1 inline-block h-0 w-0 border-x-[4px] border-t-[5px] border-x-transparent border-t-text-500 transition-transform group-open:rotate-180'
                />
              </span>
            </summary>
            <div className='mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-[color:var(--metal-edge-soft)] pt-2'>
              <OpponentStat
                labelKey='client.opponent_summary.hand'
                fallback='Hand'
                value={player.handSize}
              />
              <OpponentStat
                labelKey='client.opponent_summary.tech'
                fallback='Tech'
                value={player.techs.length}
              />
              <OpponentStat
                labelKey='client.opponent_summary.credit'
                fallback='Credit'
                value={player.resources.credit}
              />
              <OpponentStat
                labelKey='client.opponent_summary.energy'
                fallback='Energy'
                value={player.resources.energy}
              />
              <OpponentStat
                labelKey='client.opponent_summary.data'
                fallback='Data'
                value={player.resources.data}
              />
              <OpponentStat
                labelKey='client.opponent_summary.publicity'
                fallback='Publicity'
                value={player.resources.publicity}
              />
              <OpponentStat
                labelKey='client.opponent_summary.pool'
                fallback='Pool'
                value={player.dataPoolCount}
              />
              <OpponentStat
                labelKey='client.opponent_summary.signals'
                fallback='Signals'
                value={player.pieces.signalMarkers}
              />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
