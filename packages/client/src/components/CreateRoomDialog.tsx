import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import type { IGameOptions } from '@/api/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
      <DialogContent data-testid='create-room-dialog'>
        <DialogHeader>
          <DialogTitle>{t('client.create_room.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='room-name'>{t('client.create_room.name')}</Label>
            <Input
              id='room-name'
              placeholder={t('client.create_room.name_placeholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='player-count'>
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

          <div className='flex items-center justify-between'>
            <Label htmlFor='aliens-toggle'>
              {t('client.create_room.alien_modules')}
            </Label>
            <Switch
              id='aliens-toggle'
              checked={alienModulesEnabled}
              onCheckedChange={setAlienModulesEnabled}
            />
          </div>

          <div className='flex items-center justify-between'>
            <Label htmlFor='undo-toggle'>{t('client.create_room.undo')}</Label>
            <Switch
              id='undo-toggle'
              checked={undoAllowed}
              onCheckedChange={setUndoAllowed}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='timer'>{t('client.create_room.turn_timer')}</Label>
            <Input
              id='timer'
              type='number'
              min={0}
              max={600}
              value={turnTimerSeconds}
              onChange={(e) => setTurnTimerSeconds(Number(e.target.value))}
            />
          </div>

          <DialogFooter>
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
