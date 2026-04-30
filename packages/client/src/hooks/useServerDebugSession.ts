import { useCallback, useEffect, useRef, useState } from 'react';
import { debugApi } from '@/api/debugApi';
import type { IDebugServerSessionResponse } from '@/api/types';
import type {
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
  IPlayerInputModel,
  IPublicGameState,
} from '@/types/re-exports';

export interface IServerDebugSession {
  gameId: string;
  viewerId: string;
  gameState: IPublicGameState | null;
  pendingInput: IPlayerInputModel | null;
  isCreating: boolean;
  errorMessage: string | null;
  createSession: () => Promise<IDebugServerSessionResponse | null>;
  refresh: () => Promise<void>;
  solarRotate: (discIndex: number) => Promise<void>;
  placeProbeOn: (spaceId: string) => Promise<void>;
  moveProbeTo: (probeId: string, toSpaceId: string) => Promise<void>;
  sendMainAction: (action: IMainActionRequest) => Promise<void>;
  sendFreeAction: (action: IFreeActionRequest) => Promise<void>;
  sendEndTurn: () => Promise<void>;
  sendInput: (response: IInputResponse) => Promise<void>;
}

/**
 * REST-based debug session for /debug/game's "Server" mode.
 *
 * Unlike the WebSocket-backed GameContextProvider, this hook talks to the
 * `/debug/server/...` HTTP endpoints so the UI can exercise data-driven
 * rendering against a real SolarSystem instance without a persistent socket.
 */
export function useServerDebugSession(
  enabled: boolean,
): IServerDebugSession | null {
  const [session, setSession] = useState<IDebugServerSessionResponse | null>(
    null,
  );
  const [gameState, setGameState] = useState<IPublicGameState | null>(null);
  const [pendingInput, setPendingInput] = useState<IPlayerInputModel | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const viewerId = session?.user.id ?? '';
  const gameId = session?.gameId ?? '';

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const [state, input] = await Promise.all([
        debugApi.getState(session.gameId, session.user.id),
        debugApi.getPendingInput(session.gameId, session.user.id),
      ]);
      if (cancelledRef.current) return;
      setGameState(state);
      setPendingInput(input);
      setErrorMessage(null);
    } catch (error) {
      if (cancelledRef.current) return;
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to refresh state',
      );
    }
  }, [session]);

  const applyState = useCallback(
    (state: IPublicGameState) => {
      if (cancelledRef.current) return;
      setGameState(state);
      void refresh();
    },
    [refresh],
  );

  const createSession = useCallback(async () => {
    setIsCreating(true);
    setErrorMessage(null);
    try {
      const next = await debugApi.createServerSession();
      if (cancelledRef.current) return null;
      setSession(next);
      const [state, input] = await Promise.all([
        debugApi.getState(next.gameId, next.user.id),
        debugApi.getPendingInput(next.gameId, next.user.id),
      ]);
      if (cancelledRef.current) return null;
      setGameState(state);
      setPendingInput(input);
      return next;
    } catch (error) {
      if (cancelledRef.current) return null;
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to create session',
      );
      return null;
    } finally {
      if (!cancelledRef.current) setIsCreating(false);
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    if (enabled && !session && !isCreating) {
      void createSession();
    }
    return () => {
      cancelledRef.current = true;
    };
  }, [enabled, session, isCreating, createSession]);

  const solarRotate = useCallback(
    async (discIndex: number) => {
      if (!session) return;
      try {
        const next = await debugApi.solarRotate(
          session.gameId,
          discIndex,
          session.user.id,
        );
        applyState(next);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Rotate failed',
        );
      }
    },
    [session, applyState],
  );

  const placeProbeOn = useCallback(
    async (spaceId: string) => {
      if (!session) return;
      try {
        const next = await debugApi.placeProbe(
          session.gameId,
          session.user.id,
          spaceId,
          session.user.id,
        );
        applyState(next);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Place probe failed',
        );
      }
    },
    [session, applyState],
  );

  const moveProbeTo = useCallback(
    async (probeId: string, toSpaceId: string) => {
      if (!session) return;
      try {
        const next = await debugApi.moveProbe(
          session.gameId,
          probeId,
          toSpaceId,
          session.user.id,
        );
        applyState(next);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Move probe failed',
        );
      }
    },
    [session, applyState],
  );

  const sendMainAction = useCallback(
    async (action: IMainActionRequest) => {
      if (!session) return;
      try {
        const next = await debugApi.sendMainAction(
          session.gameId,
          session.user.id,
          action,
          session.user.id,
        );
        applyState(next);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Main action failed',
        );
      }
    },
    [session, applyState],
  );

  const sendFreeAction = useCallback(
    async (action: IFreeActionRequest) => {
      if (!session) return;
      try {
        const next = await debugApi.sendFreeAction(
          session.gameId,
          session.user.id,
          action,
          session.user.id,
        );
        applyState(next);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Free action failed',
        );
      }
    },
    [session, applyState],
  );

  const sendInput = useCallback(
    async (response: IInputResponse) => {
      if (!session) return;
      try {
        const next = await debugApi.sendInput(
          session.gameId,
          session.user.id,
          response,
          session.user.id,
        );
        applyState(next);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Input failed',
        );
      }
    },
    [session, applyState],
  );

  const sendEndTurn = useCallback(async () => {
    if (!session) return;
    try {
      const next = await debugApi.sendEndTurn(
        session.gameId,
        session.user.id,
        session.user.id,
      );
      applyState(next);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'End turn failed',
      );
    }
  }, [session, applyState]);

  if (!enabled) return null;

  return {
    gameId,
    viewerId,
    gameState,
    pendingInput,
    isCreating,
    errorMessage,
    createSession,
    refresh,
    solarRotate,
    placeProbeOn,
    moveProbeTo,
    sendMainAction,
    sendFreeAction,
    sendEndTurn,
    sendInput,
  };
}
