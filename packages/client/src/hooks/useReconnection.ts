import { useEffect } from 'react';
import { wsClient } from '@/api/wsClient';

export function useReconnection(gameId: string): void {
  useEffect(() => {
    const socket = wsClient.instance;
    if (!socket) return;

    const handleReconnect = () => {
      wsClient.joinGame(gameId);
    };

    const handleDisconnect = (reason: string) => {
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    };

    socket.on('reconnect', handleReconnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('reconnect', handleReconnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [gameId]);
}
