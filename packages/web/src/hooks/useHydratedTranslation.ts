import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';

/**
 * Hook para resolver problemas de hidratação com i18n
 * Retorna a tradução apenas após a hidratação ser concluída
 * Durante SSR e primeira renderização cliente, retorna fallback em inglês
 */
export function useHydratedTranslation(namespace?: string) {
  const { t, i18n } = useTranslation(namespace);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const safeT = (key: string, fallback?: string) => {
    if (!isHydrated) {
      // Durante SSR/hidratação, retorna fallback em inglês
      return fallback || key;
    }
    return t(key);
  };

  return {
    t: safeT,
    i18n,
    isHydrated,
  };
}
