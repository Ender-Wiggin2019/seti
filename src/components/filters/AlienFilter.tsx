/*
 * @Author: Ender-Wiggin
 * @Date: 2023-07-08 11:36:49
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-01 02:01:48
 * @Description:
 */
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import React, { useEffect, useState } from 'react';

import TextButton from '@/components/buttons/TextButton';

import { ALIEN_BUTTON_GROUP } from '@/constant/alien';

import { EAlienMap, EAlienType } from '@/types/BaseCard';

type AlienFilterProps = {
  alienTypes: EAlienType[];
  onFilterChange: (tags: EAlienType[]) => void;
  reset: boolean;
};

export const AlienFilter: React.FC<AlienFilterProps> = ({
  alienTypes,
  onFilterChange,
  reset,
}) => {
  const router = useRouter();
  const { t } = useTranslation('seti');
  const [selectedCategories, setSelectedCategories] = useState<EAlienType[]>(
    []
  );

  const handleCategoryChange = (cardType: EAlienType) => {
    setSelectedCategories((prev: EAlienType[]) =>
      prev.includes(cardType)
        ? prev.filter((t) => t !== cardType)
        : [...prev, cardType]
    );
  };

  useEffect(() => {
    onFilterChange(selectedCategories);
  }, [selectedCategories, onFilterChange]);

  useEffect(() => {
    if (reset) {
      setSelectedCategories([]);
    }
  }, [reset]);

  return (
    <div className='flex flex-wrap justify-between gap-4'>
      {ALIEN_BUTTON_GROUP.map((alien) => {
        if (!alienTypes.includes(alien.type)) {
          return null;
        }
        return (
          <div key={alien.type} className='relative'>
            <TextButton
              key={alien.type}
              selected={selectedCategories.includes(alien.type)}
              className={`${alien.text} hover:text-white/50 focus:text-white/50 bg-none ${alien.bg} rounded-sm`}
              selectClassName={`${alien.ring} ${alien.text} hover:${alien.ring} active:${alien.ring} ring-2`}
              onClick={() => handleCategoryChange(alien.type)}
            >
              {t(EAlienMap[alien.type])}
            </TextButton>
          </div>
        );
      })}
    </div>
  );
};
