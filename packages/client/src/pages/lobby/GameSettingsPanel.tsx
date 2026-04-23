import { useTranslation } from 'react-i18next';
import type { IGameOptions } from '@/api/types';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/cn';

interface IGameSettingsPanelProps {
  options: IGameOptions;
  readOnly: boolean;
}

/**
 * GameSettingsPanel — the mission parameters readout.
 *
 * Each row is an instrument line: micro-label caption on the left,
 * mono-readout value (or a Switch when mutable) on the right.
 * Rows are joined by hairlines — no card walls between them — so the
 * whole panel reads as a single instrument strip.
 */
export function GameSettingsPanel({
  options,
  readOnly,
}: IGameSettingsPanelProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <div className='space-y-3'>
      <h3 className='micro-label'>{t('client.game_settings.title')}</h3>
      <dl
        className={cn(
          'divide-y divide-[color:var(--metal-edge-soft)]',
          'rounded-[4px] border border-[color:var(--metal-edge-soft)]',
          'bg-[oklch(0.10_0.02_260/0.5)] shadow-hairline-inset',
        )}
      >
        <ReadoutRow
          label={t('client.game_settings.players')}
          value={String(options.playerCount)}
          testId='players'
        />
        <ReadoutRow label={t('client.game_settings.alien_modules')} testId='alien-modules'>
          {readOnly ? (
            <StatusValue
              active={options.alienModulesEnabled.some((enabled) => enabled)}
              on={t('client.common.on')}
              off={t('client.common.off')}
              testId='alien-modules'
            />
          ) : (
            <Switch
              checked={options.alienModulesEnabled.some((enabled) => enabled)}
              onCheckedChange={() => undefined}
            />
          )}
        </ReadoutRow>
        <ReadoutRow label={t('client.game_settings.undo')}>
          <StatusValue
            active={options.undoAllowed}
            on={t('client.game_settings.undo_allowed')}
            off={t('client.game_settings.undo_disabled')}
            testId='undo'
          />
        </ReadoutRow>
        <ReadoutRow
          label={t('client.game_settings.turn_timer')}
          value={
            options.timerPerTurn > 0
              ? t('client.common.seconds_short', {
                  count: options.timerPerTurn,
                })
              : t('client.common.off')
          }
          testId='turn-timer'
        />
      </dl>
    </div>
  );
}

interface IReadoutRowProps {
  label: string;
  value?: string;
  children?: React.ReactNode;
  testId?: string;
}

function ReadoutRow({
  label,
  value,
  children,
  testId,
}: IReadoutRowProps): React.JSX.Element {
  return (
    <div
      className='flex items-center justify-between gap-3 px-3 py-2.5'
      data-testid={testId ? `game-setting-${testId}` : undefined}
    >
      <dt className='micro-label text-text-400'>{label}</dt>
      <dd>
        {value != null ? (
          <span
            className='readout text-sm text-text-100'
            data-testid={testId ? `game-setting-value-${testId}` : undefined}
          >
            {value}
          </span>
        ) : (
          children
        )}
      </dd>
    </div>
  );
}

function StatusValue({
  active,
  on,
  off,
  testId,
}: {
  active: boolean;
  on: string;
  off: string;
  testId?: string;
}): React.JSX.Element {
  return (
    <span
      className='flex items-center gap-1.5'
      data-testid={testId ? `game-setting-value-${testId}` : undefined}
    >
      <span
        aria-hidden
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          active
            ? 'bg-[oklch(0.74_0.13_150)] shadow-[0_0_4px_oklch(0.68_0.14_150/0.6)]'
            : 'bg-[oklch(0.40_0.02_260)]',
        )}
      />
      <span className='readout text-sm text-text-100'>{active ? on : off}</span>
    </span>
  );
}
