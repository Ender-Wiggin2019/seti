import { createDefaultSetupConfig } from '@seti/common/constant/sectorSetup';
import { SolarSystemView } from '@/features/board/SolarSystemView';
import { useGameContext } from '@/pages/game/GameContext';
import { EFreeAction } from '@/types/re-exports';
import { useGameSession } from '../GameSessionContext';

export function SolarSystemSection(): React.JSX.Element | null {
  const { gameState, myPlayerId, pendingInput, sendFreeAction, sendInput } =
    useGameContext();
  const { movementModeActive } = useGameSession();

  if (!gameState) return null;

  const playerColors = gameState.players.reduce<Record<string, string>>(
    (acc, p) => {
      acc[p.playerId] = p.color;
      return acc;
    },
    {},
  );
  const myPlayer = gameState.players.find((p) => p.playerId === myPlayerId);

  const oumuamuaTile =
    gameState.aliens?.find((a) => a.board?.type === 'oumuamua')?.board?.type ===
    'oumuamua'
      ? ((
          gameState.aliens.find((a) => a.board?.type === 'oumuamua')?.board as {
            type: 'oumuamua';
            tile?: import('@/types/re-exports').IPublicOumuamuaTile | null;
          }
        )?.tile ?? null)
      : null;

  return (
    <SolarSystemView
      solarSystem={gameState.solarSystem}
      sectors={gameState.sectors}
      setupConfig={gameState.solarSystemSetup ?? createDefaultSetupConfig()}
      pendingInput={pendingInput}
      playerColors={playerColors}
      myPlayerId={myPlayerId}
      movementPoints={myPlayer?.movementPoints ?? 0}
      moveModeActive={movementModeActive}
      onMoveProbe={(path, target) => {
        if (!target) return;
        sendFreeAction({ type: EFreeAction.MOVEMENT, path, target });
      }}
      onRespondInput={sendInput}
      oumuamuaTile={oumuamuaTile}
    />
  );
}
