/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-25 09:56:21
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-25 18:50:14
 * @Description:
 */
import { AppProps } from 'next/app';
import Script from 'next/script';
import { appWithTranslation } from 'next-i18next';

import '@/styles/card.css';
import '@/styles/icon.scss';
import '@/styles/odometer.css';
import '@/styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script
        async
        src='https://umami.ender-wiggin.com/script.js'
        data-website-id='7c7098e8-25da-46a0-8bfc-c831955f6a9e'
      ></Script>
      <Component {...pageProps} />
    </>
  );
}

export default appWithTranslation(MyApp);
