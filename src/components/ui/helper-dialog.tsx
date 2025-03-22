'use client';
/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-03 11:32:58
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-22 15:59:48
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
import { EffectTable } from '@/components/ui/effect-table';
import { BiQuestionMark } from 'react-icons/bi';
import { RiQuestionFill } from 'react-icons/ri';
import Link from 'next/link';

type Props = {
  onSubmit?: (settings: ISettings) => void;
};

export function HelpButton({ onSubmit }: Props) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className='text-white/80 flex items-center gap-2 underline'>
          <RiQuestionFill size={20} />
          {t('helper.howto')}
        </div>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md bg-zinc-900 h-[300px] text-white overflow-y-scroll'>
        <Link href='/helper' target='_blank'>
          {t('Go to Full Page')}
        </Link>
        <EffectTable />
      </DialogContent>
    </Dialog>
  );
}
