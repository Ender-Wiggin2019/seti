'use client';
/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-03 11:32:58
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-29 01:49:32
 * @Description:
 */
import { Rocket } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';

import { useSettings } from '@/hooks/useSettings';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Button } from './button';

import { ISettings } from '@/types/settings';

type Props = {
  onSubmit: (settings: ISettings) => void;
};

export function SettingsDialogButton({ onSubmit }: Props) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);

  const { updateSettings, handleSubmit: _handleSubmit } = useSettings(onSubmit);

  const handleSubmit = () => {
    // updateSettings({enableAlien: true});
    setOpen(false);
    _handleSubmit({ enableAlien: true });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='lg' className='text-white'>
          <Rocket size={20} />
          {t('Aliens?')}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md bg-zinc-900 text-white'>
        <DialogHeader>
          <DialogTitle>{t('dialog.warning')}</DialogTitle>
          <DialogDescription className='text-zinc-300'>
            {t('dialog.warning-desc')}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className='sm:justify-start'>
          <Button
            variant='default'
            type='submit'
            className=''
            onClick={handleSubmit}
          >
            {t('dialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
