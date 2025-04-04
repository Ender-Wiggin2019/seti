/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-26 23:56:31
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-04 18:31:14
 * @Description:
 */
import { useTranslation } from 'next-i18next';
import React, { useMemo } from 'react';

import { CardIncome } from '@/components/card/CardIncome';
import { CardMiddleBar } from '@/components/card/CardMiddleBar';
import { FlavorText } from '@/components/cards/base_cards/FlavorText';
import { EffectFactory } from '@/components/effect/Effect';
import { EffectContainer } from '@/components/effect/EffectContainer';
import CardRenderWrapper from '@/components/wrapper/AnimalWrapper';

import { ESectorColorMap } from '@/constant/color';
import { freeAction2Effect } from '@/utils/effect';

import { EAlienMap, IBaseCard } from '@/types/BaseCard';
import { ESector } from '@/types/element';

interface CardRenderProps {
  card: IBaseCard;
}

export const CardRender: React.FC<CardRenderProps> = ({ card }) => {
  const { t } = useTranslation('seti');

  const { src, row, col } = card.position || { src: '', row: 0, col: 0 };
  const cols = card.alien ? 5 : 10;
  const alienCls = card.alien ? EAlienMap[card.alien] : '';
  const titleHeight = card?.special?.titleHeight || 95;
  const freeActionEffects = useMemo(() => {
    if (!card.freeAction) return [];
    return card.freeAction.map((a) => freeAction2Effect(a));
  }, [card.freeAction]);

  const effects = useMemo(() => {
    return card.effects || [];
  }, [card]);
  const style = useMemo(() => {
    if (card.image) {
      return {
        backgroundImage: `url(${card.image})`,
        width: '150px',
        height: 'auto',
        minHeight: '96px',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        // borderRadius: '12px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        zIndex: -1,
      };
    } else {
      return {
        backgroundImage: `url(${src})`,
        backgroundSize: `${cols * 100}% auto`,
        backgroundPosition: `-${150 * col}px ${209 * row * -1 + 1}px`,
        width: '150px',
        height: '209px',
        borderRadius: '12px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        zIndex: -1, // 确保背景图片的z-index较低
        scale: '1.01',
      };
    }
  }, [card.image, col, cols, row, src]);

  const renderFreeAction = () => (
    <div className='card-free-action'>
      {freeActionEffects.map((e) => (
        <EffectFactory key={e.type} effect={e} />
      ))}
    </div>
  );

  const renderSector = () => (
    <>
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
    </>
  );

  const renderImage = () =>
    card.image ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={card.image || src} alt={card.name} style={style} />
    ) : (
      <div style={style}></div>
    );

  return (
    <CardRenderWrapper id={card.id}>
      {renderFreeAction()}
      {renderSector()}
      {renderImage()}
      <div className='card-cell card-render'>
        {card.income && <CardIncome income={card.income} />}
      </div>
      <div
        className='card-render-container'
        style={{ top: titleHeight + 'px' }}
      >
        <CardMiddleBar card={card} />

        {card?.special?.enableEffectRender && card.effects && (
          <EffectContainer effects={effects} className='' /> // 确保EffectContainer的z-index较高
        )}
      </div>
      <div className='card-no-bg'></div>
      <div className='card-no'>{card.id}</div>
      {card?.special?.enableEffectRender && card.flavorText && (
        <FlavorText
          id={card.id}
          flavorText={card.flavorText}
          className='bg-transparent'
        />
      )}
      {/* {card?.special?.fanMade && (
        <div className='card-watermark'>{t('watermark')}</div>
      )} */}
    </CardRenderWrapper>
  );
};
