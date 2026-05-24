import { useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { GameContextProvider, useGameContext } from '@/pages/game/GameContext';
import { GameLayout } from '@/pages/game/GameLayout';

function GameContent(): React.JSX.Element {
  const { t } = useTranslation('common');
  const { isConnected, gameState } = useGameContext();

  if (!isConnected) {
    return (
      <div className='relative flex h-screen flex-col items-center justify-center gap-4 bg-[var(--surface-void)]'>
        <div
          className='pointer-events-none fixed inset-0 -z-10 bg-[image:var(--bg-atmosphere)]'
          aria-hidden
        />
        <LoadingSpinner
          variant='scanline'
          label={t('client.game_page.connecting', {
            defaultValue: 'Establishing uplink…',
          })}
          className='max-w-md'
        />
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className='relative flex h-screen flex-col items-center justify-center gap-4 bg-[var(--surface-void)]'>
        <div
          className='pointer-events-none fixed inset-0 -z-10 bg-[image:var(--bg-atmosphere)]'
          aria-hidden
        />
        <LoadingSpinner
          variant='scanline'
          label={t('client.game_page.awaiting', {
            defaultValue: 'Acquiring telemetry…',
          })}
          className='max-w-md'
        />
      </div>
    );
  }

  return <GameLayout />;
}

export function GamePage(): React.JSX.Element {
  const { gameId } = useParams({ strict: false }) as { gameId: string };

  return (
    <GameContextProvider gameId={gameId}>
      <GameContent />
    </GameContextProvider>
  );
}

export function SpectatePage(): React.JSX.Element {
  const { gameId } = useParams({ strict: false }) as { gameId: string };

  return (
    <GameContextProvider gameId={gameId} spectate>
      <GameContent />
    </GameContextProvider>
  );
}
