import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useLayoutStore } from '../layoutStore';

export function LayoutDevPanel(): React.JSX.Element | null {
  const { t } = useTranslation('common');
  const open = useLayoutStore((s) => s.devPanelOpen);
  const mode = useLayoutStore((s) => s.mode);
  const setMode = useLayoutStore((s) => s.setMode);
  const setDevPanelOpen = useLayoutStore((s) => s.setDevPanelOpen);
  const resetAll = useLayoutStore((s) => s.resetAll);
  const exportSnapshot = useLayoutStore((s) => s.exportSnapshot);

  if (!open) return null;

  const handleExport = (): void => {
    const snapshot = exportSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `layout-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={cn(
        'fixed right-4 top-16 z-50 w-80',
        'rounded-md border border-[color:var(--metal-edge-soft)]',
        'bg-background-950/95 p-3 shadow-2xl backdrop-blur-md',
      )}
    >
      <div className='mb-3 flex items-center justify-between'>
        <h3 className='font-mono text-sm font-semibold uppercase tracking-wider text-text-100'>
          {t('client.layout_v2.dev_panel.title', {
            defaultValue: 'Layout Dev',
          })}
        </h3>
        <button
          onClick={() => setDevPanelOpen(false)}
          className='text-text-500 hover:text-text-100'
        >
          ✕
        </button>
      </div>

      <div className='space-y-3'>
        <div>
          <p className='mb-1 font-mono text-xs uppercase tracking-wider text-text-500'>
            {t('client.layout_v2.dev_panel.mode', { defaultValue: 'Mode' })}
          </p>
          <div className='flex gap-2'>
            <Button
              variant={mode === 'tab' ? 'primary' : 'ghost'}
              size='sm'
              onClick={() => setMode('tab')}
              className='flex-1'
            >
              {t('client.layout_v2.shell.tab', { defaultValue: 'Tab' })}
            </Button>
            <Button
              variant={mode === 'waterfall' ? 'primary' : 'ghost'}
              size='sm'
              onClick={() => setMode('waterfall')}
              className='flex-1'
            >
              {t('client.layout_v2.shell.waterfall', {
                defaultValue: 'Waterfall',
              })}
            </Button>
          </div>
        </div>

        <div className='flex gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleExport}
            className='flex-1'
          >
            {t('client.layout_v2.dev_panel.export', {
              defaultValue: 'Export',
            })}
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={resetAll}
            className='flex-1'
          >
            {t('client.layout_v2.dev_panel.reset', { defaultValue: 'Reset' })}
          </Button>
        </div>

        <p className='text-xs text-text-500'>
          {t('client.layout_v2.dev_panel.toggle_hint_prefix', {
            defaultValue: 'Press',
          })}{' '}
          <kbd className='rounded bg-background-800 px-1 py-0.5'>
            Ctrl+Shift+L
          </kbd>{' '}
          {t('client.layout_v2.dev_panel.toggle_hint_suffix', {
            defaultValue: 'to toggle',
          })}
        </p>
      </div>
    </div>
  );
}
