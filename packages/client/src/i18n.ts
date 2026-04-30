import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from '../../common/locales/en/common.json';
import enFlavorText from '../../common/locales/en/flavorText.json';
import enSeti from '../../common/locales/en/seti.json';
import ptBrCommon from '../../common/locales/pt-BR/common.json';
import ptBrFlavorText from '../../common/locales/pt-BR/flavorText.json';
import ptBrSeti from '../../common/locales/pt-BR/seti.json';
import zhCnCommon from '../../common/locales/zh-CN/common.json';
import zhCnFlavorText from '../../common/locales/zh-CN/flavorText.json';
import zhCnSeti from '../../common/locales/zh-CN/seti.json';

type TSupportedLanguage = 'en' | 'zh-CN' | 'pt-BR';

function resolveInitialLanguage(): TSupportedLanguage {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const rawLanguage = window.navigator.language.toLowerCase();
  if (rawLanguage.startsWith('zh')) {
    return 'zh-CN';
  }
  if (rawLanguage.startsWith('pt')) {
    return 'pt-BR';
  }
  return 'en';
}

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      seti: enSeti,
      flavorText: enFlavorText,
    },
    'zh-CN': {
      common: zhCnCommon,
      seti: zhCnSeti,
      flavorText: zhCnFlavorText,
    },
    'pt-BR': {
      common: ptBrCommon,
      seti: ptBrSeti,
      flavorText: ptBrFlavorText,
    },
  },
  ns: ['common', 'seti', 'flavorText'],
  defaultNS: 'seti',
  lng: resolveInitialLanguage(),
  fallbackLng: 'en',
  supportedLngs: ['en', 'zh-CN', 'pt-BR'],
  returnNull: false,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
