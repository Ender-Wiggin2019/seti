import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import type { IGameOptions } from '@/api/types';
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
}: ICreateRoomDialogProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const [name, setName] = useState('');
  const [playerCount, setPlayerCount] = useState(2);
  const [alienModulesEnabled, setAlienModulesEnabled] = useState(false);
  const [undoAllowed, setUndoAllowed] = useState(true);
  const [turnTimerSeconds, setTurnTimerSeconds] = useState(0);

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
    onSubmit(name, {
      playerCount,
      alienModulesEnabled,
      undoAllowed,
      turnTimerSeconds,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid='create-room-dialog' className='max-w-lg p-0'>
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
              <ToggleRow
                id='aliens-toggle'
                label={t('client.create_room.alien_modules')}
                checked={alienModulesEnabled}
                onChange={setAlienModulesEnabled}
              />
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
                    value={turnTimerSeconds}
                    mono
                    onChange={(e) =>
                      setTurnTimerSeconds(Number(e.target.value))
                    }
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
