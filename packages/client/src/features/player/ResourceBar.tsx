import { EResource } from '@seti/common/types/element';
import type { IPublicPlayerState } from '@/types/re-exports';

interface IResourceBarProps {
  player: IPublicPlayerState;
}

const RESOURCE_ITEMS: Array<{
  id: string;
  label: string;
  icon: string;
  value: (player: IPublicPlayerState) => number;
}> = [
  {
    id: 'credit',
    label: 'Credits',
    icon: '/assets/seti/icons/money.png',
    value: (player) => player.resources[EResource.CREDIT],
  },
  {
    id: 'energy',
    label: 'Energy',
    icon: '/assets/seti/icons/energy.png',
    value: (player) => player.resources[EResource.ENERGY],
  },
  {
    id: 'publicity',
    label: 'Publicity',
    icon: '/assets/seti/icons/pop.png',
    value: (player) => player.resources[EResource.PUBLICITY],
  },
  {
    id: 'score',
    label: 'Score',
    icon: '/assets/seti/icons/vp.png',
    value: (player) => player.score,
  },
];

export function ResourceBar({ player }: IResourceBarProps): React.JSX.Element {
  return (
    <section
      className='grid grid-cols-4 gap-1.5 rounded-md border border-surface-700/50 bg-surface-900/70 p-1.5'
      data-testid='resource-bar'
    >
      {RESOURCE_ITEMS.map((item) => (
        <div
          key={item.id}
          className='flex items-center gap-1.5 rounded border border-surface-700/40 bg-surface-800/45 px-1.5 py-1'
        >
          <img src={item.icon} alt={item.label} className='h-4 w-4 shrink-0' />
          <div className='min-w-0'>
            <p className='font-mono text-[10px] uppercase tracking-wide text-text-500'>
              {item.label}
            </p>
            <p className='font-mono text-sm font-bold text-text-100'>
              {item.value(player)}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
