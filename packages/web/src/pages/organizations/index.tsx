import { ORGANIZATIONS } from '@seti/common/data/organizations';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '@/components/layout/Layout';
import { OrganizationCard } from '@/components/organization/OrganizationCard';
import Seo from '@/components/Seo';
import { Container } from '@/components/ui/Container';

type Props = {
  // Add custom props here
};

export default function OrganizationsPage(
  _props: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const { t } = useTranslation('common');

  return (
    <Layout>
      <Seo templateTitle='Organizations' />
      <Container>
        <div className='mt-6'>
          <header className='mb-6'>
            <p className='mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary-200/80'>
              {t('organizations_page.kicker', {
                defaultValue: 'SETI Organizations',
              })}
            </p>
            <h1 className='text-3xl font-black uppercase tracking-wide text-zinc-50 sm:text-5xl'>
              {t('organizations_page.title', { defaultValue: '组织' })}
            </h1>
            <p className='mt-3 max-w-3xl text-sm leading-6 text-zinc-300 md:text-base'>
              {t('organizations_page.subtitle', {
                defaultValue:
                  '11 个全新组织，每个都拥有独特的能力与初始资源。点击查看大图，悬停可放大预览。',
              })}
            </p>
          </header>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {ORGANIZATIONS.map((organization) => (
              <OrganizationCard
                key={organization.id}
                organization={organization}
              />
            ))}
          </div>
        </div>
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
