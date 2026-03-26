import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { wsClient } from '@/api/wsClient';
import { useAuthStore } from '@/stores/authStore';

interface IUseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
}

export function useSocket(): IUseSocketReturn {
  const token = useAuthStore((s) => s.token);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = wsClient.connect(token);
    socketRef.current = socket;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (socket.connected) setIsConnected(true);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      wsClient.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token]);

  return { socket: socketRef.current, isConnected };
}
