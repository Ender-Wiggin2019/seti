import { useTranslation } from 'next-i18next';
import React from 'react';

import BaseCardWrapper from '@/components/wrapper/AnimalWrapper';

import BaseCardType from '@/types/BaseCard';

interface BaseCardProps {
  card: BaseCardType;
}

export const BaseCard: React.FC<BaseCardProps> = ({ card }) => {
  const { t } = useTranslation('common');

  const { src, row, col } = card.position || { src: '', row: 0, col: 0 };
  const cols = 10;

  return (
    <BaseCardWrapper id={card.id}>
      <div
        className='card-cell'
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: `${cols * 100}% auto`,
          // backgroundPosition: `${-col * 10}% ${-row * 14.2857}%`,
          backgroundPosition: `-${150 * col}px -${209 * row}px`,
          width: '150px', // Adjust size as needed
          height: '209px', // Adjust size as needed
        }}
      ></div>
    </BaseCardWrapper>
  );
};
