import {
  CORE_RANDOM_ALIEN_TYPES,
  type IAlienLobbyOption,
} from '@seti/common/constant/alienLobby';
import type { EAlienType } from '@seti/common/types/BaseCard';
import type {
  IGameOptions,
  IGameOptionsPatch,
} from '@seti/common/types/protocol/options';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { formatAlienLabel, getAlienTypeKey } from '@/lib/alien';

interface ICoreAlienModulesSectionProps {
  options: IGameOptions;
  disabled: boolean;
  onChange?: (patch: IGameOptionsPatch) => void;
  alienTypeOptions?: readonly IAlienLobbyOption[];
  idPrefix?: string;
}

export function CoreAlienModulesSection({
  options,
  disabled,
  onChange,
  alienTypeOptions,
  idPrefix = 'game-setting-alien',
}: ICoreAlienModulesSectionProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const optionRows =
    alienTypeOptions ??
    CORE_RANDOM_ALIEN_TYPES.map((alienType) => ({
      alienType,
      alienName: getAlienTypeKey(alienType),
      disabled: false,
    }));
  const selectedCoreCount = CORE_RANDOM_ALIEN_TYPES.filter(
    (alienType) => options.alienModulesEnabled[alienType] !== false,
  ).length;

  const toggleAlien = (alienType: EAlienType, checked: boolean): void => {
    onChange?.({
      alienModulesEnabled: {
        ...options.alienModulesEnabled,
        [alienType]: checked,
      },
    });
  };

  return (
    <div className='space-y-2' data-testid='core-alien-modules'>
      {optionRows.map((option) => {
        const alienType = option.alienType;
        const checked = options.alienModulesEnabled[alienType] !== false;
        const locked =
          checked &&
          selectedCoreCount <= 2 &&
          CORE_RANDOM_ALIEN_TYPES.includes(alienType);
        const fallbackLabel = formatAlienLabel(alienType);
        const label = t(
          `client.alien_board.types.${getAlienTypeKey(alienType)}`,
          {
            defaultValue: option.alienName ?? fallbackLabel,
          },
        );
        const displayLabel =
          option.disabled && !disabled
            ? `${label}${t('client.create_room.alien_pool_disabled', {
                defaultValue: ' (disabled)',
              })}`
            : label;

        return (
          <div
            key={alienType}
            className='flex items-center justify-between gap-3'
          >
            <Label htmlFor={`${idPrefix}-${alienType}`} className='capitalize'>
              {displayLabel}
            </Label>
            <Switch
              id={`${idPrefix}-${alienType}`}
              aria-label={displayLabel}
              checked={checked}
              disabled={disabled || option.disabled || locked}
              onCheckedChange={(nextChecked) =>
                toggleAlien(alienType, nextChecked)
              }
            />
          </div>
        );
      })}
    </div>
  );
}
