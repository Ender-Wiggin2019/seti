import { useTranslation } from 'react-i18next';
import type { IGameOptions } from '@/api/types';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface IGameSettingsPanelProps {
  options: IGameOptions;
  readOnly: boolean;
}

export function GameSettingsPanel({
  options,
  readOnly,
}: IGameSettingsPanelProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <div className='space-y-3'>
      <h3 className='font-mono text-xs uppercase tracking-wider text-text-500'>
        {t('client.game_settings.title')}
      </h3>
      <div className='grid gap-2 text-sm'>
        <div className='flex items-center justify-between rounded-md bg-surface-900/50 px-3 py-2'>
          <Label>{t('client.game_settings.players')}</Label>
          <span className='font-mono text-text-100'>{options.playerCount}</span>
        </div>
        <div className='flex items-center justify-between rounded-md bg-surface-900/50 px-3 py-2'>
          <Label>{t('client.game_settings.alien_modules')}</Label>
          {readOnly ? (
            <span className='font-mono text-text-100'>
              {options.alienModulesEnabled
                ? t('client.common.on')
                : t('client.common.off')}
            </span>
          ) : (
            <Switch
              checked={options.alienModulesEnabled}
              onCheckedChange={() => undefined}
            />
          )}
        </div>
        <div className='flex items-center justify-between rounded-md bg-surface-900/50 px-3 py-2'>
          <Label>{t('client.game_settings.undo')}</Label>
          <span className='font-mono text-text-100'>
            {options.undoAllowed
              ? t('client.game_settings.undo_allowed')
              : t('client.game_settings.undo_disabled')}
          </span>
        </div>
        <div className='flex items-center justify-between rounded-md bg-surface-900/50 px-3 py-2'>
          <Label>{t('client.game_settings.turn_timer')}</Label>
          <span className='font-mono text-text-100'>
            {options.turnTimerSeconds > 0
              ? t('client.common.seconds_short', {
                  count: options.turnTimerSeconds,
                })
              : t('client.common.off')}
          </span>
        </div>
      </div>
    </div>
  );
}
