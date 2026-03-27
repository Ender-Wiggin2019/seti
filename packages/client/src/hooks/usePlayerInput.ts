import { useCallback, useEffect, useState } from 'react';
import { wsClient } from '@/api/wsClient';
import type { IInputResponse, IPlayerInputModel } from '@/types/re-exports';

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

  const respond = useCallback((gameId: string, response: IInputResponse) => {
    wsClient.sendInput(gameId, response);
    setPendingInput(null);
    setWaitingPlayerId(null);
  }, []);

  return { pendingInput, waitingPlayerId, respond };
}
