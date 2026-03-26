import { useCallback } from 'react';
import { wsClient } from '@/api/wsClient';
import type {
  IFreeActionRequest,
  IMainActionRequest,
} from '@/types/re-exports';

interface IUseGameActionsReturn {
  sendAction: (gameId: string, action: IMainActionRequest) => void;
  sendFreeAction: (gameId: string, action: IFreeActionRequest) => void;
  requestUndo: (gameId: string) => void;
}

export function useGameActions(): IUseGameActionsReturn {
  const sendAction = useCallback(
    (gameId: string, action: IMainActionRequest) => {
      wsClient.sendAction(gameId, action);
    },
    [],
  );

  const sendFreeAction = useCallback(
    (gameId: string, action: IFreeActionRequest) => {
      wsClient.sendFreeAction(gameId, action);
    },
    [],
  );

  const requestUndo = useCallback((gameId: string) => {
    wsClient.instance?.emit('game:undo', { gameId });
  }, []);

  return { sendAction, sendFreeAction, requestUndo };
}
