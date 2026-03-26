import { getTechDescriptor } from '@seti/common/types/tech';
import type {
  IPlayerInputModel,
  IPublicPlayerState,
  IPublicTechBoard,
} from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';
import { TechStack } from './TechStack';

interface ITechBoardViewProps {
  techBoard: IPublicTechBoard;
  players: IPublicPlayerState[];
  pendingInput: IPlayerInputModel | null;
  playerColors: Record<string, string>;
}

export function TechBoardView({
  techBoard,
  players,
  pendingInput,
  playerColors,
}: ITechBoardViewProps): React.JSX.Element {
  const ownerByStackKey = new Map<string, string[]>();

  for (const player of players) {
    for (const techId of player.techs) {
      const descriptor = getTechDescriptor(techId);
      const stackKey = `${descriptor.type}:${descriptor.level}`;
      const owners = ownerByStackKey.get(stackKey) ?? [];
      owners.push(player.playerId);
      ownerByStackKey.set(stackKey, owners);
    }
  }

  const selectableTechTypes =
    pendingInput?.type === EPlayerInputType.TECH
      ? new Set(pendingInput.options)
      : new Set<string>();

  return (
    <section className='w-full rounded-lg border border-surface-700/40 bg-surface-900/40 p-3'>
      <header className='mb-2'>
        <h2 className='font-display text-base font-bold uppercase tracking-wider text-text-100'>
          Tech Board
        </h2>
      </header>

      <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {techBoard.stacks.map((stack) => {
          const stackKey = `${stack.tech}:${stack.level}`;
          return (
            <TechStack
              key={stackKey}
              stack={stack}
              ownerPlayerIds={ownerByStackKey.get(stackKey) ?? []}
              playerColors={playerColors}
              isSelectable={selectableTechTypes.has(stack.tech)}
            />
          );
        })}
      </div>
    </section>
  );
}
