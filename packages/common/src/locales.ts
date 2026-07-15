export const CARD_LOCALE_NAMESPACES = ['seti', 'flavorText'] as const;

export type TCardLocale = 'en' | 'zh-CN' | 'pt-BR';
export type TCardNamespace = (typeof CARD_LOCALE_NAMESPACES)[number];

export const CARD_LOCALE_RELATIVE_PATHS: Record<
  TCardLocale,
  Record<TCardNamespace, string>
> = {
  en: {
    seti: 'locales/en/seti.json',
    flavorText: 'locales/en/flavorText.json',
  },
  'zh-CN': {
    seti: 'locales/zh-CN/seti.json',
    flavorText: 'locales/zh-CN/flavorText.json',
  },
  'pt-BR': {
    seti: 'locales/pt-BR/seti.json',
    flavorText: 'locales/pt-BR/flavorText.json',
  },
};

export const getCardLocalePath = (
  locale: TCardLocale,
  namespace: TCardNamespace,
) => CARD_LOCALE_RELATIVE_PATHS[locale][namespace];
