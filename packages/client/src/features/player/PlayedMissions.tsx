import type { IBaseCard } from '@seti/common/types/BaseCard';
import { useTranslation } from 'react-i18next';
import { CardRender } from '@/features/cards/CardRender';

interface IPlayedMissionsProps {
  missions: IBaseCard[];
}

export function PlayedMissions({
  missions,
}: IPlayedMissionsProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <section
      className='instrument-panel h-full p-2'
      data-testid='played-missions'
    >
      <div className='section-head mb-1.5'>
        <span aria-hidden className='section-head__tick' />
        <p className='micro-label'>
          {t('client.played_missions.title', { defaultValue: 'Missions' })}
        </p>
        <div aria-hidden className='section-head__rule' />
        <span className='font-mono text-[10px] tabular-nums text-text-500'>
          {missions.length}
        </span>
      </div>

      {missions.length === 0 ? (
        <div className='flex items-center justify-center rounded-[4px] border border-dashed border-[color:var(--metal-edge-soft)] bg-background-950/50 px-2 py-5'>
          <p className='font-mono text-[10px] uppercase tracking-[0.14em] text-text-500'>
            {t('client.played_missions.empty', {
              defaultValue: 'No active missions',
            })}
          </p>
        </div>
      ) : (
        <div className='grid max-h-[138px] grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-1 overflow-auto'>
          {missions.map((mission) => (
            <div
              key={mission.id}
              className='flex items-center justify-center rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/70 p-0.5 shadow-hairline-inset'
            >
              <div className='pointer-events-none relative h-[109px] w-[78px]'>
                <div className='absolute left-0 top-0 origin-top-left scale-[0.52]'>
                  <CardRender card={mission} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
