/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-26 23:56:31
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-18 00:05:38
 * @Description:
 */
import { useTranslation } from 'next-i18next';
import React, { useMemo } from 'react';

import { CardIncome } from '@/components/card/CardIncome';
import { FlavorText } from '@/components/cards/base_cards/FlavorText';
import { EffectFactory } from '@/components/effect/Effect';
import { EffectContainer } from '@/components/effect/EffectContainer';
import CardRenderWrapper from '@/components/wrapper/AnimalWrapper';

import { ESectorColorMap } from '@/constant/color';
import { freeAction2Effect } from '@/utils/effect';

import CardRenderType, { EAlienMap } from '@/types/BaseCard';
import { ESector } from '@/types/element';

interface CardRenderProps {
  card: CardRenderType;
}

export const CardRender: React.FC<CardRenderProps> = ({ card }) => {
  const { t } = useTranslation('seti');

  const { src, row, col } = card.position || { src: '', row: 0, col: 0 };
  const cols = card.alien ? 5 : 10;
  const alienCls = card.alien ? EAlienMap[card.alien] : '';

  const freeActionEffects = useMemo(() => {
    if (!card.freeAction) return [];
    return card.freeAction.map((a) => freeAction2Effect(a));
  }, [card.freeAction]);

  return (
    <CardRenderWrapper id={card.id}>
      <div className='card-free-action'>
        {freeActionEffects.map((e) => (
          <EffectFactory key={e.type} effect={e} />
        ))}
        {/* <EffectContainer effects={freeActionEffects} /> */}
      </div>
      <div
        className='card-sector-corner-background'
        style={{
          borderRight: `30px solid ${
            ESectorColorMap[card.sector || ESector.RED]
          }`,
        }}
      ></div>
      <div className='card-sector-corner-signal'>
        <div className={`seti-icon icon-${card.sector}-corner`}></div>
      </div>
      <div
        className=''
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: `${cols * 100}% auto`,
          backgroundPosition: `-${150 * col}px ${209 * row * -1 + 1}px`,
          width: '150px',
          height: '209px',
          borderRadius: '12px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          zIndex: -1, // 确保背景图片的z-index较低
          scale: '1.01',
        }}
      >
        <div className='card-cell card-render'>
          {card.income && <CardIncome income={card.income} />}
        </div>
      </div>
      <div className={`card-render-title ${alienCls}`}>{t(card.name)}</div>
      <div className='card-render-credit'>{card.price}</div>

      {card?.special?.enableEffectRender && card.effects && (
        <EffectContainer effects={card.effects} className='bg-transparent' /> // 确保EffectContainer的z-index较高
      )}
      {card?.special?.enableEffectRender && card.flavorText && (
        <FlavorText
          id={card.id}
          flavorText={card.flavorText}
          className='bg-transparent'
        />
      )}
    </CardRenderWrapper>
  );
};
