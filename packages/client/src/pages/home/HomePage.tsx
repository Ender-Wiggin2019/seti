import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/stores/authStore';

type TLanguage = 'en' | 'zh-CN' | 'pt-BR';

function resolveLanguage(rawLanguage: string | undefined): TLanguage {
  const normalized = (rawLanguage ?? 'en').toLowerCase();
  if (normalized.startsWith('zh')) {
    return 'zh-CN';
  }
  if (normalized.startsWith('pt')) {
    return 'pt-BR';
  }
  return 'en';
}

export function HomePage(): React.JSX.Element {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation('common');
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userName = useAuthStore(
    (state) => state.user?.name ?? t('client.home.default_name'),
  );
  const [language, setLanguage] = useState<TLanguage>(() =>
    resolveLanguage(i18n.resolvedLanguage ?? i18n.language),
  );

  useEffect(() => {
    setLanguage(resolveLanguage(i18n.resolvedLanguage ?? i18n.language));
  }, [i18n.language, i18n.resolvedLanguage]);

  function handleLanguageChange(nextValue: string): void {
    const nextLanguage = resolveLanguage(nextValue);
    setLanguage(nextLanguage);
    void i18n.changeLanguage(nextLanguage);
  }

  return (
    <div className='space-y-6'>
      <section className='rounded-lg border border-surface-700/60 bg-surface-900/40 p-5'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='space-y-2'>
            <h1 className='font-display text-2xl font-bold uppercase tracking-wider text-text-100'>
              {t('home.title')}
            </h1>
            <p className='max-w-xl text-sm text-text-400'>
              {isAuthenticated
                ? t('home.subtitle_authenticated', { name: userName })
                : t('home.subtitle_guest')}
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <span className='font-mono text-[11px] uppercase tracking-wide text-text-400'>
              {t('home.language')}
            </span>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger
                className='h-9 w-[130px]'
                aria-label={t('home.language')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='en'>English</SelectItem>
                <SelectItem value='zh-CN'>简体中文</SelectItem>
                <SelectItem value='pt-BR'>Português</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className='rounded-lg border border-surface-700/60 bg-surface-900/30 p-5'>
        <div className='flex flex-wrap items-center gap-3'>
          {isAuthenticated ? (
            <>
              <Button onClick={() => navigate({ to: '/lobby' })}>
                {t('home.open_lobby')}
              </Button>
              <Button
                variant='ghost'
                onClick={() => navigate({ to: '/profile' })}
              >
                {t('home.profile')}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => navigate({ to: '/auth' })}>
                {t('home.sign_in')}
              </Button>
              <Button variant='ghost' onClick={() => navigate({ to: '/auth' })}>
                {t('home.create_account')}
              </Button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
