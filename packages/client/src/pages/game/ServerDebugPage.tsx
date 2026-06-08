import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { debugApi } from '@/api/debugApi';
import type { IDebugServerSessionResponse } from '@/api/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { GameContextProvider, useGameContext } from '@/pages/game/GameContext';
import { GameLayout } from '@/pages/game/GameLayout';
import type { IAuthUser } from '@/stores/authStore';
import { useAuthStore } from '@/stores/authStore';
import { useGameViewStore } from '@/stores/gameViewStore';
import { GAME_Z_INDEX } from '@/styles/zIndex';

interface IAuthSnapshot {
  token: string | null;
  user: IAuthUser | null;
  isAuthenticated: boolean;
}

function ServerDebugGameContent(): React.JSX.Element {
  const { t } = useTranslation('common');
  const { isConnected, gameState } = useGameContext();
  const setActiveTab = useGameViewStore((state) => state.setActiveTab);

  useEffect(() => {
    setActiveTab('board');
  }, [setActiveTab]);

  if (!isConnected) {
    return (
      <div className='flex h-screen flex-col items-center justify-center gap-4 bg-[var(--surface-void)]'>
        <LoadingSpinner
          variant='scanline'
          label={t('client.debug.server.establishing_uplink', {
            defaultValue: 'Establishing uplink to debug gateway…',
          })}
          className='max-w-md'
        />
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className='flex h-screen flex-col items-center justify-center gap-4 bg-[var(--surface-void)]'>
        <LoadingSpinner
          variant='scanline'
          label={t('client.debug.server.acquiring_telemetry', {
            defaultValue: 'Acquiring server telemetry…',
          })}
          className='max-w-md'
        />
      </div>
    );
  }

  return <GameLayout />;
}

export function ServerDebugPage(): React.JSX.Element {
  const { t } = useTranslation('common');
  const [session, setSession] = useState<IDebugServerSessionResponse | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const authSnapshotRef = useRef<IAuthSnapshot | null>(null);

  const createSession = useCallback(async () => {
    setIsCreating(true);
    setErrorMessage(null);

    if (!authSnapshotRef.current) {
      const authState = useAuthStore.getState();
      authSnapshotRef.current = {
        token: authState.token,
        user: authState.user,
        isAuthenticated: authState.isAuthenticated,
      };
    }

    try {
      const nextSession = await debugApi.createServerSession();
      useAuthStore
        .getState()
        .login(nextSession.accessToken, nextSession.user as IAuthUser);
      setSession(nextSession);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t('client.debug.server.create_failed', {
              defaultValue: 'Failed to create debug session',
            });
      setErrorMessage(message);
    } finally {
      setIsCreating(false);
    }
  }, [t]);

  useEffect(() => {
    void createSession();

    return () => {
      const authSnapshot = authSnapshotRef.current;
      if (!authSnapshot) {
        return;
      }

      if (
        authSnapshot.token &&
        authSnapshot.user &&
        authSnapshot.isAuthenticated
      ) {
        useAuthStore.getState().login(authSnapshot.token, authSnapshot.user);
      } else {
        useAuthStore.getState().logout();
      }
    };
  }, [createSession]);

  if (isCreating && !session) {
    return (
      <div className='flex h-screen flex-col items-center justify-center gap-4 bg-[var(--surface-void)]'>
        <LoadingSpinner
          variant='scanline'
          label={t('client.debug.server.establishing_session', {
            defaultValue: 'Establishing server debug session…',
          })}
          className='max-w-md'
        />
      </div>
    );
  }

  if (!session) {
    return (
      <div className='flex h-screen flex-col items-center justify-center gap-4 bg-[var(--surface-void)] px-6 text-center'>
        <span className='micro-label text-[var(--signal-red-hi)]'>
          {t('client.debug.server.anomaly_detected', {
            defaultValue: 'Anomaly detected',
          })}
        </span>
        <p className='text-base text-[var(--signal-red-hi)]'>
          {errorMessage ??
            t('client.debug.server.init_failed', {
              defaultValue: 'Could not initialize server debug session.',
            })}
        </p>
        <Button onClick={() => void createSession()} disabled={isCreating}>
          {t('client.debug.server.reacquire_session', {
            defaultValue: 'Re-acquire session',
          })}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div
        className='fixed right-3 top-3 flex items-center gap-2 rounded-[5px] border border-[color:var(--metal-edge)] bg-[var(--surface-raised)]/95 p-2 text-xs backdrop-blur'
        style={{ zIndex: GAME_Z_INDEX.popover }}
      >
        <span className='micro-label'>
          {t('client.debug.server.label', { defaultValue: 'Server Debug' })}
        </span>
        <span className='font-mono text-text-300'>
          {t('client.debug.server.game_id', {
            defaultValue: 'Game {{id}}',
            id: session.gameId,
          })}
        </span>
        <Button
          size='sm'
          variant='ghost'
          onClick={() => void createSession()}
          disabled={isCreating}
          className='h-7'
        >
          {isCreating
            ? t('client.debug.server.creating', { defaultValue: 'Creating...' })
            : t('client.debug.server.new_game', { defaultValue: 'New Game' })}
        </Button>
      </div>
      <GameContextProvider key={session.gameId} gameId={session.gameId}>
        <ServerDebugGameContent />
      </GameContextProvider>
    </>
  );
}
