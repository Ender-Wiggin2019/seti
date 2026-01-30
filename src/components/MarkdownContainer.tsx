/*
 * @Author: Ender-Wiggin
 * @Date: 2025-04-14 23:49:39
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-06-04 16:44:47
 * @Description:
 */
import Giscus, { GiscusProps } from '@giscus/react';
import { useTranslation } from 'next-i18next';
import Markdown from 'react-markdown';

import { MarkCard } from '@/components/cards/base_cards/MarkCard';
import { DescRender } from '@/components/effect/DescRender';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import { AccordionV2 } from '@/components/ui/accordion-v2';
import { Container } from '@/components/ui/Container';
import { EffectTable } from '@/components/ui/effect-table';
import { Separator } from '@/components/ui/separator';

type Props = {
  title: string;
  content: string;
  giscusProps?: Partial<GiscusProps>;
};

export const MarkdownContainer = ({ title, content, giscusProps }: Props) => {
  const { t } = useTranslation('common');
  return (
    <Layout>
      <Seo templateTitle={t(title)} />

      <Container className='px-3 pt-3 md:px-4 md:pt-6'>
        <Markdown
          components={{
            h1: ({ children }) => (
              <h1 className='scroll-m-20 text-4xl font-bold tracking-tight text-space-50 lg:text-5xl'>
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className='mt-12 scroll-m-20 border-b border-primary/20 pb-3 text-3xl font-semibold tracking-tight text-space-100 first:mt-0'>
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className='mt-10 scroll-m-20 text-2xl font-semibold tracking-tight text-space-100'>
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className='mt-8 scroll-m-20 text-xl font-semibold tracking-tight text-space-200'>
                {children}
              </h4>
            ),
            p: ({ children }) => (
              <p className='leading-7 text-space-300 [&:not(:first-child)]:mt-6'>
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className='my-6 ml-6 list-disc text-space-300 marker:text-primary/60 [&>li]:mt-2'>
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className='my-6 ml-6 list-decimal text-space-300 marker:text-primary/60 [&>li]:mt-2'>
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className='text-space-300'>{children}</li>
            ),
            blockquote: ({ children }) => (
              <blockquote className='mt-6 border-l-2 border-primary/50 bg-gradient-to-r from-space-900/60 to-transparent pl-6 pr-4 py-4 italic text-space-300 rounded-r-lg'>
                {children}
              </blockquote>
            ),
            strong: ({ children }) => (
              <strong className='font-semibold text-space-50'>
                {children}
              </strong>
            ),
            a: ({ children, href }) => (
              <a
                href={href}
                className='font-medium text-primary/90 underline decoration-primary/30 underline-offset-4 transition-all duration-200 hover:text-primary hover:decoration-primary/60'
                target='_blank'
                rel='noopener noreferrer'
              >
                {children}
              </a>
            ),
            hr: () => (
              <div className='my-10 flex items-center justify-center gap-3'>
                <div className='h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent' />
                <div className='h-1.5 w-1.5 rounded-full bg-primary/40' />
                <div className='h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent' />
              </div>
            ),
            code: ({ inline, className, children, ...props }) => {
              if (inline) {
                // if (String(children).startsWith('{')) {
                // return <DescRender desc={String(children)} size='sm' />;
                // }
                const ids = String(children).split(',');
                return <MarkCard ids={ids} onlyId />;
              }

              if (className?.includes('desc')) {
                return (
                  <div className='bg-space-900/60 backdrop-blur-sm rounded-lg p-3 mt-4 ring-1 ring-space-700/30'>
                    <DescRender desc={String(children)} size='sm' />
                  </div>
                );
              }

              if (className?.includes('txt')) {
                return (
                  <div className='bg-space-900/60 backdrop-blur-sm rounded-lg p-3 mt-4 flex justify-center ring-1 ring-space-700/30'>
                    {children}
                  </div>
                );
              }

              if (className?.includes('table')) {
                return (
                  <AccordionV2 title={t('posts.expand')}>
                    <EffectTable />
                  </AccordionV2>
                );
              }
              try {
                const ids = String(children)
                  .replace(/\n$/, '')
                  // .replace(' ', '')
                  .split(',');

                if (className?.includes('seti')) {
                  return (
                    <div className='px-1 py-2 transition-colors duration-200 hover:text-primary'>
                      <MarkCard ids={ids} />
                    </div>
                  );
                }

                return (
                  <code
                    className='px-1.5 py-0.5 rounded text-sm bg-space-800/80 text-primary/90 ring-1 ring-space-700/30'
                    {...props}
                  >
                    {children}
                  </code>
                );
                // }
              } catch {
                return (
                  <code className='px-1.5 py-0.5 rounded text-sm bg-red-950/50 text-red-400'>
                    {children}
                  </code>
                );
              }
            },
          }}
        >
          {content}
        </Markdown>
        <Giscus
          // id='comments'
          // categoryId='DIC_kwDON-z0tc4CpF4W'
          // term='Welcome to share your idea about SETI'
          {...giscusProps}
          repo='Ender-Wiggin2019/seti'
          repoId='R_kgDON-z0tQ'
          category='Ideas'
          mapping={giscusProps?.mapping || 'pathname'}
          reactionsEnabled='1'
          emitMetadata='0'
          inputPosition='top'
          theme='catppuccin_frappe'
          lang='en'
          loading='lazy'
        />
      </Container>
    </Layout>
  );
};
