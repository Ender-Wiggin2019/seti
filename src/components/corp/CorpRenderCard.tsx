/*
 * @Author: Ender-Wiggin
 * @Date: 2025-07-02 11:14:59
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-07-02 11:28:55
 * @Description:
 */
import React from 'react';

import { CorpEffect } from './CorpEffect';
import { CorpIncome } from './CorpIncome';
import { CorpTitle } from './CorpTitle';

import { ICorp } from '@/types/corp';
import { IBaseEffect } from '@/types/effect';
import { EResource } from '@/types/element';

// 你可以根据实际图片路径调整
const DEFAULT_BG = '/images/cards/card-template.png';

type Props = {
  corp: ICorp;
  bgUrl?: string;
  style?: React.CSSProperties;
};

export const CorpRenderCard: React.FC<Props> = ({
  corp,
  bgUrl = DEFAULT_BG,
  style,
}) => {
  return (
    <div
      className='corp-render-card'
      style={{
        width: 1530,
        height: 1104,
        borderRadius: 48,
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* 左上角 CorpTitle */}
      <div style={{ position: 'absolute', top: 48, left: 48, width: 704 }}>
        <CorpTitle title={corp.name} color={corp.color?.title || '#fff'} />
      </div>
      {/* CorpTitle 下方 CorpEffect（主效果） */}
      {corp.effects && corp.effects.length > 0 && (
        <div style={{ position: 'absolute', top: 240, left: 48, width: 600 }}>
          <CorpEffect
            color={corp.color?.title || '#fff'}
            effects={corp.effects}
          />
        </div>
      )}
      {/* 左下角 CorpEffect（可选：freeAction） */}
      {corp.freeAction && corp.freeAction.length > 0 && (
        <div style={{ position: 'absolute', left: 48, bottom: 48, width: 600 }}>
          <CorpEffect
            color={corp.color?.title || '#fff'}
            effects={corp.freeAction}
          />
        </div>
      )}
      {/* 右下角 CorpIncome */}
      {corp.income && corp.income.length > 0 && (
        <div className='absolute right-12 bottom-12 w-[300px] h-[200px] flex flex-col justify-end'>
          {corp.income.map((income, idx) => (
            <CorpIncome
              key={idx}
              income={(income as IBaseEffect)?.type as EResource}
            />
          ))}
        </div>
      )}
    </div>
  );
};
