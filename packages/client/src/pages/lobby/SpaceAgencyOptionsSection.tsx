import { EAlienType } from '@seti/common/types/BaseCard';
import {
  DEFAULT_SPACE_AGENCY_OPTIONS,
  EExpansion,
  type IGameOptions,
  type IGameOptionsPatch,
  type ISpaceAgencyOptions,
} from '@seti/common/types/protocol/options';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ISpaceAgencyOptionsSectionProps {
  options: IGameOptions;
  disabled: boolean;
  onChange?: (patch: IGameOptionsPatch) => void;
}

const SPACE_AGENCY_ALIENS = [EAlienType.GLYPHIDS, EAlienType.AMOEBA] as const;

export function SpaceAgencyOptionsSection({
  options,
  disabled,
  onChange,
}: ISpaceAgencyOptionsSectionProps): React.JSX.Element {
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

  return (
    <div className='space-y-2' data-testid='space-agency-options'>
      <ToggleRow
        id='space-agency-enabled'
        label='Space Agency'
        checked={spaceAgencyOptions.enabled}
        disabled={disabled}
        onChange={handleEnabledChange}
      />
      <div className='space-y-2 border-l border-[color:var(--metal-edge-soft)] pl-3'>
        <ToggleRow
          id='space-agency-agencies'
          label='Organizations'
          checked={spaceAgencyOptions.agencies}
          disabled={disabled || !spaceAgencyOptions.enabled}
          onChange={(checked) => handleOptionChange('agencies', checked)}
        />
        <ToggleRow
          id='space-agency-quick-start'
          label='Quick Start Cards'
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
          label='New Deck'
          checked={spaceAgencyOptions.newDeck}
          disabled={disabled || !spaceAgencyOptions.enabled}
          onChange={(checked) => handleOptionChange('newDeck', checked)}
        />
        <ToggleRow
          id='space-agency-new-aliens'
          label='New Alien Species'
          checked={spaceAgencyOptions.newAlienSpecies}
          disabled={disabled || !spaceAgencyOptions.enabled}
          onChange={(checked) => handleOptionChange('newAlienSpecies', checked)}
        />
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
