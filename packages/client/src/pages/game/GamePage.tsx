import { useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { GameLayoutV2 } from '@/features/layout/GameLayoutV2';
import { useLayoutStore } from '@/features/layout/layoutStore';
import { GameContextProvider, useGameContext } from '@/pages/game/GameContext';
import { GameLayout } from '@/pages/game/GameLayout';

function GameContent(): React.JSX.Element {
  const { t } = useTranslation('common');
  const { isConnected, gameState } = useGameContext();
  const layoutEnabled = useLayoutStore((s) => s.enabled);

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
            defaultValue: 'Connecting to mission…',
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
            defaultValue: 'Loading mission data…',
          })}
          className='max-w-md'
        />
      </div>
    );
  }

  return layoutEnabled ? <GameLayoutV2 /> : <GameLayout />;
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
