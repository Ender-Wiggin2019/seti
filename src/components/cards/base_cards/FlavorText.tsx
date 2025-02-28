import Link from 'next/link';
import { Trans, useTranslation } from 'next-i18next';
import React from 'react';

interface BaseCardProps {
  id?: string;
  flavorText: string;
  display?: 'normal' | 'card';
}

export const FlavorText: React.FC<BaseCardProps> = ({
  id,
  flavorText,
  display,
}) => {
  const { t } = useTranslation(['flavorText']);
  const cls = display === 'normal' ? 'normal-flavor-text' : 'card-flavor-text';
  // Easter egg: SETI@Home
  if (id === '108') {
    return (
      <div className={cls}>
        <Trans i18nKey={flavorText} ns='flavorText'>
          Anyone can help search for alien life. All you need to do is connect to
          <Link
            className='text-sky-800 underline underline-offset-2'
            href='https://setiathome.berkeley.edu'
          >
            https://setiathome.berkeley.edu
          </Link>
          .
        </Trans>
      </div>
    );
  }

  return <div className={cls}>{t(flavorText)}</div>;
};
