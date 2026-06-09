import { useCallback, useEffect, useState } from 'react';
import { wsClient } from '@/api/wsClient';
import type {
  IInputResponse,
  IPlayerInputModel,
  IPublicGameState,
} from '@/types/re-exports';

interface IUsePlayerInputReturn {
  pendingInput: IPlayerInputModel | null;
  waitingPlayerId: string | null;
  respond: (gameId: string, response: IInputResponse) => void;
}

/**
 * Resolves the input prompt the local player must answer.
 *
 * `gameState.pendingInput` is the single source of truth: the server
 * projects it per-viewer on every state frame, so it can both set AND
 * clear the prompt. We no longer reconcile the transient `game:waiting`
 * socket event against the game phase (the old heuristic could keep a
 * resolved prompt alive — or drop a live one — leaving the player with a
 * "waiting" status and nothing to interact with).
 *
 * The `game:waiting` event is kept only as a fast-path for the brief
 * window before the first authoritative state frame arrives (e.g. a fresh
 * connect). It can never resurrect an input the state has already
 * cleared, because once `gameState` exists it wins outright.
 */
export function usePlayerInput(
  gameState: IPublicGameState | null,
  myPlayerId: string,
): IUsePlayerInputReturn {
  const [fastPathInput, setFastPathInput] = useState<IPlayerInputModel | null>(
    null,
  );

  useEffect(() => {
    const handler = (data: {
      playerId: string;
      input: IPlayerInputModel;
    }): void => {
      if (data.playerId === myPlayerId) {
        setFastPathInput(data.input);
      }
    };

    return wsClient.onWaiting(handler);
  }, [myPlayerId]);

  // Once an authoritative state frame has been applied, drop the
  // fast-path value so it can never linger past the state's truth.
  useEffect(() => {
    if (gameState) {
      setFastPathInput(null);
    }
  }, [gameState]);

  // Authoritative when loaded; fall back to the fast-path only before the
  // first state frame exists.
  const pendingInput = gameState
    ? (gameState.pendingInput ?? null)
    : fastPathInput;
  const waitingPlayerId = pendingInput ? myPlayerId : null;

  const respond = useCallback((gameId: string, response: IInputResponse) => {
    wsClient.sendInput(gameId, response);
  }, []);

  return { pendingInput, waitingPlayerId, respond };
}
