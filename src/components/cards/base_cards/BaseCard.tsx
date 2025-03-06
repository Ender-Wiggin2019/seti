/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-26 23:56:31
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-06 00:48:44
 * @Description:
 */
import { useTranslation } from 'next-i18next';
import React from 'react';

import BaseCardWrapper from '@/components/wrapper/AnimalWrapper';

import BaseCardType, { EAlienMap } from '@/types/BaseCard';
import { EffectFactory } from '@/components/effect/Effect';

interface BaseCardProps {
  card: BaseCardType;
}

export const BaseCard: React.FC<BaseCardProps> = ({ card }) => {
  const { t } = useTranslation('seti');

  const { src, row, col } = card.position || { src: '', row: 0, col: 0 };
  const cols = card.alien ? 5 : 10;
  const alienCls = card.alien ? EAlienMap[card.alien] : '';
  return (
    <BaseCardWrapper id={card.id}>
      <div className={`card-title ${alienCls}`}>{t(card.name)}</div>
      <div
        className='card-cell'
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: `${cols * 100}% auto`,
          // backgroundPosition: `${-col * 10}% ${-row * 14.2857}%`,
          backgroundPosition: `-${150 * col}px -${209 * row}px`,
          width: '150px', // Adjust size as needed
          height: '209px', // Adjust size as needed
          borderRadius: '12px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        }}
      ></div>
      {/* {card.effects && (
        <div className='card-effects-container'>
          <div className='card-effects'>
            {card.effects.map((effect, index) => (
              <EffectFactory key={index} effect={effect} />
            ))}
          </div>
        </div>
      )} */}
      {/* {card.flavorText && (
        <FlavorText id={card.id} flavorText={card.flavorText} />
      )} */}
    </BaseCardWrapper>
  );
};
