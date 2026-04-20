import { useTranslation } from 'react-i18next';
import type { IPublicPieceInventory } from '@/types/re-exports';

interface IPieceInventoryProps {
  pieces: IPublicPieceInventory;
}

interface IPieceItem {
  id: keyof IPublicPieceInventory;
  i18nKey: string;
  fallback: string;
  icon: string;
}

const PIECE_ITEMS: IPieceItem[] = [
  {
    id: 'probes',
    i18nKey: 'client.piece_inventory.probe',
    fallback: 'Probe',
    icon: '/assets/seti/icons/launch.png',
  },
  {
    id: 'orbiters',
    i18nKey: 'client.piece_inventory.orbiter',
    fallback: 'Orbiter',
    icon: '/assets/seti/icons/progress.png',
  },
  {
    id: 'landers',
    i18nKey: 'client.piece_inventory.lander',
    fallback: 'Lander',
    icon: '/assets/seti/icons/look.png',
  },
  {
    id: 'signalMarkers',
    i18nKey: 'client.piece_inventory.signal',
    fallback: 'Signal',
    icon: '/assets/seti/icons/signalToken.png',
  },
];

export function PieceInventory({
  pieces,
}: IPieceInventoryProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <section className='instrument-panel p-2'>
      <div className='section-head mb-1.5'>
        <span aria-hidden className='section-head__tick' />
        <p className='micro-label'>
          {t('client.piece_inventory.title', { defaultValue: 'Inventory' })}
        </p>
        <div aria-hidden className='section-head__rule' />
      </div>
      <div className='grid grid-cols-2 gap-1'>
        {PIECE_ITEMS.map((item) => {
          const value = pieces[item.id];
          const depleted = value === 0;
          return (
            <div
              key={item.id}
              className='flex items-center gap-1.5 rounded-[3px] border border-[color:var(--metal-edge-soft)] bg-background-900/70 px-1.5 py-1'
            >
              <img
                src={item.icon}
                alt=''
                aria-hidden
                className='h-3.5 w-3.5 shrink-0 opacity-90'
              />
              <span className='flex-1 truncate font-mono text-[10px] uppercase tracking-[0.1em] text-text-500'>
                {t(item.i18nKey, { defaultValue: item.fallback })}
              </span>
              <span
                className={
                  depleted
                    ? 'readout text-[12px] text-text-500 leading-none'
                    : 'readout text-[12px] font-semibold text-text-100 leading-none'
                }
              >
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
