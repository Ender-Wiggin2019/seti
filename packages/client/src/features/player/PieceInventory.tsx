import type { IPublicPieceInventory } from '@/types/re-exports';

interface IPieceInventoryProps {
  pieces: IPublicPieceInventory;
}

const PIECE_ITEMS: Array<{
  id: keyof IPublicPieceInventory;
  label: string;
  icon: string;
}> = [
  { id: 'probes', label: 'Probe', icon: '/assets/seti/icons/launch.png' },
  { id: 'orbiters', label: 'Orbiter', icon: '/assets/seti/icons/progress.png' },
  { id: 'landers', label: 'Lander', icon: '/assets/seti/icons/look.png' },
  {
    id: 'signalMarkers',
    label: 'Signals',
    icon: '/assets/seti/icons/signalToken.png',
  },
];

export function PieceInventory({
  pieces,
}: IPieceInventoryProps): React.JSX.Element {
  return (
    <section className='rounded border border-surface-700/55 bg-surface-950/65 p-2'>
      <p className='mb-1.5 font-mono text-[10px] uppercase tracking-wide text-text-500'>
        Inventory
      </p>
      <div className='grid grid-cols-2 gap-1.5'>
        {PIECE_ITEMS.map((item) => (
          <div
            key={item.id}
            className='flex items-center gap-1 rounded border border-surface-700/50 bg-surface-900/70 px-1 py-0.5'
          >
            <img src={item.icon} alt={item.label} className='h-3.5 w-3.5' />
            <span className='font-mono text-[10px] text-text-400'>
              {item.label}
            </span>
            <span className='ml-auto font-mono text-xs font-bold text-text-100'>
              {pieces[item.id]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
