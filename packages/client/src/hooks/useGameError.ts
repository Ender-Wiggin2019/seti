import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { wsClient } from '@/api/wsClient';
import { toast } from '@/components/ui/toast';
import {
  EErrorDisplay,
  EErrorSeverity,
  type IErrorPayload,
  normalizeErrorPayload,
} from '@/types/re-exports';

export function useGameError(): void {
  const { t } = useTranslation('common');
  useEffect(() => {
    const handler = (error: IErrorPayload) => {
      const normalized = normalizeErrorPayload(error);
      if (
        normalized.display === EErrorDisplay.NONE ||
        normalized.severity === EErrorSeverity.SILENT
      ) {
        return;
      }

      const isBlocking = normalized.display === EErrorDisplay.BLOCKING;
      const isWarning = normalized.severity === EErrorSeverity.WARNING;
      toast({
        title: isBlocking
          ? t('client.game.toast.blocking')
          : isWarning
            ? t('client.game.toast.warning')
            : t('client.game.toast.error'),
        description: normalized.message,
        variant: isWarning ? 'warning' : 'error',
        ...(isBlocking ? { duration: null } : {}),
      });
    };

    return wsClient.onError(handler);
  }, [t]);
}
