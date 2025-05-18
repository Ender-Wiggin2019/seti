/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-12 12:22:14
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-05-18 21:17:06
 * @Description:
 */

import { useTranslation } from 'next-i18next';
import React, { useMemo, useState } from 'react';

import { EffectsGenerator } from '@/components/form/EffectsGenerator';

import { DESC, m } from '@/constant/effect';

import {
  EEffectType,
  Effect,
  IBaseEffect,
  ICustomizedEffect,
  IEndGameEffect,
  IMissionEffect,
} from '@/types/effect';
import { DescInput } from '@/components/form/DescInput';

type Props = {
  desc: string | null;
  onChange?: (desc: string) => void;
};
export const EndgameSelector = ({ desc, onChange }: Props) => {
  const { t } = useTranslation('common');
  // const [req, setReq] = useState(endgameEffect?.desc);

  const handleChange = (effect: ICustomizedEffect) => {
    // setReq(effect?.desc);
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
