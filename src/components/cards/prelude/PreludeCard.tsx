/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-28 09:48:41
 * @LastEditors: Ender Wiggin
 * @LastEditTime: 2025-11-05 02:36:25
 * @Description: Prelude Card Component
 */
import { useTranslation } from 'next-i18next';
import React from 'react';

import { CardIncome } from '@/components/card/CardIncome';
import { EffectFactory } from '@/components/effect/Effect';
import BaseCardWrapper from '@/components/wrapper/AnimalWrapper';

import { IPreludeCard } from '@/types/prelude';

interface PreludeCardProps {
  card: IPreludeCard;
}

export const PreludeCard: React.FC<PreludeCardProps> = ({ card }) => {
  const { t } = useTranslation('seti');

  return (
    <BaseCardWrapper id={card.id}>
      {/* Card Background */}
      <div
        className='card-cell card-render'
        style={{
          backgroundImage: "url('/images/prelude-back.jpg')",
          backgroundSize: 'cover',
        }}
      >
        {card.income && <CardIncome income={card.income} />}
      </div>

      {/* Card Content Container */}
      <div className='card-render-container prelude-card-container absolute top-0 left-0 w-[150px] h-[209px] z-10'>
        {/* Upper Section - Effects */}
        {card.upperEffects &&
          Array.isArray(card.upperEffects) &&
          card.upperEffects.length > 0 && (
            <div className='absolute top-[10px] left-0 w-[150px] z-10'>
              <div className='card-effects-container prelude-upper-effects bg-transparent absolute top-0 left-0 w-[150px] h-[94px]'>
                <div className='card-effects'>
                  {card.upperEffects.map((effect, index) => (
                    <EffectFactory key={index} effect={effect} />
                  ))}
                </div>
              </div>
            </div>
          )}

        {/* Upper Section - Text */}
        {card.upperText && (
          <div className='absolute top-2 left-1/2 -translate-x-1/2'>
            <div className='text-desc-xs bg-black/80 rounded px-2 py-1 text-center w-32 whitespace-pre-line'>
              {t(card.upperText)}
            </div>
          </div>
        )}

        {/* Middle Section */}
        {card.middleText && (
          <div className='prelude-card-section prelude-card-middle absolute top-[90px] left-1/2 -translate-x-1/2 -translate-y-1/2'>
            <div className='prelude-card-text prelude-middle-text text-desc-xs bg-black/80 rounded px-2 py-1 text-center w-24 whitespace-pre-line'>
              {t(card.middleText)}
            </div>
          </div>
        )}

        {/* Lower Section - Effects */}
        {card.lowerEffects &&
          Array.isArray(card.lowerEffects) &&
          card.lowerEffects.length > 0 && (
            <div className='absolute top-24 left-0 w-[150px] z-10'>
              <div className='card-effects-container prelude-lower-effects bg-transparent absolute bottom-0 left-0 w-[150px] h-[94px]'>
                <div className='card-effects'>
                  {card.lowerEffects.map((effect, index) => (
                    <EffectFactory key={index} effect={effect} />
                  ))}
                </div>
              </div>
            </div>
          )}

        {/* Lower Section - Text */}
        {card.lowerText && (
          <div className='prelude-card-section prelude-card-lower-text absolute bottom-[10px] left-0 w-[150px]'>
            <div className='prelude-card-text prelude-lower-text text-desc-xs whitespace-pre-line'>
              {t(card.lowerText)}
            </div>
          </div>
        )}
      </div>

      <div className='card-no-bg'></div>
      <div className='card-no'>{card.id}</div>
      {card.watermark && (
        <div className='card-copyright z-10 opacity-50'>{t('watermark')}</div>
      )}
    </BaseCardWrapper>
  );
};
