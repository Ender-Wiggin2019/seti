import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { wsClient } from '@/api/wsClient';
import { useGameActions } from '@/hooks/useGameActions';
import { useGameError } from '@/hooks/useGameError';
import { useGameEvents } from '@/hooks/useGameEvents';
import { useGameState } from '@/hooks/useGameState';
import { usePlayerInput } from '@/hooks/usePlayerInput';
import { useReconnection } from '@/hooks/useReconnection';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/stores/authStore';
import type {
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
  IPlayerInputModel,
  IPublicGameState,
  TGameEvent,
} from '@/types/re-exports';

export interface IGameContext {
  gameState: IPublicGameState | null;
  pendingInput: IPlayerInputModel | null;
  isConnected: boolean;
  isMyTurn: boolean;
  isSpectator: boolean;
  myPlayerId: string;
  events: TGameEvent[];
  sendAction: (action: IMainActionRequest) => void;
  sendFreeAction: (action: IFreeActionRequest) => void;
  sendEndTurn: () => void;
  sendInput: (response: IInputResponse) => void;
  requestUndo: () => void;
}

const GameCtx = createContext<IGameContext | null>(null);

export function useGameContext(): IGameContext {
  const ctx = useContext(GameCtx);
  if (!ctx)
    throw new Error('useGameContext must be used within GameContextProvider');
  return ctx;
}

interface IGameContextProviderProps {
  gameId: string;
  spectate?: boolean;
  children: ReactNode;
}

interface IGameContextValueProviderProps {
  value: IGameContext;
  children: ReactNode;
}

export function GameContextProvider({
  gameId,
  spectate = false,
  children,
}: IGameContextProviderProps): React.JSX.Element {
  const { isConnected } = useSocket();
  const gameState = useGameState();
  const { pendingInput, waitingPlayerId, respond } = usePlayerInput();
  const {
    sendAction: rawSendAction,
    sendFreeAction: rawSendFreeAction,
    sendEndTurn: rawSendEndTurn,
    requestUndo: rawRequestUndo,
  } = useGameActions();
  const events = useGameEvents();
  useGameError();
  useReconnection(gameId);

  const myPlayerId = useAuthStore((s) => s.user?.id ?? '');

  useEffect(() => {
    if (isConnected) {
      wsClient.joinGame(gameId);
    }
    return () => {
      wsClient.leaveGame(gameId);
    };
  }, [gameId, isConnected]);

  const isMyTurn = gameState?.currentPlayerId === myPlayerId;

  const sendAction = useCallback(
    (action: IMainActionRequest) => rawSendAction(gameId, action),
    [gameId, rawSendAction],
  );

  const sendFreeAction = useCallback(
    (action: IFreeActionRequest) => rawSendFreeAction(gameId, action),
    [gameId, rawSendFreeAction],
  );

  const sendEndTurn = useCallback(
    () => rawSendEndTurn(gameId),
    [gameId, rawSendEndTurn],
  );

  const sendInput = useCallback(
    (response: IInputResponse) => respond(gameId, response),
    [gameId, respond],
  );

  const requestUndo = useCallback(
    () => rawRequestUndo(gameId),
    [gameId, rawRequestUndo],
  );

  const value = useMemo<IGameContext>(
    () => ({
      gameState,
      pendingInput: waitingPlayerId === myPlayerId ? pendingInput : null,
      isConnected,
      isMyTurn,
      isSpectator: spectate,
      myPlayerId,
      events,
      sendAction,
      sendFreeAction,
      sendEndTurn,
      sendInput,
      requestUndo,
    }),
    [
      gameState,
      pendingInput,
      waitingPlayerId,
      isConnected,
      isMyTurn,
      spectate,
      myPlayerId,
      events,
      sendAction,
      sendFreeAction,
      sendEndTurn,
      sendInput,
      requestUndo,
    ],
  );

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export function GameContextValueProvider({
  value,
  children,
}: IGameContextValueProviderProps): React.JSX.Element {
  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}
