import Markdown from 'react-markdown';

import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import { Container } from '@/components/ui/Container';
import { MarkCard } from '@/components/cards/base_cards/MarkCard';

type Props = {
  content: string;
};

export const MarkdownContainer = ({ content }: Props) => {
  return (
    <Layout>
      <Seo templateTitle='About' />

      <Container>
        <Markdown
          components={{
            p: ({ children }) => (
              <p className='markdown-body text-white'>{children}</p>
            ),
            ul: ({ children }) => (
              <ul className='markdown-body text-white'>{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className='markdown-body text-white'>{children}</ol>
            ),
            li: ({ children }) => (
              <li className='markdown-body text-white'>{children}</li>
            ),
            blockquote: ({ children }) => (
              <blockquote className='text-white'>{children}</blockquote>
            ),
            code: ({ inline, className, children, ...props }) => {
              // if (className?.includes('seti')) {
              //   return <code {...props}>{children}</code>;
              // }

              try {
                const ids = String(children)
                  .replace(/\n$/, '')
                  .replace(' ', '')
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
      </Container>
    </Layout>
  );
};
