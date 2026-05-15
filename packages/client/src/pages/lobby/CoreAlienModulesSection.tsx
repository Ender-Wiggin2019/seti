import { CORE_RANDOM_ALIEN_TYPES } from '@seti/common/constant/alienLobby';
import { EAlienMap, type EAlienType } from '@seti/common/types/BaseCard';
import type {
  IGameOptions,
  IGameOptionsPatch,
} from '@seti/common/types/protocol/options';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ICoreAlienModulesSectionProps {
  options: IGameOptions;
  disabled: boolean;
  onChange?: (patch: IGameOptionsPatch) => void;
}

export function CoreAlienModulesSection({
  options,
  disabled,
  onChange,
}: ICoreAlienModulesSectionProps): React.JSX.Element {
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
      {CORE_RANDOM_ALIEN_TYPES.map((alienType) => {
        const checked = options.alienModulesEnabled[alienType] !== false;
        const locked = checked && selectedCoreCount <= 2;
        const label = EAlienMap[alienType];

        return (
          <div
            key={alienType}
            className='flex items-center justify-between gap-3'
          >
            <Label
              htmlFor={`game-setting-alien-${alienType}`}
              className='capitalize'
            >
              {label}
            </Label>
            <Switch
              id={`game-setting-alien-${alienType}`}
              aria-label={label[0].toUpperCase() + label.slice(1)}
              checked={checked}
              disabled={disabled || locked}
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
