'use client';
import { ExternalLink } from 'lucide-react';
/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-03 11:32:58
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-05-18 20:59:52
 * @Description:
 */
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { RiQuestionFill } from 'react-icons/ri';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { EffectTable } from '@/components/ui/effect-table';
import { ISettings } from '@/types/settings';

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
      <DialogContent className='sm:max-w-md bg-zinc-900 h-[500px] text-white overflow-y-scroll'>
        <Link href='/posts/diy' className='flex gap-2' target='_blank'>
          {t('Go to Full Page')}
          <ExternalLink />
        </Link>
        <EffectTable onCopy={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
