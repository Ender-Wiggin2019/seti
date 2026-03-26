import { cn } from '@/lib/cn';
import type { IPublicTechStack } from '@/types/re-exports';
import { ETech } from '@/types/re-exports';

const TECH_LABEL: Record<ETech, string> = {
  [ETech.ANY]: 'Any',
  [ETech.PROBE]: 'Probe',
  [ETech.SCAN]: 'Scan',
  [ETech.COMPUTER]: 'Computer',
};

function getTechTileImage(tech: ETech, level: number): string {
  if (tech === ETech.PROBE) {
    if (level === 0) return '/assets/seti/tech/tiles/techFly1_SE.0.0.3.webp';
    if (level === 2) return '/assets/seti/tech/tiles/techFly3_SE0.2.jpg';
    return `/assets/seti/tech/tiles/techFly${level + 1}.webp`;
  }
  if (tech === ETech.SCAN) {
    if (level === 2) return '/assets/seti/tech/tiles/techLook3_SE0.1.webp';
    if (level === 3) return '/assets/seti/tech/tiles/techLook4_SE0.4.jpg';
    return `/assets/seti/tech/tiles/techLook${level + 1}.webp`;
  }
  return `/assets/seti/tech/tiles/techComp${level + 1}.webp`;
}

interface ITechStackProps {
  stack: IPublicTechStack;
  ownerPlayerIds: string[];
  playerColors: Record<string, string>;
  isSelectable: boolean;
}

export function TechStack({
  stack,
  ownerPlayerIds,
  playerColors,
  isSelectable,
}: ITechStackProps): React.JSX.Element {
  return (
    <article
      data-testid={`tech-stack-${stack.tech}-${stack.level}`}
      className={cn(
        'rounded-md border border-surface-700/50 bg-surface-900/60 p-2',
        isSelectable && 'border-accent-500 ring-1 ring-accent-500/70',
      )}
    >
      <div className='flex items-center justify-between'>
        <h3 className='font-mono text-xs font-semibold uppercase tracking-wider text-text-200'>
          {TECH_LABEL[stack.tech]} L{stack.level + 1}
        </h3>
        <span className='font-mono text-[10px] text-text-500'>
          x{stack.remainingTiles}
        </span>
      </div>

      <div className='mt-2 flex items-center gap-2'>
        <img
          src={getTechTileImage(stack.tech, stack.level)}
          alt={`${TECH_LABEL[stack.tech]} level ${stack.level + 1}`}
          className='h-10 w-10 rounded border border-surface-700/60 object-cover'
        />
        <span
          className={cn(
            'rounded border px-1.5 py-0.5 font-mono text-[10px]',
            stack.firstTakeBonusAvailable
              ? 'border-accent-500/70 text-accent-300'
              : 'border-surface-600 text-text-500',
          )}
        >
          2VP {stack.firstTakeBonusAvailable ? 'available' : 'taken'}
        </span>
      </div>

      <div className='mt-2 flex min-h-4 flex-wrap gap-1'>
        {ownerPlayerIds.length === 0 ? (
          <span className='font-mono text-[10px] text-text-500'>No owner</span>
        ) : (
          ownerPlayerIds.map((playerId) => (
            <span
              key={`${stack.tech}-${stack.level}-${playerId}`}
              className='inline-flex h-3.5 w-3.5 rounded-full border border-surface-200/40'
              style={{ backgroundColor: playerColors[playerId] ?? '#cbd5e1' }}
              title={playerId}
            />
          ))
        )}
      </div>
    </article>
  );
}
