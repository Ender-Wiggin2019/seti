'use client';
/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-03 11:32:58
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-08 01:10:00
 * @Description:
 */
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
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

type Props = {
  onSubmit: () => void;
};

export function ExportDialogButton({ onSubmit }: Props) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    setOpen(false);
    onSubmit();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='default' className='w-20'>
          {t('Export')}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md bg-zinc-900 text-white'>
        <DialogHeader>
          <DialogTitle>{t('dialog.export')}</DialogTitle>
          <DialogDescription className='text-zinc-300'>
            {t('dialog.export-desc')}
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
