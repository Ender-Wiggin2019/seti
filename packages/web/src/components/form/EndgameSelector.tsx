/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-12 12:22:14
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-05-18 21:17:06
 * @Description:
 */

import { DESC } from '@seti/common/constant/effect';
import { ICustomizedEffect } from '@seti/common/types/effect';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';
import { DescInput } from '@/components/form/DescInput';

type Props = {
  desc: string | null;
  onChange?: (desc: string) => void;
};
export const EndgameSelector = ({ desc, onChange }: Props) => {
  const { t } = useTranslation('common');

  const handleChange = (effect: ICustomizedEffect) => {
    onChange?.(effect?.desc);
  };

  const endgameEffect = useMemo(() => {
    const res: ICustomizedEffect = {
      ...DESC(desc || ''),
      id: 'endgame',
    };

    return [res];
  }, [desc]);
  return (
    <div className='items-start justify-start space-x-2 rounded-md bg-gradient-to-b px-4 py-2 text-sm font-medium shadow-lg shadow-zinc-800/5 ring-1 backdrop-blur-md focus:outline-none from-zinc-900/30 to-zinc-800/80 text-zinc-200 ring-white/10 hover:ring-white/20 flex flex-col 2'>
      <div className='text-lg text-white font-semibold'>{t('Endgame')}</div>
      <DescInput
        currentEffects={endgameEffect}
        onChange={handleChange}
        enableCreateNew={false}
      />
    </div>
  );
};
