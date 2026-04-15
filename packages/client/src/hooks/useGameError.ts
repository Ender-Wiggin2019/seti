import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { wsClient } from '@/api/wsClient';
import { toast } from '@/components/ui/toast';
import type { IErrorPayload } from '@/types/re-exports';

export function useGameError(): void {
  const { t } = useTranslation('common');
  useEffect(() => {
    const handler = (error: IErrorPayload) => {
      toast({
        title: t('client.game.toast.error'),
        description: error.message,
        variant: 'error',
      });
    };

    return wsClient.onError(handler);
  }, [t]);
}
