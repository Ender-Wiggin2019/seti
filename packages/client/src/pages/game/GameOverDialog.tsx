import { useGameContext } from '@/pages/game/GameContext';
import { EPhase } from '@/types/re-exports';

export function GameOverDialog(): React.JSX.Element | null {
  const { gameState } = useGameContext();

  if (gameState?.phase !== EPhase.GAME_OVER) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-background-950/80 backdrop-blur-sm'>
      <div className='w-full max-w-lg rounded-lg border border-surface-700 bg-surface-900 p-6 shadow-panel'>
        <h2 className='mb-4 font-display text-xl font-bold uppercase tracking-wider text-text-100'>
          Game Over
        </h2>
        <div className='space-y-2'>
          {gameState.players
            .slice()
            .sort((a, b) => b.score - a.score)
            .map((player, i) => (
              <div
                key={player.playerId}
                className='flex items-center justify-between rounded border border-surface-700/60 bg-surface-800/60 px-4 py-2'
              >
                <div className='flex items-center gap-3'>
                  <span className='font-mono text-lg font-bold text-accent-400'>
                    #{i + 1}
                  </span>
                  <span className='text-sm font-medium text-text-100'>
                    {player.playerName}
                  </span>
                </div>
                <span className='font-mono text-sm font-bold text-text-100'>
                  {player.score} VP
                </span>
              </div>
            ))}
        </div>
        <p className='mt-4 text-center text-xs text-text-500'>
          Detailed scoring breakdown will be available in a future update.
        </p>
      </div>
    </div>
  );
}
