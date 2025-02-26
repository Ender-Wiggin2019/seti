/*
 * @Author: Ender-Wiggin
 * @Date: 2023-07-08 11:36:49
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-27 02:27:19
 * @Description:
 */
// CategoryFilter.tsx
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import React, { useEffect, useState } from 'react';

import TextButton from '@/components/buttons/TextButton';

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
  const [selectedCategories, setSelectedCategories] = useState<EAlienType[]>([]);

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
    <div className='flex justify-between gap-4'>
      {alienTypes.includes(EAlienType.ANOMALIES) && (
        <TextButton
          selected={selectedCategories.includes(EAlienType.ANOMALIES)}
          className='text-[#9cd2d9] hover:text-white/50 focus:text-white/50 bg-[#004c65]'
          selectClassName='ring-[#28b6af] text-[#9cd2d9] ring-2'
          onClick={() => handleCategoryChange(EAlienType.ANOMALIES)}
        >
          {t(EAlienMap[EAlienType.ANOMALIES])}
        </TextButton>
      )}
      {alienTypes.includes(EAlienType.CENTAURIANS) && (
        <div className='relative'>
          <TextButton
            selected={selectedCategories.includes(EAlienType.CENTAURIANS)}
          className='text-[#9cd2b2] hover:text-white/50 focus:text-white/50 bg-[#024d3f]'
          selectClassName='ring-[#00a16c] text-[#9cd2b2] ring-2'
            onClick={() => handleCategoryChange(EAlienType.CENTAURIANS)}
          >
          {t(EAlienMap[EAlienType.CENTAURIANS])}
          </TextButton>
        </div>
      )}
    </div>
  );
};
