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
  return (
    <div className='space-y-3'>
      <h3 className='font-mono text-xs uppercase tracking-wider text-text-500'>
        Mission Parameters
      </h3>
      <div className='grid gap-2 text-sm'>
        <div className='flex items-center justify-between rounded-md bg-surface-900/50 px-3 py-2'>
          <Label>Operatives</Label>
          <span className='font-mono text-text-100'>{options.playerCount}</span>
        </div>
        <div className='flex items-center justify-between rounded-md bg-surface-900/50 px-3 py-2'>
          <Label>Alien Modules</Label>
          {readOnly ? (
            <span className='font-mono text-text-100'>
              {options.alienModulesEnabled ? 'On' : 'Off'}
            </span>
          ) : (
            <Switch
              checked={options.alienModulesEnabled}
              onCheckedChange={() => undefined}
            />
          )}
        </div>
        <div className='flex items-center justify-between rounded-md bg-surface-900/50 px-3 py-2'>
          <Label>Undo</Label>
          <span className='font-mono text-text-100'>
            {options.undoAllowed ? 'Allowed' : 'Disabled'}
          </span>
        </div>
        <div className='flex items-center justify-between rounded-md bg-surface-900/50 px-3 py-2'>
          <Label>Turn Timer</Label>
          <span className='font-mono text-text-100'>
            {options.turnTimerSeconds > 0
              ? `${options.turnTimerSeconds}s`
              : 'Off'}
          </span>
        </div>
      </div>
    </div>
  );
}
