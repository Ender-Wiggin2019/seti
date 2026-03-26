import type { IBaseCard } from '@seti/common/types/BaseCard';
import { CardRender } from '@/features/cards/CardRender';

interface IPlayedMissionsProps {
  missions: IBaseCard[];
}

export function PlayedMissions({
  missions,
}: IPlayedMissionsProps): React.JSX.Element {
  return (
    <section
      className='h-full rounded border border-surface-700/45 bg-surface-900/65 p-2'
      data-testid='played-missions'
    >
      <div className='mb-1.5 flex items-center gap-1'>
        <img
          src='/assets/seti/icons/missionSatellite.png'
          alt='Missions'
          className='h-4 w-4'
        />
        <p className='font-mono text-[10px] uppercase tracking-wide text-text-500'>
          Missions
        </p>
      </div>

      {missions.length === 0 ? (
        <div className='rounded border border-dashed border-surface-700/60 bg-surface-950/40 px-2 py-4 text-center text-xs text-text-500'>
          No active missions
        </div>
      ) : (
        <div className='grid max-h-[150px] grid-cols-2 gap-1 overflow-auto'>
          {missions.map((mission) => (
            <div
              key={mission.id}
              className='rounded border border-surface-700/60 bg-surface-900/60 p-1'
            >
              <div className='origin-top-left scale-[0.44]'>
                <CardRender card={mission} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
