import type { IAlienLobbyOption } from '@seti/common/constant/alienLobby';
import { EAlienType } from '@seti/common/types/BaseCard';
import {
  DEFAULT_SPACE_AGENCY_OPTIONS,
  EExpansion,
  type IGameOptions,
  type IGameOptionsPatch,
  type ISpaceAgencyOptions,
} from '@seti/common/types/protocol/options';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { formatAlienLabel, getAlienTypeKey } from '@/lib/alien';
import { cn } from '@/lib/cn';

interface ISpaceAgencyOptionsSectionProps {
  options: IGameOptions;
  disabled: boolean;
  onChange?: (patch: IGameOptionsPatch) => void;
  alienTypeOptions?: readonly IAlienLobbyOption[];
}

const SPACE_AGENCY_ALIENS = [
  EAlienType.GLYPHIDS,
  EAlienType.AMOEBA,
  EAlienType.ARKHOS,
] as const;

const ENABLED_SPACE_AGENCY_OPTIONS: ISpaceAgencyOptions = {
  enabled: true,
  agencies: true,
  startResourceCards: true,
  newDeck: true,
  newAlienSpecies: true,
};

export function SpaceAgencyOptionsSection({
  options,
  disabled,
  onChange,
  alienTypeOptions,
}: ISpaceAgencyOptionsSectionProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const spaceAgencyOptions =
    options.spaceAgencyOptions ?? DEFAULT_SPACE_AGENCY_OPTIONS;
  const alienOptionByType = new Map(
    alienTypeOptions?.map((option) => [option.alienType, option]),
  );

  const isSpaceAgencyAlienAvailable = (
    alienType: (typeof SPACE_AGENCY_ALIENS)[number],
  ): boolean => alienOptionByType.get(alienType)?.disabled !== true;

  const hasAvailableSpaceAgencyAliens = SPACE_AGENCY_ALIENS.some((alienType) =>
    isSpaceAgencyAlienAvailable(alienType),
  );

  const createSpaceAgencyAlienPatch = (
    checked: boolean,
  ): Pick<IGameOptionsPatch, 'alienModulesEnabled'> => ({
    alienModulesEnabled: Object.fromEntries(
      SPACE_AGENCY_ALIENS.map((alienType) => [
        alienType,
        checked && isSpaceAgencyAlienAvailable(alienType),
      ]),
    ) as IGameOptionsPatch['alienModulesEnabled'],
  });

  const emitSpaceAgencyPatch = (
    nextOptions: ISpaceAgencyOptions,
    extraPatch: IGameOptionsPatch = {},
  ): void => {
    onChange?.({
      ...extraPatch,
      spaceAgencyOptions: nextOptions,
    });
  };

  const handleEnabledChange = (enabled: boolean): void => {
    const expansions = enabled
      ? Array.from(new Set([...options.expansions, EExpansion.SPACE_AGENCY]))
      : options.expansions.filter(
          (expansion) => expansion !== EExpansion.SPACE_AGENCY,
        );

    emitSpaceAgencyPatch(
      enabled
        ? {
            ...ENABLED_SPACE_AGENCY_OPTIONS,
            newAlienSpecies: hasAvailableSpaceAgencyAliens,
          }
        : { ...DEFAULT_SPACE_AGENCY_OPTIONS },
      {
        expansions,
        ...createSpaceAgencyAlienPatch(enabled),
      },
    );
  };

  const handleOptionChange = (
    key: keyof Omit<ISpaceAgencyOptions, 'enabled'>,
    checked: boolean,
  ): void => {
    const nextChecked =
      key === 'newAlienSpecies'
        ? checked && hasAvailableSpaceAgencyAliens
        : checked;
    const nextOptions = {
      ...spaceAgencyOptions,
      [key]: nextChecked,
    };

    if (key === 'agencies' && !checked) {
      nextOptions.startResourceCards = false;
    }

    const extraPatch: IGameOptionsPatch = {};
    if (key === 'newAlienSpecies') {
      extraPatch.alienModulesEnabled =
        createSpaceAgencyAlienPatch(nextChecked).alienModulesEnabled;
    }

    emitSpaceAgencyPatch(nextOptions, extraPatch);
  };

  const handleAlienChange = (
    alienType: (typeof SPACE_AGENCY_ALIENS)[number],
    checked: boolean,
  ): void => {
    onChange?.({
      alienModulesEnabled: {
        ...options.alienModulesEnabled,
        [alienType]: checked,
      },
    });
  };

  return (
    <div className='space-y-2' data-testid='space-agency-options'>
      <ToggleRow
        id='space-agency-enabled'
        label={t('client.game_settings.space_agency')}
        checked={spaceAgencyOptions.enabled}
        disabled={disabled}
        onChange={handleEnabledChange}
      />
      <div
        className={cn(
          'space-y-2 rounded-[5px] border border-[color:var(--metal-edge-soft)] bg-[oklch(0.10_0.02_260/0.42)] p-2 shadow-hairline-inset',
          !spaceAgencyOptions.enabled && 'opacity-70',
        )}
      >
        <ToggleRow
          id='space-agency-agencies'
          label={t('client.space_agency_options.organizations')}
          checked={spaceAgencyOptions.agencies}
          disabled={disabled || !spaceAgencyOptions.enabled}
          onChange={(checked) => handleOptionChange('agencies', checked)}
        />
        <ToggleRow
          id='space-agency-quick-start'
          label={t('client.space_agency_options.quick_start_cards')}
          checked={spaceAgencyOptions.startResourceCards}
          disabled={
            disabled ||
            !spaceAgencyOptions.enabled ||
            !spaceAgencyOptions.agencies
          }
          onChange={(checked) =>
            handleOptionChange('startResourceCards', checked)
          }
        />
        <ToggleRow
          id='space-agency-new-deck'
          label={t('client.space_agency_options.new_deck')}
          checked={spaceAgencyOptions.newDeck}
          disabled={disabled || !spaceAgencyOptions.enabled}
          onChange={(checked) => handleOptionChange('newDeck', checked)}
        />
        <ToggleRow
          id='space-agency-new-aliens'
          label={t('client.space_agency_options.new_alien_species')}
          checked={spaceAgencyOptions.newAlienSpecies}
          disabled={
            disabled ||
            !spaceAgencyOptions.enabled ||
            !hasAvailableSpaceAgencyAliens
          }
          onChange={(checked) => handleOptionChange('newAlienSpecies', checked)}
        />
        {spaceAgencyOptions.enabled && spaceAgencyOptions.newAlienSpecies ? (
          <div className='space-y-2 rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-[oklch(0.08_0.018_260/0.38)] p-2'>
            {SPACE_AGENCY_ALIENS.map((alienType) => {
              const label = t(
                `client.alien_board.types.${getAlienTypeKey(alienType)}`,
                {
                  defaultValue: formatAlienLabel(alienType),
                },
              );
              const isAvailable = isSpaceAgencyAlienAvailable(alienType);
              const displayLabel = isAvailable
                ? label
                : `${label}${t('client.create_room.alien_pool_disabled', {
                    defaultValue: ' (disabled)',
                  })}`;
              return (
                <ToggleRow
                  key={alienType}
                  id={`space-agency-alien-${alienType}`}
                  label={displayLabel}
                  checked={
                    isAvailable &&
                    options.alienModulesEnabled[alienType] === true
                  }
                  disabled={disabled || !isAvailable}
                  onChange={(checked) => handleAlienChange(alienType, checked)}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface IToggleRowProps {
  id: string;
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
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
      <Label htmlFor={id}>{label}</Label>
      <Switch
        id={id}
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
      />
    </div>
  );
}
