import { CORE_RANDOM_ALIEN_TYPES } from '@seti/common/constant/alienLobby';
import { EAlienMap } from '@seti/common/types/BaseCard';
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
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';

interface ICreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, options: IGameOptions) => void;
  isPending: boolean;
  alienTypeMap?: Record<string, IAlienTypeOption>;
}

const createRoomSchema = z.object({
  name: z.string().trim().min(1).max(50),
  playerCount: z.number().min(2).max(4),
});

/**
 * CreateRoomDialog — the mission brief form.
 *
 * Grouped by instrument section: Identification (name + crew size),
 * Rules (alien modules + undo policy), Tempo (turn timer). Each
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
  const [playerCount, setPlayerCount] = useState(2);
  const [selectedAlienTypes, setSelectedAlienTypes] = useState<number[]>([]);
  const [undoAllowed, setUndoAllowed] = useState(true);
  const [timerPerTurn, setTimerPerTurn] = useState(0);

  const alienTypeOptions = useMemo(() => {
    const values = Object.values(alienTypeMap ?? {});
    if (values.length > 0) {
      return values.sort((a, b) => a.alienType - b.alienType);
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

  const selectedCoreCount = useMemo(
    () =>
      CORE_RANDOM_ALIEN_TYPES.filter((alienType) =>
        selectedAlienTypes.includes(alienType),
      ).length,
    [selectedAlienTypes],
  );

  useEffect(() => {
    setSelectedAlienTypes((previous) => {
      const enabledTypeSet = new Set(
        enabledAlienTypes.map((type) => type.alienType),
      );
      const filtered = previous.filter((type) => enabledTypeSet.has(type));

      if (filtered.length >= 2) {
        return filtered;
      }

      const missing = enabledAlienTypes
        .map((type) => type.alienType)
        .filter((type) => !filtered.includes(type));

      return [...filtered, ...missing].slice(0, 2);
    });
  }, [enabledAlienTypes]);

  const handleAlienTypeToggle = (alienType: number, nextChecked: boolean) => {
    setSelectedAlienTypes((previous) => {
      if (nextChecked) {
        return previous.includes(alienType)
          ? previous
          : [...previous, alienType];
      }
      if (!previous.includes(alienType)) {
        return previous;
      }
      if (previous.length <= 2) {
        return previous;
      }
      return previous.filter((type) => type !== alienType);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = createRoomSchema.safeParse({ name, playerCount });
    if (!result.success) {
      const nameIssue = result.error.issues.find(
        (issue) => issue.path[0] === 'name',
      );
      toast({
        title: nameIssue
          ? t('client.create_room.validation.name_required')
          : t('client.create_room.validation.invalid_options'),
        variant: 'error',
      });
      return;
    }

    const selectedCoreAlienTypes = CORE_RANDOM_ALIEN_TYPES.filter((alienType) =>
      selectedAlienTypes.includes(alienType),
    );

    if (selectedCoreAlienTypes.length < 2) {
      toast({
        title: t('client.create_room.validation.invalid_options'),
        variant: 'error',
      });
      return;
    }

    onSubmit(name, {
      playerCount,
      alienModulesEnabled: CORE_RANDOM_ALIEN_TYPES.map((alienType) =>
        selectedCoreAlienTypes.includes(alienType),
      ),
      undoAllowed,
      timerPerTurn,
    });
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
              defaultValue: 'New Mission Brief',
            })}
          </span>
          <DialogTitle>{t('client.create_room.title')}</DialogTitle>
          <DialogDescription>
            {t('client.create_room.subtitle', {
              defaultValue: 'Configure crew, rules, and tempo before launch.',
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
              <div className='space-y-1.5'>
                <Label htmlFor='player-count' variant='micro'>
                  {t('client.create_room.players')}
                </Label>
                <Select
                  value={String(playerCount)}
                  onValueChange={(value) => setPlayerCount(Number(value))}
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
            </SectionBlock>

            <SectionBlock
              title={t('client.create_room.section.rules', {
                defaultValue: 'Rules',
              })}
            >
              <div className='space-y-1.5'>
                <Label htmlFor='alien-pool' variant='micro'>
                  {t('client.create_room.alien_pool', {
                    defaultValue: 'Alien random pool',
                  })}
                </Label>
                <div id='alien-pool' className='space-y-2'>
                  {alienTypeOptions.map((option) => {
                    const isChecked = selectedAlienTypes.includes(
                      option.alienType,
                    );
                    const lockMinimumCount =
                      isChecked &&
                      selectedCoreCount <= 2 &&
                      CORE_RANDOM_ALIEN_TYPES.includes(option.alienType);
                    const isDisabled = option.disabled || lockMinimumCount;

                    return (
                      <div
                        key={option.alienType}
                        className='flex items-center justify-between'
                      >
                        <Label
                          htmlFor={`alien-type-${option.alienType}`}
                          className={cn(
                            'cursor-pointer',
                            isDisabled && 'cursor-not-allowed opacity-60',
                          )}
                        >
                          {t(`client.alien_board.types.${option.alienName}`, {
                            defaultValue: option.alienName,
                          })}
                          {option.disabled
                            ? t('client.create_room.alien_pool_disabled', {
                                defaultValue: ' (disabled)',
                              })
                            : ''}
                        </Label>
                        <Switch
                          id={`alien-type-${option.alienType}`}
                          checked={isChecked}
                          onCheckedChange={(next) =>
                            handleAlienTypeToggle(option.alienType, next)
                          }
                          disabled={isDisabled}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <ToggleRow
                id='undo-toggle'
                label={t('client.create_room.undo')}
                checked={undoAllowed}
                onChange={setUndoAllowed}
              />
            </SectionBlock>

            <SectionBlock
              title={t('client.create_room.section.tempo', {
                defaultValue: 'Tempo',
              })}
            >
              <div className='space-y-1.5'>
                <Label htmlFor='timer' variant='micro'>
                  {t('client.create_room.turn_timer')}
                </Label>
                <div className='flex items-center gap-2'>
                  <Input
                    id='timer'
                    type='number'
                    min={0}
                    max={600}
                    value={timerPerTurn}
                    mono
                    onChange={(e) => setTimerPerTurn(Number(e.target.value))}
                    className='max-w-[120px]'
                  />
                  <span className='font-mono text-[0.6875rem] uppercase tracking-microlabel text-text-500'>
                    {t('client.common.seconds_unit', { defaultValue: 'SEC' })}
                  </span>
                </div>
              </div>
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

function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className='space-y-4 px-6 py-5'>
      <h4 className={cn('micro-label text-text-500')}>{title}</h4>
      {children}
    </section>
  );
}

interface IToggleRowProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

function ToggleRow({
  id,
  label,
  checked,
  onChange,
}: IToggleRowProps): React.JSX.Element {
  return (
    <div className='flex items-center justify-between'>
      <Label htmlFor={id} className='cursor-pointer'>
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
