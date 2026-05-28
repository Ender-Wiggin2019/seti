import type { EPlanet } from '@seti/common/types/element';
import { PlanetaryBoardView } from '@/features/board/PlanetaryBoardView';
import { useGameContext } from '@/pages/game/GameContext';
import { EPlayerInputType } from '@/types/re-exports';
import { getSlotPickerMode, resolveSlotPickerOptionId } from '../sectionInputs';
import type { ISectionRenderProps } from '../sectionRegistry';

export function PlanetBoardSection(_: ISectionRenderProps): React.JSX.Element {
  void _;
  const { gameState, myPlayerId, pendingInput, sendInput } = useGameContext();
  if (!gameState) return <></>;

  const playerColors = gameState.players.reduce<Record<string, string>>(
    (acc, p) => {
      acc[p.playerId] = p.color;
      return acc;
    },
    {},
  );

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
    <PlanetaryBoardView
      gameState={gameState}
      myPlayerId={myPlayerId}
      planetaryBoard={gameState.planetaryBoard}
      pendingInput={pendingInput}
      playerColors={playerColors}
      mainActionPlanetMode={planetActionMode}
      onSelectMainActionPlanet={handleSelect}
      onRespondInput={sendInput}
    />
  );
}
