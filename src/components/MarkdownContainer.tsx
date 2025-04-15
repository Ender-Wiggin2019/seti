/*
 * @Author: Ender-Wiggin
 * @Date: 2025-04-14 23:49:39
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-15 16:16:02
 * @Description:
 */
import Giscus from '@giscus/react';
import Markdown from 'react-markdown';

import { MarkCard } from '@/components/cards/base_cards/MarkCard';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import { Container } from '@/components/ui/Container';

type Props = {
  title: string;
  content: string;
};

export const MarkdownContainer = ({ title, content }: Props) => {
  return (
    <Layout>
      <Seo templateTitle={title} />

      <Container className='px-2 pt-2'>
        <Markdown
          components={{
            h1: ({ children }) => (
              <h1 className='scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl'>
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className='mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0'>
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className='mt-8 scroll-m-20 text-2xl font-semibold tracking-tight'>
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className='mt-6 scroll-m-20 text-xl font-semibold tracking-tight'>
                {children}
              </h4>
            ),
            p: ({ children }) => (
              <p className='leading-7 [&:not(:first-child)]:mt-6'>{children}</p>
            ),
            ul: ({ children }) => (
              <ul className='my-6 ml-6 list-disc [&>li]:mt-2'>{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className='my-6 ml-6 list-disc [&>li]:mt-2'>{children}</ol>
            ),
            li: ({ children }) => <li className=''>{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className='mt-6 border-l-2 pl-6 italic'>
                {children}
              </blockquote>
            ),
            strong: ({ children }) => (
              <strong className='font-semibold text-primary-500'>
                {children}
              </strong>
            ),
            code: ({ inline, className, children, ...props }) => {
              // if (className?.includes('seti')) {
              //   return <code {...props}>{children}</code>;
              // }

              try {
                const ids = String(children)
                  .replace(/\n$/, '')
                  // .replace(' ', '')
                  .split(',');

                if (inline) return <MarkCard ids={ids} onlyId />;

                return (
                  <div className='px-1 py-2'>
                    <MarkCard ids={ids} />
                  </div>
                );
              } catch {
                return <code className='text-red-500'>{children}</code>;
              }
            },
          }}
        >
          {content}
        </Markdown>
        <Giscus
          id='comments'
          repo='Ender-Wiggin2019/seti'
          repoId='R_kgDON-z0tQ'
          category='Ideas'
          categoryId='DIC_kwDON-z0tc4CpF4W'
          mapping='specific'
          term='Welcome to share your idea about SETI'
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
