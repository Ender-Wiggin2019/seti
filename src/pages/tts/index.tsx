/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-11 23:41:00
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-12-01 16:52:45
 * @Description:
 */
/** biome-ignore-all lint/correctness/noUnusedVariables: <> */
/** biome-ignore-all lint/correctness/noUnusedImports: <> */
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { CardRender } from '@/components/form/CardRender';
import baseCards from '@/data/baseCards';
import spaceAgencyCards from '@/data/spaceAgencyCards';
import { IBaseCard } from '@/types/BaseCard';

type Props = {
  // Add custom props here
};

export default function HomePage(
  _props: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const { t } = useTranslation('common');
  // const cards = sortCards([...baseCards, ...alienCards]).slice(105);
  // const cards = sortCards([...baseCards, ...alienCards]);

  // const cards = baseCards; // tts should use original sort logic
  const cards = spaceAgencyCards;

  return (
    <div className=''>
      <div className='grid grid-cols-10 gap-0 w-[1500px]'>
        {cards.map((card) => {
          // const oriCard: IBaseCard = {
          //   ...card,
          //   special: { enableEffectRender: false },
          // };
          const renderCard: IBaseCard = {
            ...card,
            special: { ...card.special, enableEffectRender: true },
          };
          return (
            // <div className='' key={card.id}>
            // <div className='relative w-[150px]' key={card.id}>
            <CardRender key={card.id} card={renderCard} />
            // </div>
            // </div>
          );
        })}
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'zh-CN', [
      'common',
      'seti',
      'flavorText',
    ])),
  },
});
