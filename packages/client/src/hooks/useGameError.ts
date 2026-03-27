import { useEffect } from 'react';
import { wsClient } from '@/api/wsClient';
import { toast } from '@/components/ui/toast';
import type { IErrorPayload } from '@/types/re-exports';

export function useGameError(): void {
  useEffect(() => {
    const handler = (error: IErrorPayload) => {
      toast({
        title: 'Game Error',
        description: error.message,
        variant: 'error',
      });
    };

    return wsClient.onError(handler);
  }, []);
}
