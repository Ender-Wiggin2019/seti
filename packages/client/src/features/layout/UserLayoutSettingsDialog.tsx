import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';
import { type LayoutSnapshot, useLayoutStore } from './layoutStore';
import type { LayoutMode, SectionId } from './types';

interface IUserLayoutSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MOBILE_SECTIONS: Array<{ id: SectionId; label: string }> = [
  { id: 'playerBoard', label: 'Player Board' },
  { id: 'solarSystem', label: 'Solar System' },
  { id: 'planetBoard', label: 'Planet Board' },
  { id: 'techBoard', label: 'Tech Board' },
  { id: 'alienBoard', label: 'Alien Board' },
  { id: 'cardRows', label: 'Card Rows' },
  { id: 'log', label: 'Log' },
  { id: 'endGame', label: 'End Game' },
];

const WATERFALL_PREVIEW: Array<{
  slot: 'left' | 'middle' | 'right';
  label: string;
  sections: Array<{ id: SectionId; label: string }>;
}> = [
  {
    slot: 'left',
    label: 'Left',
    sections: [
      { id: 'solarSystem', label: 'Solar System' },
      { id: 'planetBoard', label: 'Planet Board' },
      { id: 'endGame', label: 'End Game' },
    ],
  },
  {
    slot: 'middle',
    label: 'Middle',
    sections: [
      { id: 'techBoard', label: 'Tech Board' },
      { id: 'alienBoard', label: 'Alien Board' },
      { id: 'cardRows', label: 'Card Rows' },
    ],
  },
  {
    slot: 'right',
    label: 'Right',
    sections: [
      { id: 'playerBoard', label: 'Player Board' },
      { id: 'log', label: 'Log' },
    ],
  },
];

const TAB_PREVIEW = ['Board', 'Planets', 'Tech', 'Cards', 'Aliens', 'Scoring'];
const DEFAULT_WATERFALL_COLUMNS: Record<'left' | 'middle' | 'right', number> = {
  left: 43,
  middle: 37,
  right: 20,
};

function coerceSettings(raw: unknown): Partial<LayoutSnapshot> {
  if (!raw || typeof raw !== 'object') return {};
  if ('state' in raw && raw.state && typeof raw.state === 'object') {
    return raw.state as Partial<LayoutSnapshot>;
  }
  return raw as Partial<LayoutSnapshot>;
}

function toNumberValue(value: unknown): string {
  return typeof value === 'number' ? String(value) : '';
}

function parseNumberValue(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
}

function columnLabel(
  rootColumns: LayoutSnapshot['rootColumns'],
  key: 'left' | 'middle' | 'right',
  fallback: string,
): string {
  return rootColumns?.[key] || fallback;
}

function mobilePreviewSections(
  overrides: LayoutSnapshot['overrides'],
): Array<{ id: SectionId; label: string; order: number }> {
  return MOBILE_SECTIONS.map((section, index) => ({
    ...section,
    order: overrides[section.id]?.mobileOrder ?? index + 1,
  })).sort((a, b) => a.order - b.order);
}

export function UserLayoutSettingsDialog({
  open,
  onOpenChange,
}: IUserLayoutSettingsDialogProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const enabled = useLayoutStore((s) => s.enabled);
  const mode = useLayoutStore((s) => s.mode);
  const overrides = useLayoutStore((s) => s.overrides);
  const collapsed = useLayoutStore((s) => s.collapsed);
  const rootColumns = useLayoutStore((s) => s.rootColumns);
  const tabColumns = useLayoutStore((s) => s.tabColumns);
  const panelLayouts = useLayoutStore((s) => s.panelLayouts);
  const setEnabled = useLayoutStore((s) => s.setEnabled);
  const setMode = useLayoutStore((s) => s.setMode);
  const setPanelLayout = useLayoutStore((s) => s.setPanelLayout);
  const patchSection = useLayoutStore((s) => s.patchSection);
  const importSnapshot = useLayoutStore((s) => s.importSnapshot);
  const exportSnapshot = useLayoutStore((s) => s.exportSnapshot);
  const resetAll = useLayoutStore((s) => s.resetAll);

  const snapshot = useMemo<LayoutSnapshot>(
    () => ({
      enabled,
      mode,
      overrides,
      collapsed,
      rootColumns,
      tabColumns,
      panelLayouts,
    }),
    [
      enabled,
      mode,
      overrides,
      collapsed,
      rootColumns,
      tabColumns,
      panelLayouts,
    ],
  );
  const [jsonDraft, setJsonDraft] = useState(() =>
    JSON.stringify(snapshot, null, 2),
  );
  const waterfallColumns = {
    ...DEFAULT_WATERFALL_COLUMNS,
    ...(panelLayouts?.['waterfall-columns'] ?? {}),
  };

  useEffect(() => {
    if (open) setJsonDraft(JSON.stringify(snapshot, null, 2));
  }, [open, snapshot]);

  const refreshJson = (): void => {
    setJsonDraft(JSON.stringify(exportSnapshot(), null, 2));
  };

  const handleExport = (): void => {
    const blob = new Blob([JSON.stringify(exportSnapshot(), null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const applyJson = (source: string): void => {
    try {
      const parsed = JSON.parse(source) as unknown;
      importSnapshot(coerceSettings(parsed));
      setJsonDraft(JSON.stringify(coerceSettings(parsed), null, 2));
      toast({ title: 'Layout settings imported', variant: 'success' });
    } catch (error) {
      toast({
        title: 'Invalid settings.json',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      });
    }
  };

  const handleImportFile = (file: File | undefined): void => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => applyJson(String(reader.result ?? ''));
    reader.readAsText(file);
  };

  const updateSectionNumber = (
    id: SectionId,
    key: 'mobileOrder' | 'grow',
    value: string,
  ): void => {
    const parsed = parseNumberValue(value);
    if (key === 'mobileOrder') {
      patchSection(id, { mobileOrder: parsed });
      return;
    }
    patchSection(id, {
      size: { ...(overrides[id]?.size ?? {}), grow: parsed },
    });
  };

  const updateSectionSize = (
    id: SectionId,
    key: 'height' | 'minH',
    value: string,
  ): void => {
    patchSection(id, {
      size: { ...(overrides[id]?.size ?? {}), [key]: value },
    });
  };

  const updateSectionScale = (id: SectionId, value: string): void => {
    patchSection(id, {
      size: {
        ...(overrides[id]?.size ?? {}),
        scale: parseNumberValue(value),
      },
    });
  };

  const updateWaterfallColumn = (
    key: 'left' | 'middle' | 'right',
    value: string,
  ): void => {
    const parsed = parseNumberValue(value);
    if (parsed === undefined) return;
    setPanelLayout('waterfall-columns', {
      ...waterfallColumns,
      [key]: parsed,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[88vh] max-w-4xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Layout Settings</DialogTitle>
          <DialogDescription>
            Configure the in-game layout. Changes are stored locally in this
            browser automatically and can be exported as settings.json.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 lg:grid-cols-[1fr_1fr]'>
          <section className='space-y-4'>
            <SettingsBlock title='Mode'>
              <Field label='Game Layout System'>
                <div className='grid grid-cols-2 gap-2'>
                  <Button
                    variant={enabled ? 'primary' : 'ghost'}
                    onClick={() => setEnabled(true)}
                  >
                    Configurable
                  </Button>
                  <Button
                    variant={!enabled ? 'primary' : 'ghost'}
                    onClick={() => setEnabled(false)}
                  >
                    Legacy
                  </Button>
                </div>
                <p className='text-xs leading-relaxed text-text-500'>
                  Layout settings only affect games when Configurable is active.
                </p>
              </Field>
              <Field label='Default Layout Mode'>
                <div className='grid grid-cols-2 gap-2'>
                  <Button
                    variant={mode === 'tab' ? 'primary' : 'ghost'}
                    onClick={() => setMode('tab')}
                  >
                    Tab
                  </Button>
                  <Button
                    variant={mode === 'waterfall' ? 'primary' : 'ghost'}
                    onClick={() => setMode('waterfall')}
                  >
                    Waterfall
                  </Button>
                </div>
              </Field>
            </SettingsBlock>

            <LayoutPreview
              mode={mode}
              rootColumns={rootColumns}
              panelLayouts={panelLayouts}
              overrides={overrides}
            />

            <SettingsBlock title='Waterfall Columns'>
              <div className='grid gap-3 sm:grid-cols-3'>
                <Field label='Left %'>
                  <Input
                    value={toNumberValue(waterfallColumns.left)}
                    placeholder='44'
                    onChange={(e) =>
                      updateWaterfallColumn('left', e.target.value)
                    }
                    mono
                  />
                </Field>
                <Field label='Middle %'>
                  <Input
                    value={toNumberValue(waterfallColumns.middle)}
                    placeholder='33'
                    onChange={(e) =>
                      updateWaterfallColumn('middle', e.target.value)
                    }
                    mono
                  />
                </Field>
                <Field label='Right %'>
                  <Input
                    value={toNumberValue(waterfallColumns.right)}
                    placeholder='23'
                    onChange={(e) =>
                      updateWaterfallColumn('right', e.target.value)
                    }
                    mono
                  />
                </Field>
              </div>
              <p className='text-xs leading-relaxed text-text-500'>
                These percentages are also updated when you drag the column
                handles in game.
              </p>
            </SettingsBlock>

            <SettingsBlock title='Pinned Areas'>
              <div className='grid gap-3 sm:grid-cols-2'>
                <Field label='Hand Height'>
                  <Input
                    value={overrides.hand?.size?.height ?? ''}
                    placeholder='112px'
                    onChange={(e) =>
                      updateSectionSize('hand', 'height', e.target.value)
                    }
                    mono
                  />
                </Field>
                <Field label='Log Height'>
                  <Input
                    value={overrides.log?.size?.height ?? ''}
                    placeholder='240px'
                    onChange={(e) =>
                      updateSectionSize('log', 'height', e.target.value)
                    }
                    mono
                  />
                </Field>
                <Field label='Log Min Height'>
                  <Input
                    value={overrides.log?.size?.minH ?? ''}
                    placeholder='180px'
                    onChange={(e) =>
                      updateSectionSize('log', 'minH', e.target.value)
                    }
                    mono
                  />
                </Field>
                <Field label='Log Grow'>
                  <Input
                    value={toNumberValue(overrides.log?.size?.grow)}
                    placeholder='0'
                    onChange={(e) =>
                      updateSectionNumber('log', 'grow', e.target.value)
                    }
                    mono
                  />
                </Field>
              </div>
            </SettingsBlock>

            <SettingsBlock title='Board Scale'>
              <div className='grid gap-3 sm:grid-cols-2'>
                <Field label='Tech Board Scale'>
                  <Input
                    value={toNumberValue(overrides.techBoard?.size?.scale)}
                    placeholder='0.86'
                    onChange={(e) =>
                      updateSectionScale('techBoard', e.target.value)
                    }
                    mono
                  />
                </Field>
                <Field label='Card Rows Scale'>
                  <Input
                    value={toNumberValue(overrides.cardRows?.size?.scale)}
                    placeholder='0.86'
                    onChange={(e) =>
                      updateSectionScale('cardRows', e.target.value)
                    }
                    mono
                  />
                </Field>
              </div>
            </SettingsBlock>

            <SettingsBlock title='Mobile Order'>
              <div className='grid gap-2 sm:grid-cols-2'>
                {MOBILE_SECTIONS.map((section) => (
                  <Field key={section.id} label={section.label}>
                    <Input
                      value={toNumberValue(overrides[section.id]?.mobileOrder)}
                      placeholder='auto'
                      onChange={(e) =>
                        updateSectionNumber(
                          section.id,
                          'mobileOrder',
                          e.target.value,
                        )
                      }
                      mono
                    />
                  </Field>
                ))}
              </div>
            </SettingsBlock>
          </section>

          <section className='space-y-4'>
            <SettingsBlock title='JSON'>
              <p className='text-xs leading-relaxed text-text-500'>
                Use JSON for full control. Import accepts either exported
                settings.json or the raw persisted Zustand shape.
              </p>
              <textarea
                value={jsonDraft}
                onChange={(e) => setJsonDraft(e.target.value)}
                className={cn(
                  'min-h-[420px] w-full rounded-[5px] px-3 py-2 font-mono text-xs',
                  'border border-[color:var(--metal-edge)] bg-[oklch(0.10_0.02_260)]',
                  'text-text-100 shadow-hairline-inset focus:border-accent-500 focus:outline-none',
                )}
                spellCheck={false}
              />
              <div className='flex flex-wrap gap-2'>
                <Button size='sm' onClick={() => applyJson(jsonDraft)}>
                  Apply JSON
                </Button>
                <Button size='sm' variant='ghost' onClick={refreshJson}>
                  Refresh JSON
                </Button>
                <Button size='sm' variant='ghost' onClick={handleExport}>
                  Export settings.json
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => fileInputRef.current?.click()}
                >
                  Import settings.json
                </Button>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='application/json,.json'
                  className='hidden'
                  onChange={(e) => handleImportFile(e.target.files?.[0])}
                />
              </div>
            </SettingsBlock>
          </section>
        </div>

        <DialogFooter>
          <p className='mr-auto self-center text-xs text-text-500'>
            Saved automatically to this browser.
          </p>
          <Button variant='ghost' onClick={resetAll}>
            Reset Layout
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LayoutPreview({
  mode,
  rootColumns,
  panelLayouts,
  overrides,
}: {
  mode: LayoutMode;
  rootColumns: LayoutSnapshot['rootColumns'];
  panelLayouts: LayoutSnapshot['panelLayouts'];
  overrides: LayoutSnapshot['overrides'];
}): React.JSX.Element {
  const handHeight = overrides.hand?.size?.height || '120px';
  const logHeight = overrides.log?.size?.height || 'auto';
  const logGrow = overrides.log?.size?.grow ?? 1;
  const techScale = overrides.techBoard?.size?.scale ?? 0.86;
  const cardRowsScale = overrides.cardRows?.size?.scale ?? 0.86;
  const columnLayout = panelLayouts?.['waterfall-columns'];
  const mobileSections = mobilePreviewSections(overrides);

  return (
    <SettingsBlock title='Preview'>
      <div className='overflow-hidden rounded-[6px] border border-[color:var(--metal-edge)] bg-[oklch(0.08_0.018_260)] p-2'>
        <PreviewChrome label='TopBar' />
        <PreviewChrome label='ActionBar' />

        {mode === 'tab' ? (
          <div className='space-y-2 rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-surface-950/60 p-2'>
            <div className='flex gap-1 overflow-hidden'>
              {TAB_PREVIEW.map((tab, index) => (
                <span
                  key={tab}
                  className={cn(
                    'rounded-[3px] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em]',
                    index === 0
                      ? 'bg-accent-500/25 text-accent-200'
                      : 'bg-surface-800 text-text-500',
                  )}
                >
                  {tab}
                </span>
              ))}
            </div>
            <div className='grid min-h-[150px] grid-cols-[1fr_86px] gap-2'>
              <PreviewBlock label='Solar System' />
              <div className='space-y-2'>
                <PreviewBlock label='Player Board' compact />
                <PreviewBlock
                  label={`Log · ${logHeight} · grow ${logGrow}`}
                  compact
                />
              </div>
            </div>
          </div>
        ) : (
          <div className='grid min-h-[180px] grid-cols-[0.95fr_1.35fr_1fr] gap-2 rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-surface-950/60 p-2'>
            {WATERFALL_PREVIEW.map((column) => (
              <div key={column.slot} className='space-y-2'>
                <div className='truncate font-mono text-[9px] uppercase tracking-[0.12em] text-text-500'>
                  {column.label} ·{' '}
                  {columnLabel(
                    rootColumns,
                    column.slot,
                    columnLayout?.[column.slot]
                      ? `${Math.round(columnLayout[column.slot])}%`
                      : column.slot === 'left'
                        ? '380px'
                        : column.slot === 'middle'
                          ? '1fr'
                          : '420px',
                  )}
                </div>
                {column.sections.map((section) => (
                  <PreviewBlock
                    key={section.id}
                    label={
                      section.id === 'log'
                        ? `${section.label} · ${logHeight} · grow ${logGrow}`
                        : section.id === 'techBoard'
                          ? `${section.label} · scale ${techScale}`
                          : section.id === 'cardRows'
                            ? `${section.label} · scale ${cardRowsScale}`
                            : section.label
                    }
                    compact={section.id === 'endGame' || section.id === 'log'}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        <PreviewChrome label={`Hand · ${handHeight}`} />
      </div>

      <div className='rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-surface-950/60 p-2'>
        <div className='mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-text-500'>
          Mobile order
        </div>
        <div className='grid grid-cols-2 gap-1 sm:grid-cols-4'>
          {mobileSections.map((section) => (
            <div
              key={section.id}
              className='truncate rounded-[3px] border border-[color:var(--metal-edge-soft)] bg-surface-800/70 px-2 py-1 text-[10px] text-text-300'
              title={section.label}
            >
              {section.order}. {section.label}
            </div>
          ))}
        </div>
      </div>
    </SettingsBlock>
  );
}

function PreviewChrome({ label }: { label: string }): React.JSX.Element {
  return (
    <div className='mb-2 rounded-[3px] border border-accent-500/25 bg-accent-500/10 px-2 py-1 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-accent-200'>
      {label}
    </div>
  );
}

function PreviewBlock({
  label,
  compact = false,
}: {
  label: string;
  compact?: boolean;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-surface-800/70 p-2 text-center text-[10px] font-medium text-text-200',
        compact ? 'min-h-12' : 'min-h-20',
      )}
    >
      {label}
    </div>
  );
}

function SettingsBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className='rounded-[6px] border border-[color:var(--metal-edge-soft)] bg-surface-900/70 p-4'>
      <h3 className='micro-label mb-3 text-text-300'>{title}</h3>
      <div className='space-y-3'>{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className='space-y-1.5'>
      <Label className='text-xs text-text-500'>{label}</Label>
      {children}
    </div>
  );
}
