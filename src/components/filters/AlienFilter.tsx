import { useTranslation } from 'next-i18next';
import React, { useEffect, useState } from 'react';
import TextButton from '@/components/buttons/TextButton';
import { ALIEN_BUTTON_GROUP } from '@/constant/alien';
import { cn } from '@/lib/utils';

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
  const { t } = useTranslation('seti');
  const [selectedCategories, setSelectedCategories] = useState<EAlienType[]>(
    [],
  );

  const handleCategoryChange = (cardType: EAlienType) => {
    setSelectedCategories((prev: EAlienType[]) =>
      prev.includes(cardType)
        ? prev.filter((t) => t !== cardType)
        : [...prev, cardType],
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
              className={cn(
                `${alien.text} hover:text-white/50 focus:text-white/50 bg-transparent ${alien.bg} ${alien.hover} rounded-sm`,
              )}
              selectClassName={`${alien.ring} ${alien.text} hover:${alien.ring} active:${alien.ring} ring-2`}
              onClick={() => handleCategoryChange(alien.type)}
            >
              {t(EAlienMap[alien.type])}
            </TextButton>
            {alien.beta && (
              <div className='absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold shadow-sm'>
                BETA
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
