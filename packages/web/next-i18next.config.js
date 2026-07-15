/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-26 11:48:15
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2026-03-24 12:20:24
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
      ? path.resolve('./../common/locales')
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
