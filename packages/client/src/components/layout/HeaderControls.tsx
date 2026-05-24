import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/cn';
import { useDebugStore } from '@/stores/debugStore';

type TLanguage = 'en' | 'zh-CN' | 'pt-BR';

function resolveLanguage(rawLanguage: string | undefined): TLanguage {
  const normalized = (rawLanguage ?? 'en').toLowerCase();
  if (normalized.startsWith('zh')) return 'zh-CN';
  if (normalized.startsWith('pt')) return 'pt-BR';
  return 'en';
}

interface IHeaderControlsProps {
  /**
   * Visual variant. `'shell'` matches the AppShell header (lobby/auth/profile),
   * `'compact'` matches the in-game TopBar where horizontal space is tight.
   */
  variant?: 'shell' | 'compact';
  className?: string;
}

/**
 * Compact language + text-mode switches usable in any header. Reads i18n state
 * directly (no local mirror) to avoid getting out of sync with the canonical
 * `i18n.resolvedLanguage`.
 */
export function HeaderControls({
  variant = 'shell',
  className,
}: IHeaderControlsProps): React.JSX.Element {
  const { i18n, t } = useTranslation('common');
  const language: TLanguage = resolveLanguage(
    i18n.resolvedLanguage ?? i18n.language,
  );
  const textMode = useDebugStore((state) => state.textMode);
  const setTextMode = useDebugStore((state) => state.setTextMode);

  function handleLanguageChange(nextValue: string): void {
    void i18n.changeLanguage(resolveLanguage(nextValue));
  }

  const isCompact = variant === 'compact';

  return (
    <div
      className={cn(
        'flex items-center',
        isCompact ? 'gap-2' : 'gap-3',
        className,
      )}
      data-testid='header-controls'
    >
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger
          className={cn(
            isCompact ? 'h-7 w-[110px] text-xs' : 'h-8 w-[118px] sm:w-[130px]',
          )}
          aria-label={t('home.language')}
          data-testid='header-language-select'
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='en'>English</SelectItem>
          <SelectItem value='zh-CN'>简体中文</SelectItem>
          <SelectItem value='pt-BR'>Português</SelectItem>
        </SelectContent>
      </Select>

      <label
        className={cn(
          'flex items-center gap-1.5 font-mono uppercase tracking-microlabel text-text-500',
          'whitespace-nowrap',
          isCompact ? 'text-[10px]' : 'text-[11px]',
        )}
      >
        <span>{t('home.text_mode', { defaultValue: 'Text view' })}</span>
        <Switch
          checked={textMode}
          onCheckedChange={setTextMode}
          aria-label={t('home.text_mode', { defaultValue: 'Text view' })}
          data-testid='header-text-mode-switch'
        />
      </label>
    </div>
  );
}
