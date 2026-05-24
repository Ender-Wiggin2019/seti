import { useCallback, useEffect, useRef, useState } from 'react';
import { debugApi } from '@/api/debugApi';
import type { IDebugServerSessionResponse } from '@/api/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { GameContextProvider, useGameContext } from '@/pages/game/GameContext';
import { GameLayout } from '@/pages/game/GameLayout';
import type { IAuthUser } from '@/stores/authStore';
import { useAuthStore } from '@/stores/authStore';
import { useGameViewStore } from '@/stores/gameViewStore';

interface IAuthSnapshot {
  token: string | null;
  user: IAuthUser | null;
  isAuthenticated: boolean;
}

function ServerDebugGameContent(): React.JSX.Element {
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
          label='Establishing uplink to debug gateway…'
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
          label='Acquiring server telemetry…'
          className='max-w-md'
        />
      </div>
    );
  }

  return <GameLayout />;
}

export function ServerDebugPage(): React.JSX.Element {
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
          : 'Failed to create debug session';
      setErrorMessage(message);
    } finally {
      setIsCreating(false);
    }
  }, []);

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
          label='Establishing server debug session…'
          className='max-w-md'
        />
      </div>
    );
  }

  if (!session) {
    return (
      <div className='flex h-screen flex-col items-center justify-center gap-4 bg-[var(--surface-void)] px-6 text-center'>
        <span className='micro-label text-[var(--signal-red-hi)]'>
          Anomaly detected
        </span>
        <p className='text-base text-[var(--signal-red-hi)]'>
          {errorMessage ?? 'Could not initialize server debug session.'}
        </p>
        <Button onClick={() => void createSession()} disabled={isCreating}>
          Re-acquire session
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className='fixed right-3 top-3 z-50 flex items-center gap-2 rounded-[5px] border border-[color:var(--metal-edge)] bg-[var(--surface-raised)]/95 p-2 text-xs backdrop-blur'>
        <span className='micro-label'>Server Debug</span>
        <span className='font-mono text-text-300'>Game {session.gameId}</span>
        <Button
          size='sm'
          variant='ghost'
          onClick={() => void createSession()}
          disabled={isCreating}
          className='h-7'
        >
          {isCreating ? 'Creating...' : 'New Game'}
        </Button>
      </div>
      <GameContextProvider key={session.gameId} gameId={session.gameId}>
        <ServerDebugGameContent />
      </GameContextProvider>
    </>
  );
}
