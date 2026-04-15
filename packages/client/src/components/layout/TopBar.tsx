import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { useGameContext } from '@/pages/game/GameContext';
import { EPhase } from '@/types/re-exports';

export function TopBar(): React.JSX.Element {
  const { t } = useTranslation('common');
  const { gameState, isMyTurn, isSpectator } = useGameContext();

  const currentPlayerName = gameState?.players.find(
    (p) => p.playerId === gameState.currentPlayerId,
  )?.playerName;

  return (
    <header className='flex h-12 shrink-0 items-center justify-between border-b border-surface-700/70 bg-surface-900/80 px-4 backdrop-blur-md'>
      <div className='flex items-center gap-4'>
        <Link
          to='/lobby'
          className='text-xs font-medium uppercase tracking-wider text-text-500 transition-colors hover:text-accent-400'
        >
          {t('client.top_bar.exit')}
        </Link>

        <div className='h-4 w-px bg-surface-700' />

        {gameState && (
          <>
            <div className='flex items-center gap-2'>
              <span className='font-mono text-xs uppercase tracking-widest text-text-500'>
                {t('client.top_bar.round')}
              </span>
              <span className='font-mono text-sm font-bold text-accent-400'>
                {gameState.round}
              </span>
            </div>

            <div className='h-4 w-px bg-surface-700' />

            <span
              className={cn(
                'rounded px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-wider',
                gameState.phase === EPhase.GAME_OVER
                  ? 'bg-accent-500/20 text-accent-400'
                  : 'bg-surface-800 text-text-300',
              )}
            >
              {t(`client.top_bar.phases.${gameState.phase}`)}
            </span>
          </>
        )}
      </div>

      <div className='flex items-center gap-4'>
        {gameState && currentPlayerName && (
          <div className='flex items-center gap-2'>
            <span className='text-xs text-text-500'>
              {t('client.top_bar.current')}
            </span>
            <span
              className={cn(
                'font-mono text-sm font-medium',
                isMyTurn ? 'text-accent-400' : 'text-text-300',
              )}
            >
              {isMyTurn ? t('client.top_bar.your_turn') : currentPlayerName}
            </span>
            {isMyTurn && (
              <span className='h-2 w-2 animate-pulse rounded-full bg-accent-400' />
            )}
          </div>
        )}

        {isSpectator && (
          <span className='rounded bg-surface-800 px-2 py-0.5 font-mono text-xs text-text-500'>
            {t('client.top_bar.spectating')}
          </span>
        )}

        {gameState && (
          <span className='font-mono text-xs text-text-500'>
            {gameState.gameId.slice(0, 8)}
          </span>
        )}
      </div>
    </header>
  );
}
