/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-26 23:56:31
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2026-03-24 12:34:40
 * @Description:
 */

import { ESectorColorMap } from '@seti/common/constant/color';
import { IBaseCard } from '@seti/common/types/BaseCard';
import { ESector } from '@seti/common/types/element';
import { freeAction2Effect } from '@seti/common/utils/effect';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CardRenderContextProvider,
  useCardRenderContext,
} from './components/CardContext';
import { CardIncome } from '@/components/card/CardIncome';
import { CardMiddleBar } from '@/components/card/CardMiddleBar';
import { FlavorText } from '@/components/cards/base_cards/FlavorText';
import { EffectFactory } from '@/components/effect/Effect';
import { EffectContainer } from '@/components/effect/EffectContainer';
import CardRenderWrapper from '@/components/wrapper/AnimalWrapper';

interface CardRenderProps {
  card: IBaseCard;
}

export const CardRender: React.FC<CardRenderProps> = ({ card }) => {
  const { t } = useTranslation('seti');

  const { src, row, col } = card.position || { src: '', row: 0, col: 0 };
  const cols = card.alien ? 5 : 10;
  const titleHeight = card?.special?.titleHeight || 95;
  const effectContainerHeight = 95 - titleHeight + 94;
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

  // Inject the cardId into render context so sub-renderers (Mission,
  // EffectContainer) can look up runtime state — branch claims, etc. —
  // keyed by cardId without needing the consumer to pass it manually.
  const parentContext = useCardRenderContext();
  const childContext = useMemo(
    () => ({ ...(parentContext ?? {}), cardId: card.id }),
    [parentContext, card.id],
  );

  return (
    <CardRenderContextProvider value={childContext}>
      <CardRenderWrapper id={card.id}>
        {renderFreeAction()}
        {renderSector()}
        {renderImage()}
        {/*
          The .card-render overlay paints the generic card-template
          (transparent at the top, opaque white over the bottom ~16%
          where React renders effects + flavor). Cards that don't
          enable the React effect/flavor pipeline (e.g. Centaurians)
          have those zones baked into the sprite itself, so the
          opaque white band would clip the printed art. Skip the
          overlay in that case; the income chip floats freely on
          top of the sprite at the existing z-index.
        */}
        {card?.special?.enableEffectRender ? (
          <div className='card-cell card-render'>
            {card.income && <CardIncome income={card.income} />}
          </div>
        ) : card.income ? (
          <div
            className='card-cell'
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <CardIncome income={card.income} />
          </div>
        ) : null}
        <div
          className='card-render-container'
          style={{ top: titleHeight + 'px' }}
        >
          <CardMiddleBar card={card} />

          {card?.special?.enableEffectRender && card.effects && (
            <EffectContainer
              effects={effects}
              className=''
              height={effectContainerHeight}
            />
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
        {/*
          enableFlavorText (without enableEffectRender) — Centaurian-
          style cards whose sprite bakes English flavor + padding into
          the bottom 32px. Paint an opaque white panel over that
          strip and render the React-translated flavor inside, so
          locale switches affect the flavor text without touching
          the sprite asset. 32px was measured against all 10
          Centaurian sprites — none have effect content in that band.
        */}
        {card?.special?.enableFlavorText &&
          !card?.special?.enableEffectRender &&
          card.flavorText && (
            <BakedFlavorMask flavorTextKey={card.flavorText} />
          )}
        {card?.special?.watermark && (
          <div className='card-copyright'>{t('watermark')}</div>
        )}
      </CardRenderWrapper>
    </CardRenderContextProvider>
  );
};

/**
 * Bottom-strip mask used by Centaurian-style cards whose printed
 * sprite bakes English flavor + padding into the bottom ~32px. The
 * mask paints an opaque white rectangle over that strip and renders
 * the React-translated flavor inside — keeps the rest of the printed
 * sprite (effect icons, art, title) untouched while making the flavor
 * locale-aware.
 *
 * 32px was measured against all 10 Centaurian sprites:
 *   - 8 cards: baked flavor strip = bottom 32px
 *   - 2 cards (ET.34, ET.37): baked flavor strip = bottom 21px,
 *     remaining 11px is empty green padding (no effect content),
 *     so 32px is safe to use everywhere.
 */
function BakedFlavorMask({
  flavorTextKey,
}: {
  flavorTextKey: string;
}): React.JSX.Element {
  const { t } = useTranslation(['flavorText']);
  // z-index 4 sits above the sprite (z-index: -1) but below the
  // .card-no label (z-index: 5) so the printed ET.NN identifier
  // stays visible in the bottom-left corner.
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '32px',
        backgroundColor: 'white',
        borderBottomLeftRadius: '12px',
        borderBottomRightRadius: '12px',
        padding: '4px 8px',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        zIndex: 4,
      }}
    >
      <span
        style={{
          color: 'black',
          fontSize: '4px',
          lineHeight: '5px',
          fontStyle: 'italic',
          width: '120px',
        }}
      >
        {t(flavorTextKey)}
      </span>
    </div>
  );
}
