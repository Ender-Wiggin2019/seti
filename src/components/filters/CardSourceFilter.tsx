/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-15 14:20:13
 * @LastEditors: Ender Wiggin
 * @LastEditTime: 2025-10-30 02:04:11
 * @Description: CardSourceFilter component for filtering cards by source
 */
import { useTranslation } from 'next-i18next';
import React, { useState } from 'react';

import TextButton from '@/components/buttons/TextButton';

import { CardSource } from '@/types/CardSource';

type CardSourceFilterProps = {
  onFilterChange: (sources: CardSource[]) => void;
  reset: boolean;
};

export const CardSourceFilter: React.FC<CardSourceFilterProps> = ({
  onFilterChange,
  reset,
}) => {
  const { t } = useTranslation('common');
  const [selectedCardSources, setSelectedCardSources] = useState<CardSource[]>(
    [],
  );

  const toggleCardSource = (cardSource: CardSource) => {
    setSelectedCardSources((prev) =>
      prev.includes(cardSource)
        ? prev.filter((t) => t !== cardSource)
        : [...prev, cardSource],
    );
  };

  React.useEffect(() => {
    if (reset) {
      setSelectedCardSources([]);
    }
  }, [reset]);

  React.useEffect(() => {
    onFilterChange(selectedCardSources);
  }, [onFilterChange, selectedCardSources]);

  return (
    <>
      <div className='flex flex-wrap gap-2 lg:gap-3'>
        {Object.values(CardSource).map((cardSource) => (
          <div key={cardSource} className='relative'>
            <TextButton
              selected={selectedCardSources.includes(cardSource)}
              variant={
                selectedCardSources.includes(cardSource) ? 'primary' : 'basic'
              }
              onClick={() => toggleCardSource(cardSource)}
              className='w-28 py-1.5 px-1'
            >
              {t(cardSource)}
            </TextButton>
            {cardSource === CardSource.SPACE_AGENCY && (
              <div className='absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold shadow-sm'>
                BETA
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};
