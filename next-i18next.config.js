/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-26 11:48:15
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-29 12:31:54
 * @Description:
 */
// @ts-check
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
/**
 * @type {import('next-i18next').UserConfig}
 */
module.exports = {
  // https://www.i18next.com/overview/configuration-options#logging
  // debug: process.env.NODE_ENV === 'development',
  debug: false,
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-CN', 'pt-BR'],
    localeDetection: false,
  },
  /** To avoid issues when deploying to some paas (vercel...) */
  localePath:
    typeof window === 'undefined'
      ? path.resolve('./public/locales')
      : '/locales',
  localeStructure: '{{lng}}/{{ns}}',
  reloadOnPrerender: process.env.NODE_ENV === 'development',

  /**
   * @link https://github.com/i18next/next-i18next#6-advanced-configuration
   */
  saveMissing: true,
  // strictMode: true,
  // serializeConfig: false,
  // react: { useSuspense: false }
};
