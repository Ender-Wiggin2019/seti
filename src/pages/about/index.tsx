import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React from 'react';

// make sure to import your TextFilter
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import { Container } from '@/components/ui/Container';
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
            {t('about.title')}
          </h1>
          <p className='leading-7 [&:not(:first-child)]:mt-6'>
            Beta version, still in development. Made by Ender.
          </p>
          <p className='leading-7 [&:not(:first-child)]:mt-6'>
            测试版本，仍在开发中。Ender制作。
          </p>
          <p className='leading-7 [&:not(:first-child)]:mt-6'>
            特别感谢以下玩家为本网站提供的翻译支持与建议: 根派, 自爆型大老师,
            天使。
          </p>
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
