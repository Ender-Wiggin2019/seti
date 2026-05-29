import type { EPlanet } from '@seti/common/types/element';
import { AlienBoardView } from '@/features/board/AlienBoardView';
import { mapPlayerColors } from '@/lib/playerColor';
import { useGameContext } from '@/pages/game/GameContext';
import { EPlayerInputType } from '@/types/re-exports';
import { useGameSession } from '../GameSessionContext';
import { getSlotPickerMode, resolveSlotPickerOptionId } from '../sectionInputs';
import type { ISectionRenderProps } from '../sectionRegistry';

export function AlienBoardSection(_: ISectionRenderProps): React.JSX.Element {
  void _;
  const { gameState, myPlayerId, pendingInput, sendInput } = useGameContext();
  const { inspectCard } = useGameSession();
  if (!gameState) return <></>;

  const playerColors = mapPlayerColors(gameState.players);

  const planetActionMode = getSlotPickerMode(pendingInput);

  const handleSelect = (
    planet: EPlanet,
    options?: { isMoon?: boolean; moonId?: string },
  ): void => {
    const slotOptionId = resolveSlotPickerOptionId(
      pendingInput,
      planet,
      options,
    );
    if (slotOptionId !== null && pendingInput?.inputId !== undefined) {
      sendInput({
        inputId: pendingInput.inputId,
        type: EPlayerInputType.OPTION,
        optionId: slotOptionId,
      });
    }
  };

  return (
    <AlienBoardView
      className='md:w-full md:max-w-none'
      aliens={gameState.aliens}
      playerColors={playerColors}
      planetaryBoard={gameState.planetaryBoard}
      gameState={gameState}
      myPlayerId={myPlayerId}
      pendingInput={pendingInput}
      planetActionMode={planetActionMode}
      onSelectMainActionPlanet={handleSelect}
      onRespondInput={sendInput}
      onCardInspect={inspectCard}
    />
  );
}
