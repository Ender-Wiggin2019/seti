import {
  TECH_BOARD_DIMENSIONS,
  TECH_STACK_LAYOUT,
} from '@seti/common/constant/boardLayout';
import {
  ALL_TECH_IDS,
  type ETechId,
  getTechDescriptor,
  getTechId,
} from '@seti/common/types/tech';
import { useTranslation } from 'react-i18next';
import type {
  IInputResponse,
  IPlayerInputModel,
  IPublicPlayerState,
  IPublicTechBoard,
} from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';
import { TechStack } from './TechStack';

const ALL_TECH_ID_SET = new Set<string>(ALL_TECH_IDS);

interface ITechBoardViewProps {
  techBoard: IPublicTechBoard;
  players: IPublicPlayerState[];
  pendingInput: IPlayerInputModel | null;
  playerColors: Record<string, string>;
  myPlayerId: string;
  onSubmit?: (response: IInputResponse) => void;
}

export function TechBoardView({
  techBoard,
  players,
  pendingInput,
  playerColors,
  myPlayerId,
  onSubmit,
}: ITechBoardViewProps): React.JSX.Element {
  const { t } = useTranslation('common');
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

  const myPlayer = players.find((player) => player.playerId === myPlayerId);
  const ownedTechIds = new Set(myPlayer?.techs ?? []);

  const selectableTechTypes =
    pendingInput?.type === EPlayerInputType.TECH
      ? new Set(pendingInput.options)
      : new Set<string>();
  const selectableOptionTechIds =
    pendingInput?.type === EPlayerInputType.OPTION
      ? new Set(
          pendingInput.options
            .map((option) => option.id)
            .filter((id): id is ETechId => ALL_TECH_ID_SET.has(id)),
        )
      : new Set<ETechId>();

  const stackByKey = new Map(
    techBoard.stacks.map((stack) => [`${stack.tech}:${stack.level}`, stack]),
  );

  function buildSelectionResponse(
    techId: ETechId,
    techType: IPublicTechBoard['stacks'][number]['tech'],
  ): IInputResponse | null {
    if (
      pendingInput?.type === EPlayerInputType.OPTION &&
      selectableOptionTechIds.has(techId)
    ) {
      return {
        type: EPlayerInputType.OPTION,
        optionId: techId,
      };
    }

    if (
      pendingInput?.type === EPlayerInputType.TECH &&
      selectableTechTypes.has(techType)
    ) {
      return {
        type: EPlayerInputType.TECH,
        tech: techType,
      };
    }

    return null;
  }

  return (
    <section className='w-full rounded-lg border border-surface-700/40 bg-surface-900/40 p-3'>
      <header className='mb-2'>
        <h2 className='font-display text-base font-bold uppercase tracking-wider text-text-100'>
          {t('client.board.tech_board')}
        </h2>
      </header>

      <div
        className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        style={{
          maxWidth: `${TECH_BOARD_DIMENSIONS.width * 2}px`,
          minHeight: `${TECH_BOARD_DIMENSIONS.height}px`,
          backgroundImage:
            'linear-gradient(rgba(8, 13, 25, 0.35), rgba(8, 13, 25, 0.55))',
        }}
      >
        {TECH_STACK_LAYOUT.map((layout) => {
          const stackKey = `${layout.tech}:${layout.level}`;
          const stack = stackByKey.get(stackKey);
          if (!stack) {
            return null;
          }
          const techId = getTechId(layout.tech, layout.level);
          const selectionResponse = buildSelectionResponse(techId, stack.tech);
          const isSelectable =
            selectionResponse !== null &&
            stack.remainingTiles > 0 &&
            !ownedTechIds.has(techId);

          return (
            <TechStack
              key={stackKey}
              stack={stack}
              ownerPlayerIds={ownerByStackKey.get(stackKey) ?? []}
              playerColors={playerColors}
              isSelectable={isSelectable}
              onSelect={
                isSelectable && onSubmit
                  ? () => onSubmit(selectionResponse)
                  : undefined
              }
            />
          );
        })}
      </div>
    </section>
  );
}
