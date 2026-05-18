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

interface ISpaceAgencyOptionsSectionProps {
  options: IGameOptions;
  disabled: boolean;
  onChange?: (patch: IGameOptionsPatch) => void;
}

const SPACE_AGENCY_ALIENS = [
  EAlienType.GLYPHIDS,
  EAlienType.AMOEBA,
  EAlienType.ARKHOS,
] as const;

export function SpaceAgencyOptionsSection({
  options,
  disabled,
  onChange,
}: ISpaceAgencyOptionsSectionProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const spaceAgencyOptions =
    options.spaceAgencyOptions ?? DEFAULT_SPACE_AGENCY_OPTIONS;

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
        ? { ...DEFAULT_SPACE_AGENCY_OPTIONS, enabled: true }
        : { ...DEFAULT_SPACE_AGENCY_OPTIONS },
      {
        expansions,
        ...(enabled
          ? {}
          : {
              alienModulesEnabled: {
                [EAlienType.GLYPHIDS]: false,
                [EAlienType.AMOEBA]: false,
                [EAlienType.ARKHOS]: false,
              },
            }),
      },
    );
  };

  const handleOptionChange = (
    key: keyof Omit<ISpaceAgencyOptions, 'enabled'>,
    checked: boolean,
  ): void => {
    const nextOptions = {
      ...spaceAgencyOptions,
      [key]: checked,
    };

    if (key === 'agencies' && !checked) {
      nextOptions.startResourceCards = false;
    }

    const extraPatch: IGameOptionsPatch = {};
    if (key === 'newAlienSpecies' && !checked) {
      extraPatch.alienModulesEnabled = Object.fromEntries(
        SPACE_AGENCY_ALIENS.map((alienType) => [alienType, false]),
      ) as IGameOptionsPatch['alienModulesEnabled'];
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
      <div className='space-y-2 border-l border-[color:var(--metal-edge-soft)] pl-3'>
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
          disabled={disabled || !spaceAgencyOptions.enabled}
          onChange={(checked) => handleOptionChange('newAlienSpecies', checked)}
        />
        {spaceAgencyOptions.enabled && spaceAgencyOptions.newAlienSpecies ? (
          <div className='space-y-2 border-l border-[color:var(--metal-edge-soft)] pl-3'>
            {SPACE_AGENCY_ALIENS.map((alienType) => {
              const label = t(
                `client.alien_board.types.${getAlienTypeKey(alienType)}`,
                {
                  defaultValue: formatAlienLabel(alienType),
                },
              );
              return (
                <ToggleRow
                  key={alienType}
                  id={`space-agency-alien-${alienType}`}
                  label={label}
                  checked={options.alienModulesEnabled[alienType] === true}
                  disabled={disabled}
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
