import { cn } from '@/lib/utils';

import { PreviewBaseCard } from '@/components/cards/base_cards/PreviewBaseCard';
import { EffectFactory } from '@/components/effect/Effect';
import withDownloadableImage from '@/components/replay-card/withDownloadableImage';
import { Separator } from '@/components/ui/separator';

import { e } from '@/constant/effect';
import { IReplayItem } from '@/constant/replay';
import { getCardById } from '@/utils/card';
import { getResourceCount } from '@/utils/action';
import { Effect, IBaseEffect } from '@/types/effect';
import { freeAction2Effect } from '@/utils/effect';

/*
 * @Author: Ender-Wiggin
 * @Date: 2025-05-22 00:38:49
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-05-22 18:01:39
 * @Description:
 */
export const ReplayItem = ({
  round,
  turn,
  desc,
  resources,
  spend,
  gain,
  income,
  card,
  freeActionCards,
}: IReplayItem) => {
  const cards = resources?.card;

  const renderResource = (resource: any, type: 'gain' | 'spend') => {
    if (!resource) return null;
    const value = getResourceCount(resource);
    if (value <= 0) {
      return <></>;
    }
    const cls =
      value <= 0 ? '' : type === 'gain' ? 'text-green-500' : 'text-red-500';
    const prefix = type === 'gain' && value > 0 ? '+' : '-';
    return (
      <div className={cls}>
        {prefix}
        {value}
      </div>
    );
  };

  const renderFreeAction = (freeActionEffects: IBaseEffect[]) => (
    <div className='card-free-action'>
      {freeActionEffects.map((e) => (
        <EffectFactory key={e.type} effect={e} />
      ))}
    </div>
  );

  const allCards = resources?.card || [];
  const spendCardIds = spend?.card;
  const gainCardIds: string[] = gain?.card || [];
  if (freeActionCards) console.log('🎸 [test] - ReplayItem', freeActionCards);
  return (
    <div
      className={cn(
        'source-code-pro w-96 relative rounded shadow-md bg-white p-2 m-2 text-zinc-900',
        { 'w-full': cards?.length > 0 }
      )}
    >
      {/* {card && getCardById(card) && (
        <div className='absolute bottom-0 left-0 scale-90'>
          <PreviewBaseCard card={getCardById(card)!} />
        </div>
      )} */}
      {allCards && (
        <div className='absolute bottom-0 -left-4 scale-50 flex gap-2 justify-start w-80'>
          {allCards.map((card) => (
            <div
              key={getCardById(card)?.id}
              className={cn(
                {
                  'scale-125 ring-4 rounded-md ring-red-700 ring-offset-4 mx-10':
                    spendCardIds?.includes(card),
                },
                { '': freeActionCards?.includes(card) }
              )}
            >
              {freeActionCards?.includes(card) && (
                <div className='absolute top-10 -left-2 z-50 scale-[5] shadow-lg'>
                  {renderFreeAction(
                    getCardById(card)?.freeAction?.map((a) =>
                      freeAction2Effect(a)
                    )
                  )}
                </div>
              )}
              <PreviewBaseCard card={getCardById(card)} />
            </div>
          ))}
          {gainCardIds.length > 0 && (
            <div className='flex gap-2 items-center'>
              <div className='text-5xl text-lime-500'>+</div>
              {gainCardIds.map((card) => (
                <div
                  key={getCardById(card)?.id}
                  className={
                    'ring-4 rounded-md ring-lime-500 ring-offset-4 ml-6'
                  }
                >
                  <PreviewBaseCard card={getCardById(card)} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className='text-xl font-bold flex justify-between items-center'>
        第 {round} 大轮
        {['score'].map((type) => (
          <div
            key={type}
            className='flex font-bold text-4xl justify-end items-center gap-2'
          >
            <EffectFactory
              effect={e[type.toUpperCase() as keyof typeof e](
                resources?.[type],
                '',
                'md'
              )}
            />
            {gain?.[type] && renderResource(gain?.[type], 'gain')}
          </div>
        ))}
      </div>
      <div className='text-md text-gray-500 font-bold'>第 {turn} 动</div>
      <Separator className='my-2' />
      <div className='text-2xl'>{desc}</div>
      <Separator className='my-2' />

      {['credit', 'energy', 'card', 'publicity', 'data'].map((type) => {
        if (resources?.[type] === undefined) return null;
        return (
          <div
            key={type}
            className='flex font-bold text-4xl justify-end items-center gap-2'
          >
            <div className='w-40 flex justify-start'>
              {/* {gain?.income === type && (
                <>
                  <div className='text-green-500'>+ 1</div>
                  <EffectFactory effect={e.INCOME(1, '', 'xs')} />
                </>
              )} */}
              <div className='ml-6'>
                <EffectFactory
                  effect={e[type.toUpperCase() as keyof typeof e](
                    getResourceCount(resources?.[type]),
                    '',
                    'md'
                  )}
                />
              </div>
              {renderResource(spend?.[type], 'spend')}
              {renderResource(gain?.[type], 'gain')}

              {gain?.income === type && (
                <>
                  <div className='text-green-500'>+ 1</div>
                  <EffectFactory effect={e.INCOME(1, '', 'xs')} />
                </>
              )}
            </div>
          </div>
        );
      })}
      {/* <div>{turn}</div> */}
      {/* <div>{item.resources}</div> */}
    </div>
  );
};

const DownloadableReplayItem = withDownloadableImage(ReplayItem);
export { DownloadableReplayItem };
