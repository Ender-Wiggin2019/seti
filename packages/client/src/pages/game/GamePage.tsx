import { useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { GameLayoutV2 } from '@/features/layout/GameLayoutV2';
import { GameContextProvider, useGameContext } from '@/pages/game/GameContext';
import { GAME_Z_INDEX } from '@/styles/zIndex';

function GameContent(): React.JSX.Element {
  const { t } = useTranslation('common');
  const { isConnected, gameState } = useGameContext();

  if (!isConnected) {
    return (
      <div className='relative flex h-screen flex-col items-center justify-center gap-4 bg-[var(--surface-void)]'>
        <div
          className='pointer-events-none fixed inset-0 bg-[image:var(--bg-atmosphere)] bg-cover bg-center'
          style={{ zIndex: GAME_Z_INDEX.background }}
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
          className='pointer-events-none fixed inset-0 bg-[image:var(--bg-atmosphere)] bg-cover bg-center'
          style={{ zIndex: GAME_Z_INDEX.background }}
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

  return <GameLayoutV2 />;
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
