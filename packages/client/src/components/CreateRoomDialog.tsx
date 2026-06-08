import {
  CORE_RANDOM_ALIEN_TYPES,
  type IAlienLobbyOption,
} from '@seti/common/constant/alienLobby';
import { SOLO_DIFFICULTIES } from '@seti/common/constant/solo';
import { EAlienMap, type EAlienType } from '@seti/common/types/BaseCard';
import {
  createGameOptions,
  DEFAULT_ALIEN_MODULES_ENABLED,
  type IGameOptionsPatch,
} from '@seti/common/types/protocol/options';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import type { IAlienTypeOption, IGameOptions } from '@/api/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';
import { applyGameOptionsPatch } from '@/lib/gameOptions';
import { GameOptionsEditor } from '@/pages/lobby/GameOptionsEditor';

interface ICreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, options: IGameOptions) => void;
  isPending: boolean;
  alienTypeMap?: Record<string, IAlienTypeOption>;
}

const createRoomSchema = z.object({
  name: z.string().trim().max(50),
  playerCount: z.number().min(2).max(4),
});

function createDefaultCreateRoomOptions(): IGameOptions {
  const alienModulesEnabled = CORE_RANDOM_ALIEN_TYPES.reduce(
    (enabled, alienType) => ({
      ...enabled,
      [alienType]: true,
    }),
    { ...DEFAULT_ALIEN_MODULES_ENABLED },
  );

  return createGameOptions({ alienModulesEnabled }) as IGameOptions;
}

/**
 * CreateRoomDialog — the mission setup form.
 *
 * Grouped by instrument section: Identification (name + player count),
 * Rules (alien modules, expansions, undo policy, and timer). Each
 * section is separated by a hairline — no inner cards — and every
 * label is a micro-label cap so the whole form reads as a control
 * desk rather than a settings list.
 */
export function CreateRoomDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  alienTypeMap,
}: ICreateRoomDialogProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const [name, setName] = useState('');
  const [options, setOptions] = useState<IGameOptions>(
    createDefaultCreateRoomOptions,
  );

  const alienTypeOptions = useMemo<IAlienLobbyOption[]>(() => {
    const values = Object.values(alienTypeMap ?? {});
    if (values.length > 0) {
      return values
        .map((option) => ({
          ...option,
          alienType: Number(option.alienType) as EAlienType,
        }))
        .sort((a, b) => a.alienType - b.alienType);
    }

    return CORE_RANDOM_ALIEN_TYPES.map((alienType) => ({
      alienType,
      alienName: EAlienMap[alienType],
      disabled: false,
    }));
  }, [alienTypeMap]);

  const enabledAlienTypes = useMemo(
    () => alienTypeOptions.filter((option) => !option.disabled),
    [alienTypeOptions],
  );

  useEffect(() => {
    setOptions((previous) => {
      const enabledTypeSet = new Set(
        enabledAlienTypes.map((type) => type.alienType),
      );
      const previousSelected = CORE_RANDOM_ALIEN_TYPES.filter(
        (type) => previous.alienModulesEnabled[type] !== false,
      );
      const filtered = previousSelected.filter(
        (type) =>
          previous.alienModulesEnabled[type] !== false &&
          enabledTypeSet.has(type),
      );

      const missing = enabledAlienTypes
        .map((type) => type.alienType)
        .filter(
          (type) =>
            CORE_RANDOM_ALIEN_TYPES.includes(type) && !filtered.includes(type),
        );

      const selectedAlienTypes =
        filtered.length >= 2 ? filtered : [...filtered, ...missing].slice(0, 2);
      const isUnchanged = CORE_RANDOM_ALIEN_TYPES.every(
        (alienType) =>
          previous.alienModulesEnabled[alienType] ===
          selectedAlienTypes.includes(alienType),
      );

      if (isUnchanged) {
        return previous;
      }

      return applyGameOptionsPatch(previous, {
        alienModulesEnabled: CORE_RANDOM_ALIEN_TYPES.reduce(
          (enabled, alienType) => ({
            ...enabled,
            [alienType]: selectedAlienTypes.includes(alienType),
          }),
          { ...previous.alienModulesEnabled },
        ),
      });
    });
  }, [enabledAlienTypes]);

  const handleOptionsChange = (patch: IGameOptionsPatch): void => {
    setOptions((previous) => applyGameOptionsPatch(previous, patch));
  };

  const handleSoloModeChange = (nextChecked: boolean): void => {
    setOptions((previous) =>
      applyGameOptionsPatch(previous, {
        isSoloMode: nextChecked,
        playerCount: nextChecked ? 2 : previous.playerCount,
      }),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectivePlayerCount = options.isSoloMode ? 2 : options.playerCount;
    const effectiveName =
      name.trim() ||
      t('client.create_room.default_name', { defaultValue: 'New Mission' });
    const result = createRoomSchema.safeParse({
      name: effectiveName,
      playerCount: effectivePlayerCount,
    });
    if (!result.success) {
      toast({
        title: t('client.create_room.validation.invalid_options'),
        variant: 'error',
      });
      return;
    }

    let finalOptions: IGameOptions;
    try {
      finalOptions = createGameOptions({
        ...options,
        playerCount: effectivePlayerCount,
      }) as IGameOptions;
    } catch {
      toast({
        title: t('client.create_room.validation.invalid_options'),
        variant: 'error',
      });
      return;
    }

    onSubmit(result.data.name, finalOptions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid='create-room-dialog'
        className='max-h-[calc(100vh-2rem)] max-w-lg overflow-y-auto p-0'
      >
        <DialogHeader className='px-6 pt-6'>
          <span className='micro-label text-[oklch(0.74_0.10_240)]'>
            {t('client.create_room.kicker', {
              defaultValue: 'New Mission',
            })}
          </span>
          <DialogTitle>{t('client.create_room.title')}</DialogTitle>
          <DialogDescription>
            {t('client.create_room.subtitle', {
              defaultValue:
                'Choose players, modules, and turn settings before the game begins.',
            })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className='divide-y divide-[color:var(--metal-edge-soft)]'>
            <SectionBlock
              title={t('client.create_room.section.identification', {
                defaultValue: 'Identification',
              })}
            >
              <ModeSelector
                isSoloMode={options.isSoloMode}
                onChange={handleSoloModeChange}
              />
              <div className='space-y-1.5'>
                <Label htmlFor='room-name' variant='micro'>
                  {t('client.create_room.name')}
                </Label>
                <Input
                  id='room-name'
                  placeholder={t('client.create_room.name_placeholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              {options.isSoloMode ? (
                <div className='space-y-2'>
                  <Label htmlFor='solo-difficulty' variant='micro'>
                    {t('client.create_room.solo_difficulty', {
                      defaultValue: 'Rival Difficulty',
                    })}
                  </Label>
                  <div
                    id='solo-difficulty'
                    className='grid grid-cols-5 gap-1.5'
                    role='group'
                    aria-label={t('client.create_room.solo_difficulty', {
                      defaultValue: 'Rival Difficulty',
                    })}
                  >
                    {SOLO_DIFFICULTIES.map((difficulty) => (
                      <Button
                        key={difficulty}
                        type='button'
                        variant={
                          options.soloDifficulty === difficulty
                            ? 'primary'
                            : 'ghost'
                        }
                        size='sm'
                        className='h-8 px-0 font-mono text-xs'
                        onClick={() =>
                          handleOptionsChange({ soloDifficulty: difficulty })
                        }
                        aria-pressed={options.soloDifficulty === difficulty}
                      >
                        {difficulty}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className='space-y-1.5'>
                  <Label htmlFor='player-count' variant='micro'>
                    {t('client.create_room.players')}
                  </Label>
                  <Select
                    value={String(options.playerCount)}
                    onValueChange={(value) =>
                      handleOptionsChange({ playerCount: Number(value) })
                    }
                  >
                    <SelectTrigger id='player-count'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='2'>
                        {t('client.create_room.player_count.2')}
                      </SelectItem>
                      <SelectItem value='3'>
                        {t('client.create_room.player_count.3')}
                      </SelectItem>
                      <SelectItem value='4'>
                        {t('client.create_room.player_count.4')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </SectionBlock>

            <SectionBlock
              title={t('client.create_room.section.rules', {
                defaultValue: 'Rules',
              })}
            >
              <GameOptionsEditor
                options={options}
                disabled={false}
                onChange={handleOptionsChange}
                alienTypeOptions={alienTypeOptions}
                alienSwitchIdPrefix='alien-type'
                undoSwitchId='undo-toggle'
                timerInputId='timer'
              />
            </SectionBlock>
          </div>

          <DialogFooter className='px-6 py-4'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => onOpenChange(false)}
            >
              {t('client.common.cancel')}
            </Button>
            <Button
              type='submit'
              disabled={isPending}
              data-testid='create-room-submit'
            >
              {isPending
                ? t('client.create_room.actions.launching')
                : t('client.create_room.actions.launch')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ModeSelector({
  isSoloMode,
  onChange,
}: {
  isSoloMode: boolean;
  onChange: (next: boolean) => void;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  const multiplayerLabel = t('client.create_room.mode_multiplayer', {
    defaultValue: 'Multiplayer Mission',
  });
  const soloLabel = t('client.create_room.mode_solo', {
    defaultValue: 'Solo Mission',
  });

  return (
    <div className='space-y-1.5'>
      <Label variant='micro'>
        {t('client.game_settings.mode', { defaultValue: 'Mode' })}
      </Label>
      <div
        className='grid grid-cols-2 gap-1 rounded-[5px] border border-[color:var(--metal-edge)] bg-[oklch(0.10_0.02_260/0.72)] p-1 shadow-hairline-inset'
        role='group'
        aria-label={t('client.game_settings.mode', { defaultValue: 'Mode' })}
      >
        <ModeButton
          label={multiplayerLabel}
          meta={t('client.create_room.mode_multiplayer_meta', {
            defaultValue: '2-4 Players',
          })}
          pressed={!isSoloMode}
          onClick={() => onChange(false)}
        />
        <ModeButton
          label={soloLabel}
          meta={t('client.create_room.mode_solo_meta', {
            defaultValue: '1 Player + Rival',
          })}
          pressed={isSoloMode}
          onClick={() => onChange(true)}
        />
      </div>
    </div>
  );
}

function ModeButton({
  label,
  meta,
  pressed,
  onClick,
}: {
  label: string;
  meta: string;
  pressed: boolean;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <button
      type='button'
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'flex min-h-14 flex-col items-start justify-center rounded-[4px] px-3 py-2 text-left',
        'transition-[background,border-color,color,box-shadow] duration-150',
        'focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--bg-950),0_0_0_4px_oklch(0.68_0.11_240/0.72)]',
        pressed
          ? 'border border-[#1d8790] bg-[var(--lobby-engine-cyan)] text-[var(--lobby-deep-space)] shadow-[inset_0_1px_0_oklch(0.96_0.02_230/0.42)]'
          : 'border border-transparent text-text-300 hover:border-[color:var(--metal-edge-soft)] hover:bg-surface-800/55 hover:text-text-100',
      )}
    >
      <span className='text-sm font-semibold leading-none'>{label}</span>
      <span
        className={cn(
          'mt-1 font-mono text-[0.6875rem] tracking-[0.06em]',
          pressed ? 'opacity-70' : 'text-text-500',
        )}
      >
        {meta}
      </span>
    </button>
  );
}

function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className='space-y-4 px-6 py-5'>
      <h4 className='micro-label text-text-500'>{title}</h4>
      {children}
    </section>
  );
}
