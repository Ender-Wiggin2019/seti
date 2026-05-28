import { TechBoardView } from '@/features/board/TechBoardView';
import { useGameContext } from '@/pages/game/GameContext';
import type { ISectionRenderProps } from '../sectionRegistry';

export function TechBoardSection(_: ISectionRenderProps): React.JSX.Element {
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

  return (
    <TechBoardView
      techBoard={gameState.techBoard}
      players={gameState.players}
      pendingInput={pendingInput}
      playerColors={playerColors}
      myPlayerId={myPlayerId}
      onSubmit={sendInput}
    />
  );
}
