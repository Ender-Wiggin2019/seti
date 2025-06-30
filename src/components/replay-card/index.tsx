import { cn } from '@/lib/utils';

import { PreviewBaseCard } from '@/components/cards/base_cards/PreviewBaseCard';
import { EffectFactory } from '@/components/effect/Effect';
import withDownloadableImage from '@/components/replay-card/withDownloadableImage';
import { Separator } from '@/components/ui/separator';

import { e } from '@/constant/effect';
import { IReplayItem } from '@/constant/replay';
import { getCardById } from '@/utils/card';

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
  cards,
}: IReplayItem) => {
  return (
    <div
      className={cn(
        'source-code-pro w-96 relative rounded shadow-md bg-white p-2 m-2 text-zinc-900',
        { 'w-full': cards?.length > 0 }
      )}
    >
      {card && getCardById(card) && (
        <div className='absolute bottom-0 left-0 scale-90'>
          <PreviewBaseCard card={getCardById(card)!} />
        </div>
      )}
      {cards && (
        <div className='absolute bottom-0 -left-20 scale-75 flex gap-2'>
          {cards.map((card) => (
            <div key={getCardById(card).id} className=''>
              <PreviewBaseCard card={getCardById(card)} />
            </div>
          ))}
        </div>
      )}
      <div className='text-xl font-bold flex justify-between items-center'>
        第 {round} 大轮
        {['score'].map((type) => (
          <div
            key={type}
            className='flex font-bold text-4xl justify-end items-center gap-2'
          >
            {gain?.[type] && (
              <div className='text-green-500'>+{gain?.[type]}</div>
            )}
            <EffectFactory
              effect={e[type.toUpperCase() as keyof typeof e](
                resources?.[type],
                '',
                'md'
              )}
            />
          </div>
        ))}
      </div>
      <div className='text-md text-gray-500 font-bold'>第 {turn} 动</div>
      <Separator className='my-2' />
      <div className='text-2xl'>{desc}</div>
      <Separator className='my-2' />

      {['credit', 'energy', 'card', 'publicity', 'data', 'exofossil'].map(
        (type) => {
          if (resources?.[type] === undefined) return null;
          return (
            <div
              key={type}
              className='flex font-bold text-4xl justify-end items-center gap-2'
            >
              {resources?.[type] !== undefined && resources?.[type]}
              {spend?.[type] && (
                <div className='text-red-500'>-{spend?.[type]}</div>
              )}
              {gain?.[type] && (
                <div className='text-green-500'>+{gain?.[type]}</div>
              )}
              {gain?.income === type && (
                <>
                  <div className='text-green-500'>+ 1</div>
                  <EffectFactory effect={e.INCOME(1, '', 'xs')} />
                </>
              )}
              <div className='ml-6'>
                <EffectFactory
                  effect={e[type.toUpperCase() as keyof typeof e](
                    (resources?.[type] || 0) +
                      (gain?.[type] || 0) +
                      (gain?.income === type ? 1 : 0) -
                      (spend?.[type] || 0),
                    '',
                    'md'
                  )}
                />
              </div>
            </div>
          );
        }
      )}
      {/* <div>{turn}</div> */}
      {/* <div>{item.resources}</div> */}
    </div>
  );
};

const DownloadableReplayItem = withDownloadableImage(ReplayItem);
export { DownloadableReplayItem };
