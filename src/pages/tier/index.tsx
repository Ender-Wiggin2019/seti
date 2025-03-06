import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React from 'react';

import { PureCardList } from '@/components/cards/base_cards/PureCardList';
// make sure to import your TextFilter
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import { Container } from '@/components/ui/Container';

import { Tier } from '@/constant/tier';
import { getCardsById } from '@/utils/card';
type Props = {
  // Add custom props here
};

export default function HomePage(
  _props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const { t } = useTranslation('common');

  return (
    <Layout>
      <Seo templateTitle='About' />

      <Container>
        <div className='mt-4'>
          <h1 className='scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl'>
            {t('Tier List')}
          </h1>
          {}
          <p className='leading-7 [&:not(:first-child)]:mt-6'>
            注:
            <br />
            1. 纯主观, 游戏经验有待积累, 卡表会相应更新
            <br />
            2. 大多数纯任务牌, 能完成都有 t2 强度
            <br />
          </p>
          {/* <p className='leading-7 [&:not(:first-child)]:mt-6'>
            2. 大多数纯任务牌, 能完成都有t2+强度
          </p> */}
          <h2 className='text-2xl font-bold mt-4'>T1</h2>
          <PureCardList cardList={getCardsById(Tier.T1, true)} />
          <h2 className='text-2xl font-bold mt-4'>T2</h2>
          <PureCardList cardList={getCardsById(Tier.T2, true)} />
          {/* <h2 className='text-2xl font-bold mt-4'>T3</h2>
          <PureCardList cardList={getCardsById(Tier.T3, true)} />
          <PureCardList cardList={getCardsById(Tier.T4, true)} /> */}

          {/* <p className='leading-7 [&:not(:first-child)]:mt-6'>
            <Trans i18nKey='about.intro'>
              This is an open-source unofficial website of the board game Ark
              Nova. It is not affiliated with Capstone Games in any way. This
              project gets inspiration from ssimeonoff's website and for players
              to easily search for cards and their effects. The initial data for
              this site is sourced from
              <Link
                className='font-medium text-primary underline underline-offset-4'
                href='https://boardgamegeek.com/filepage/225656/cards-part-1-v09-english'
              >
                Cillie's List of animal cards
              </Link>
              , while the icons and styles were borrowed from
              <Link
                className='font-medium text-primary underline underline-offset-4'
                href='https://boardgamearena.com/gamepanel?game=arknova'
              >
                BGA
              </Link>
              If there are any copyright concerns, I will address them.
            </Trans>
          </p>
          <h2 className='mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0'>
            {t('about.features.title')}
          </h2>

          <p className='leading-7 [&:not(:first-child)]:mt-6'>
            {t('about.features.intro')}
          </p>
          <ul className='my-6 ml-6 list-disc [&>li]:mt-2'>
            <li>{t('about.features.li_1')}</li>
            <li>{t('about.features.li_2')}</li>
            <li>{t('about.features.li_3')}</li>
            <li>{t('about.features.li_4')}</li>
            <li>{t('about.features.li_5')}</li>
          </ul>
          <h3 className='mt-8 scroll-m-20 text-2xl font-semibold tracking-tight'>
            {t('about.features.plan_title')}
          </h3>
          <p className='leading-7 [&:not(:first-child)]:mt-6'>
            {t('about.features.plan_intro')}
          </p>
          <ul className='my-6 ml-6 list-disc [&>li]:mt-2'>
            <li>{t('about.features.plan_li_1')}</li>
            <li>{t('about.features.plan_li_2')}</li>
            <li>{t('about.features.plan_li_3')}</li>
          </ul>
          <h2 className='mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0'>
            {t('about.thanks.title')}
          </h2>
          <p className='leading-7 [&:not(:first-child)]:mt-6'>
            {t('about.thanks.translation')}
          </p>
          <h2 className='mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0'>
            {t('about.faq.title')}
          </h2>
 */}
        </div>

        {/* <Accordion type='single' collapsible className='w-full'>
          <AccordionItem value='item-1'>
            <AccordionTrigger>{t('about.faq.q_1')}</AccordionTrigger>
            <AccordionContent>
              <Trans i18nKey='about.faq.a_1'>
                Nice! You can follow the instructions
                <Link
                  className='font-medium text-primary underline underline-offset-4'
                  href='https://github.com/Ender-Wiggin2019/Next-seti-Cards/tree/main#help-to-translate'
                >
                  here
                </Link>
                .
              </Trans>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-2'>
            <AccordionTrigger>{t('about.faq.q_2')}</AccordionTrigger>
            <AccordionContent>{t('about.faq.a_2')}</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-3'>
            <AccordionTrigger>{t('about.faq.q_3')}</AccordionTrigger>
            <AccordionContent>
              <Trans i18nKey='about.faq.a_3'>
                Feel free to comment in the
                <Link
                  className='font-medium text-primary underline underline-offset-4'
                  href='https://boardgamegeek.com/thread/3114327/new-seti-card-website-marine-world-and-multi-l'
                >
                  BGG thread
                </Link>
                or submit an issue at
                <Link
                  className='font-medium text-primary underline underline-offset-4'
                  href='https://github.com/Ender-Wiggin2019/Next-seti-Cards/issues'
                >
                  GitHub
                </Link>
                .
              </Trans>
            </AccordionContent>
          </AccordionItem>
        </Accordion> */}
      </Container>
    </Layout>
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
