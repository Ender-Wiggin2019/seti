/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-25 09:56:21
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-25 18:50:14
 * @Description:
 */
import { AppProps } from 'next/app';
import Script from 'next/script';
import { appWithTranslation, useTranslation } from 'next-i18next';
import { I18nextProvider } from 'react-i18next';
import nextI18NextConfig from '../../next-i18next.config';

import '@seti/cards/styles/card.css';
import '@/styles/icon.scss';
import '@/styles/odometer.css';
import '@/styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  const { i18n } = useTranslation();

  return (
    <>
      <Script
        async
        src='https://umami.ender-wiggin.com/script.js'
        data-website-id='7c7098e8-25da-46a0-8bfc-c831955f6a9e'
      ></Script>
      <I18nextProvider i18n={i18n}>
        <Component {...pageProps} />
      </I18nextProvider>
    </>
  );
}

export default appWithTranslation(MyApp, nextI18NextConfig);
