import { EResource } from '@seti/common/types/element';
import { useTranslation } from 'react-i18next';
import type { IPublicPlayerState } from '@/types/re-exports';

interface IResourceBarProps {
  player: IPublicPlayerState;
}

interface IResourceItem {
  id: string;
  i18nKey: string;
  fallback: string;
  icon: string;
  value: (player: IPublicPlayerState) => number;
  /** "primary" resources live in the main cell row; score gets extra emphasis */
  emphasize?: boolean;
}

const RESOURCE_ITEMS: IResourceItem[] = [
  {
    id: 'credit',
    i18nKey: 'client.resource_bar.credit',
    fallback: 'Credits',
    icon: '/assets/seti/icons/money.png',
    value: (p) => p.resources[EResource.CREDIT],
  },
  {
    id: 'energy',
    i18nKey: 'client.resource_bar.energy',
    fallback: 'Energy',
    icon: '/assets/seti/icons/energy.png',
    value: (p) => p.resources[EResource.ENERGY],
  },
  {
    id: 'publicity',
    i18nKey: 'client.resource_bar.publicity',
    fallback: 'Publicity',
    icon: '/assets/seti/icons/pop.png',
    value: (p) => p.resources[EResource.PUBLICITY],
  },
  {
    id: 'score',
    i18nKey: 'client.resource_bar.score',
    fallback: 'Score',
    icon: '/assets/seti/icons/vp.png',
    value: (p) => p.score,
    emphasize: true,
  },
];

/**
 * ResourceBar — four instrument cells separated by tick-rule columns.
 * Icon + micro-label + mono readout. Score cell gets a faint accent wash
 * because victory is the point of every readout on this panel.
 */
export function ResourceBar({ player }: IResourceBarProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <section
      className='instrument-panel grid grid-cols-4 overflow-hidden'
      data-testid='resource-bar'
    >
      {RESOURCE_ITEMS.map((item, index) => {
        const label = t(item.i18nKey, { defaultValue: item.fallback });
        return (
          <div
            key={item.id}
            className='relative flex items-center gap-1.5 px-2 py-1.5'
          >
            {index > 0 ? (
              <span
                aria-hidden
                className='absolute left-0 top-1/2 h-5 w-px -translate-y-1/2 bg-[color:var(--metal-edge-soft)] opacity-80'
              />
            ) : null}
            {item.emphasize ? (
              <span
                aria-hidden
                className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.68_0.11_240/0.10),transparent_70%)]'
              />
            ) : null}
            <img
              src={item.icon}
              alt={label}
              className='relative h-4 w-4 shrink-0 opacity-95'
            />
            <div className='relative min-w-0 flex-1'>
              <p className='micro-label truncate leading-none'>{label}</p>
              <p
                className={
                  item.emphasize
                    ? 'readout mt-0.5 text-[15px] font-semibold text-text-100 leading-none'
                    : 'readout mt-0.5 text-sm font-semibold text-text-100 leading-none'
                }
              >
                {item.value(player)}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
