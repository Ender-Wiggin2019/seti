import type { IAlienLobbyOption } from '@seti/common/constant/alienLobby';
import type {
  IGameOptions,
  IGameOptionsPatch,
} from '@seti/common/types/protocol/options';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/cn';
import { CoreAlienModulesSection } from '@/pages/lobby/CoreAlienModulesSection';
import { SpaceAgencyOptionsSection } from '@/pages/lobby/SpaceAgencyOptionsSection';

interface IGameOptionsEditorProps {
  options: IGameOptions;
  disabled: boolean;
  onChange?: (patch: IGameOptionsPatch) => void;
  alienTypeOptions?: readonly IAlienLobbyOption[];
  alienSwitchIdPrefix?: string;
  undoSwitchId?: string;
  timerInputId?: string;
  className?: string;
}

export function GameOptionsEditor({
  options,
  disabled,
  onChange,
  alienTypeOptions,
  alienSwitchIdPrefix = 'game-setting-alien',
  undoSwitchId = 'game-setting-undo-toggle',
  timerInputId = 'game-setting-timer',
  className,
}: IGameOptionsEditorProps): React.JSX.Element {
  const { t } = useTranslation('common');

  return (
    <div
      className={cn('space-y-4', className)}
      data-testid='game-options-editor'
    >
      <div className='space-y-1.5'>
        <Label variant='micro'>
          {t('client.create_room.alien_pool', {
            defaultValue: 'Alien random pool',
          })}
        </Label>
        <CoreAlienModulesSection
          options={options}
          disabled={disabled}
          onChange={onChange}
          alienTypeOptions={alienTypeOptions}
          idPrefix={alienSwitchIdPrefix}
        />
      </div>

      <SpaceAgencyOptionsSection
        options={options}
        disabled={disabled}
        onChange={onChange}
        alienTypeOptions={alienTypeOptions}
      />

      <ToggleRow
        id={undoSwitchId}
        label={t('client.create_room.undo')}
        checked={options.undoAllowed}
        disabled={disabled}
        onChange={(checked) => onChange?.({ undoAllowed: checked })}
      />

      <div className='space-y-1.5'>
        <Label htmlFor={timerInputId} variant='micro'>
          {t('client.create_room.turn_timer')}
        </Label>
        <div className='flex items-center gap-2'>
          <Input
            id={timerInputId}
            type='number'
            min={0}
            max={600}
            value={options.timerPerTurn}
            mono
            disabled={disabled}
            onChange={(event) =>
              onChange?.({ timerPerTurn: Number(event.target.value) })
            }
            className='max-w-[120px]'
          />
          <span className='font-mono text-[0.6875rem] uppercase tracking-microlabel text-text-500'>
            {t('client.common.seconds_unit', { defaultValue: 'SEC' })}
          </span>
        </div>
      </div>
    </div>
  );
}

interface IToggleRowProps {
  id: string;
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}

function ToggleRow({
  id,
  label,
  checked,
  disabled,
  onChange,
}: IToggleRowProps): React.JSX.Element {
  return (
    <div className='flex items-center justify-between gap-3'>
      <Label htmlFor={id} className='cursor-pointer'>
        {label}
      </Label>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        aria-label={label}
      />
    </div>
  );
}
