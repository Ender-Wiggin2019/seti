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
      <div className='flex h-screen flex-col items-center justify-center gap-4 bg-background-950'>
        <LoadingSpinner />
        <p className='text-sm text-text-500'>
          {t('client.game_page.connecting')}
        </p>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className='flex h-screen flex-col items-center justify-center gap-4 bg-background-950'>
        <LoadingSpinner />
        <p className='text-sm text-text-500'>
          {t('client.game_page.awaiting')}
        </p>
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
