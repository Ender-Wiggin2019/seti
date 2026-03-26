import { useCallback, useEffect, useRef, useState } from 'react';
import { wsClient } from '@/api/wsClient';
import type { IPublicGameState } from '@/types/re-exports';

export function useGameState(): IPublicGameState | null {
  const [gameState, setGameState] = useState<IPublicGameState | null>(null);
  const stateRef = useRef<IPublicGameState | null>(null);

  const handleState = useCallback((state: IPublicGameState) => {
    stateRef.current = state;
    setGameState(state);
  }, []);

  useEffect(() => {
    wsClient.onState(handleState);
    return () => {
      wsClient.offState();
    };
  }, [handleState]);

  return gameState;
}
