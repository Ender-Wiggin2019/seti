import { useState } from 'react';
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
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';

interface ICreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, options: IGameOptions) => void;
  isPending: boolean;
}

const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(50),
  playerCount: z.number().min(2).max(4),
});

export function CreateRoomDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: ICreateRoomDialogProps): React.JSX.Element {
  const [name, setName] = useState('');
  const [playerCount, setPlayerCount] = useState(2);
  const [alienModulesEnabled, setAlienModulesEnabled] = useState(false);
  const [undoAllowed, setUndoAllowed] = useState(true);
  const [turnTimerSeconds, setTurnTimerSeconds] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = createRoomSchema.safeParse({ name, playerCount });
    if (!result.success) {
      toast({ title: result.error.issues[0].message, variant: 'error' });
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Mission</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='room-name'>Mission Name</Label>
            <Input
              id='room-name'
              placeholder='Mars Alpha-7'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='player-count'>Operatives</Label>
            <Select
              id='player-count'
              value={String(playerCount)}
              onChange={(e) => setPlayerCount(Number(e.target.value))}
            >
              <option value='2'>2 Players</option>
              <option value='3'>3 Players</option>
              <option value='4'>4 Players</option>
            </Select>
          </div>

          <div className='flex items-center justify-between'>
            <Label htmlFor='aliens-toggle'>Alien Modules</Label>
            <Switch
              id='aliens-toggle'
              checked={alienModulesEnabled}
              onCheckedChange={setAlienModulesEnabled}
            />
          </div>

          <div className='flex items-center justify-between'>
            <Label htmlFor='undo-toggle'>Allow Undo</Label>
            <Switch
              id='undo-toggle'
              checked={undoAllowed}
              onCheckedChange={setUndoAllowed}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='timer'>Turn Timer (seconds, 0 = off)</Label>
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
              Cancel
            </Button>
            <Button type='submit' disabled={isPending}>
              {isPending ? 'Launching...' : 'Launch Mission'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
