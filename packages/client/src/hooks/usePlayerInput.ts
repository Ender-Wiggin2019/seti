import { useCallback, useEffect, useState } from 'react';
import { wsClient } from '@/api/wsClient';
import type { IInputResponse, IPlayerInputModel } from '@/types/re-exports';
import { EPhase } from '@/types/re-exports';

interface IUsePlayerInputReturn {
  pendingInput: IPlayerInputModel | null;
  waitingPlayerId: string | null;
  respond: (gameId: string, response: IInputResponse) => void;
}

export function usePlayerInput(): IUsePlayerInputReturn {
  const [pendingInput, setPendingInput] = useState<IPlayerInputModel | null>(
    null,
  );
  const [waitingPlayerId, setWaitingPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (data: { playerId: string; input: IPlayerInputModel }) => {
      setWaitingPlayerId(data.playerId);
      setPendingInput(data.input);
    };

    return wsClient.onWaiting(handler);
  }, []);

  useEffect(() => {
    return wsClient.onState((state) => {
      if (
        state.phase === EPhase.IN_RESOLUTION ||
        state.phase === EPhase.SETUP ||
        state.phase === EPhase.SETUP_CHOICE
      ) {
        return;
      }
      setPendingInput(null);
      setWaitingPlayerId(null);
    });
  }, []);

  const respond = useCallback((gameId: string, response: IInputResponse) => {
    wsClient.sendInput(gameId, response);
  }, []);

  return { pendingInput, waitingPlayerId, respond };
}
