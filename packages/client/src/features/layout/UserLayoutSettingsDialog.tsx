import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

const MOBILE_SECTION_DEFINITIONS: Array<{
  id: SectionId;
  defaultLabel: string;
  i18nKey: string;
}> = [
  {
    id: 'playerBoard',
    defaultLabel: 'Player Board',
    i18nKey: 'client.layout_v2.dialogs.section_player_board',
  },
  {
    id: 'solarSystem',
    defaultLabel: 'Solar System',
    i18nKey: 'client.layout_v2.dialogs.section_solar_system',
  },
  {
    id: 'planetBoard',
    defaultLabel: 'Planet Board',
    i18nKey: 'client.layout_v2.dialogs.section_planet_board',
  },
  {
    id: 'techBoard',
    defaultLabel: 'Tech Board',
    i18nKey: 'client.layout_v2.dialogs.section_tech_board',
  },
  {
    id: 'alienBoard',
    defaultLabel: 'Alien Board',
    i18nKey: 'client.layout_v2.dialogs.section_alien_board',
  },
  {
    id: 'cardRows',
    defaultLabel: 'Card Rows',
    i18nKey: 'client.layout_v2.dialogs.section_card_rows',
  },
  {
    id: 'log',
    defaultLabel: 'Log',
    i18nKey: 'client.layout_v2.dialogs.section_log',
  },
  {
    id: 'endGame',
    defaultLabel: 'End Game',
    i18nKey: 'client.layout_v2.dialogs.section_end_game',
  },
];

const WATERFALL_PREVIEW_DEFINITION: Array<{
  slot: 'left' | 'middle' | 'right';
  i18nKey: string;
  defaultLabel: string;
  sectionIds: SectionId[];
}> = [
  {
    slot: 'left',
    i18nKey: 'client.layout_v2.dialogs.preview_left',
    defaultLabel: 'Left',
    sectionIds: ['solarSystem', 'planetBoard', 'endGame'],
  },
  {
    slot: 'middle',
    i18nKey: 'client.layout_v2.dialogs.preview_middle',
    defaultLabel: 'Middle',
    sectionIds: ['techBoard', 'alienBoard', 'cardRows'],
  },
  {
    slot: 'right',
    i18nKey: 'client.layout_v2.dialogs.preview_right',
    defaultLabel: 'Right',
    sectionIds: ['playerBoard', 'log'],
  },
];

const TAB_PREVIEW_DEFINITION: Array<{ id: string; defaultLabel: string }> = [
  { id: 'board', defaultLabel: 'Board' },
  { id: 'planets', defaultLabel: 'Planets' },
  { id: 'tech', defaultLabel: 'Tech' },
  { id: 'cards', defaultLabel: 'Cards' },
  { id: 'aliens', defaultLabel: 'Aliens' },
  { id: 'scoring', defaultLabel: 'Scoring' },
];
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
  sectionLabels: Record<SectionId, string>,
): Array<{ id: SectionId; label: string; order: number }> {
  return MOBILE_SECTION_DEFINITIONS.map((section, index) => ({
    id: section.id,
    label: sectionLabels[section.id],
    order: overrides[section.id]?.mobileOrder ?? index + 1,
  })).sort((a, b) => a.order - b.order);
}

export function UserLayoutSettingsDialog({
  open,
  onOpenChange,
}: IUserLayoutSettingsDialogProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mode = useLayoutStore((s) => s.mode);
  const overrides = useLayoutStore((s) => s.overrides);
  const collapsed = useLayoutStore((s) => s.collapsed);
  const rootColumns = useLayoutStore((s) => s.rootColumns);
  const tabColumns = useLayoutStore((s) => s.tabColumns);
  const panelLayouts = useLayoutStore((s) => s.panelLayouts);
  const setMode = useLayoutStore((s) => s.setMode);
  const setPanelLayout = useLayoutStore((s) => s.setPanelLayout);
  const patchSection = useLayoutStore((s) => s.patchSection);
  const importSnapshot = useLayoutStore((s) => s.importSnapshot);
  const exportSnapshot = useLayoutStore((s) => s.exportSnapshot);
  const resetAll = useLayoutStore((s) => s.resetAll);

  const sectionLabels = useMemo<Record<SectionId, string>>(() => {
    const acc = {} as Record<SectionId, string>;
    for (const def of MOBILE_SECTION_DEFINITIONS) {
      acc[def.id] = t(def.i18nKey, { defaultValue: def.defaultLabel });
    }
    return acc;
  }, [t]);

  const snapshot = useMemo<LayoutSnapshot>(
    () => ({
      mode,
      overrides,
      collapsed,
      rootColumns,
      tabColumns,
      panelLayouts,
    }),
    [mode, overrides, collapsed, rootColumns, tabColumns, panelLayouts],
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
    link.download = 'mission-display.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const applyJson = (source: string): void => {
    try {
      const parsed = JSON.parse(source) as unknown;
      importSnapshot(coerceSettings(parsed));
      setJsonDraft(JSON.stringify(coerceSettings(parsed), null, 2));
      toast({
        title: t('client.layout_v2.dialogs.toast_imported', {
          defaultValue: 'Layout settings imported',
        }),
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: t('client.layout_v2.dialogs.toast_invalid_json', {
          defaultValue: 'Invalid display file',
        }),
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
      <DialogContent className='mx-auto max-h-[88vh] w-full max-w-5xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {t('client.layout_v2.dialogs.settings_title', {
              defaultValue: 'Mission Display',
            })}
          </DialogTitle>
          <DialogDescription>
            {t('client.layout_v2.dialogs.settings_description', {
              defaultValue:
                'Choose how the game table is arranged. Changes are saved on this device.',
            })}
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 lg:grid-cols-[1fr_1fr]'>
          <section className='space-y-4'>
            <SettingsBlock
              title={t('client.layout_v2.dialogs.mode_block', {
                defaultValue: 'Current Display',
              })}
            >
              <Field
                label={t('client.layout_v2.dialogs.default_layout_mode', {
                  defaultValue: 'Table Layout',
                })}
              >
                <div className='grid grid-cols-2 gap-2'>
                  <Button
                    variant={mode === 'tab' ? 'primary' : 'ghost'}
                    onClick={() => setMode('tab')}
                  >
                    {t('client.layout_v2.shell.tab', { defaultValue: 'Tab' })}
                  </Button>
                  <Button
                    variant={mode === 'waterfall' ? 'primary' : 'ghost'}
                    onClick={() => setMode('waterfall')}
                  >
                    {t('client.layout_v2.shell.waterfall', {
                      defaultValue: 'Waterfall',
                    })}
                  </Button>
                </div>
              </Field>
            </SettingsBlock>

            <LayoutPreview
              mode={mode}
              rootColumns={rootColumns}
              panelLayouts={panelLayouts}
              overrides={overrides}
              sectionLabels={sectionLabels}
            />

            <SettingsBlock
              title={t('client.layout_v2.dialogs.waterfall_columns_block', {
                defaultValue: 'Column Widths',
              })}
            >
              <div className='grid gap-3 sm:grid-cols-3'>
                <Field
                  label={t('client.layout_v2.dialogs.field_left_pct', {
                    defaultValue: 'Left %',
                  })}
                >
                  <Input
                    value={toNumberValue(waterfallColumns.left)}
                    placeholder='44'
                    onChange={(e) =>
                      updateWaterfallColumn('left', e.target.value)
                    }
                    mono
                  />
                </Field>
                <Field
                  label={t('client.layout_v2.dialogs.field_middle_pct', {
                    defaultValue: 'Middle %',
                  })}
                >
                  <Input
                    value={toNumberValue(waterfallColumns.middle)}
                    placeholder='33'
                    onChange={(e) =>
                      updateWaterfallColumn('middle', e.target.value)
                    }
                    mono
                  />
                </Field>
                <Field
                  label={t('client.layout_v2.dialogs.field_right_pct', {
                    defaultValue: 'Right %',
                  })}
                >
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
                {t('client.layout_v2.dialogs.column_widths_hint', {
                  defaultValue:
                    'These values also update when you drag column handles in game.',
                })}
              </p>
            </SettingsBlock>

            <SettingsBlock
              title={t('client.layout_v2.dialogs.pinned_areas_block', {
                defaultValue: 'Pinned Areas',
              })}
            >
              <div className='grid gap-3 sm:grid-cols-2'>
                <Field
                  label={t('client.layout_v2.dialogs.field_hand_height', {
                    defaultValue: 'Hand Height',
                  })}
                >
                  <Input
                    value={overrides.hand?.size?.height ?? ''}
                    placeholder='112px'
                    onChange={(e) =>
                      updateSectionSize('hand', 'height', e.target.value)
                    }
                    mono
                  />
                </Field>
                <Field
                  label={t('client.layout_v2.dialogs.field_log_height', {
                    defaultValue: 'Log Height',
                  })}
                >
                  <Input
                    value={overrides.log?.size?.height ?? ''}
                    placeholder='240px'
                    onChange={(e) =>
                      updateSectionSize('log', 'height', e.target.value)
                    }
                    mono
                  />
                </Field>
                <Field
                  label={t('client.layout_v2.dialogs.field_log_min_height', {
                    defaultValue: 'Log Min Height',
                  })}
                >
                  <Input
                    value={overrides.log?.size?.minH ?? ''}
                    placeholder='180px'
                    onChange={(e) =>
                      updateSectionSize('log', 'minH', e.target.value)
                    }
                    mono
                  />
                </Field>
                <Field
                  label={t('client.layout_v2.dialogs.field_log_grow', {
                    defaultValue: 'Log Grow',
                  })}
                >
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

            <SettingsBlock
              title={t('client.layout_v2.dialogs.board_scale_block', {
                defaultValue: 'Board Scale',
              })}
            >
              <div className='grid gap-3 sm:grid-cols-2'>
                <Field
                  label={t('client.layout_v2.dialogs.field_tech_board_scale', {
                    defaultValue: 'Tech Board Scale',
                  })}
                >
                  <Input
                    value={toNumberValue(overrides.techBoard?.size?.scale)}
                    placeholder='0.86'
                    onChange={(e) =>
                      updateSectionScale('techBoard', e.target.value)
                    }
                    mono
                  />
                </Field>
                <Field
                  label={t('client.layout_v2.dialogs.field_card_rows_scale', {
                    defaultValue: 'Card Rows Scale',
                  })}
                >
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

            <SettingsBlock
              title={t('client.layout_v2.dialogs.mobile_order_block', {
                defaultValue: 'Mobile Order',
              })}
            >
              <div className='grid gap-2 sm:grid-cols-2'>
                {MOBILE_SECTION_DEFINITIONS.map((section) => (
                  <Field key={section.id} label={sectionLabels[section.id]}>
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
            <details className='group rounded-[6px] border border-[color:var(--metal-edge-soft)] bg-[var(--surface-instrument)]/60 p-4 shadow-hairline-inset'>
              <summary className='cursor-pointer list-none'>
                <span className='micro-label text-text-300'>
                  {t('client.layout_v2.dialogs.json_block', {
                    defaultValue: 'Advanced Layout File',
                  })}
                </span>
                <p className='mt-2 text-xs leading-relaxed text-text-500'>
                  {t('client.layout_v2.dialogs.json_hint', {
                    defaultValue:
                      'Import or export the saved display file for another device.',
                  })}
                </p>
              </summary>
              <div className='mt-4 space-y-3'>
                <textarea
                  value={jsonDraft}
                  onChange={(e) => setJsonDraft(e.target.value)}
                  className={cn(
                    'min-h-[420px] w-full rounded-[5px] px-3 py-2 font-mono text-xs',
                    'border border-[color:var(--metal-edge)] bg-[var(--surface-instrument)]',
                    'text-text-100 shadow-hairline-inset focus:border-accent-500 focus:outline-none',
                  )}
                  spellCheck={false}
                />
                <div className='flex flex-wrap gap-2'>
                  <Button size='sm' onClick={() => applyJson(jsonDraft)}>
                    {t('client.layout_v2.dialogs.apply_json', {
                      defaultValue: 'Apply Display File',
                    })}
                  </Button>
                  <Button size='sm' variant='ghost' onClick={refreshJson}>
                    {t('client.layout_v2.dialogs.refresh_json', {
                      defaultValue: 'Refresh File',
                    })}
                  </Button>
                  <Button size='sm' variant='ghost' onClick={handleExport}>
                    {t('client.layout_v2.dialogs.export_json', {
                      defaultValue: 'Export Display File',
                    })}
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t('client.layout_v2.dialogs.import_json', {
                      defaultValue: 'Import Display File',
                    })}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='application/json,.json'
                    className='hidden'
                    onChange={(e) => handleImportFile(e.target.files?.[0])}
                  />
                </div>
              </div>
            </details>
          </section>
        </div>

        <DialogFooter>
          <p className='mr-auto self-center text-xs text-text-500'>
            {t('client.layout_v2.dialogs.saved_hint', {
              defaultValue: 'Saved automatically on this device.',
            })}
          </p>
          <Button variant='ghost' onClick={resetAll}>
            {t('client.layout_v2.dialogs.reset_layout', {
              defaultValue: 'Reset Display',
            })}
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            {t('client.layout_v2.dialogs.done', { defaultValue: 'Done' })}
          </Button>
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
  sectionLabels,
}: {
  mode: LayoutMode;
  rootColumns: LayoutSnapshot['rootColumns'];
  panelLayouts: LayoutSnapshot['panelLayouts'];
  overrides: LayoutSnapshot['overrides'];
  sectionLabels: Record<SectionId, string>;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  const handHeight = overrides.hand?.size?.height || '120px';
  const logHeight = overrides.log?.size?.height || 'auto';
  const logGrow = overrides.log?.size?.grow ?? 1;
  const techScale = overrides.techBoard?.size?.scale ?? 0.86;
  const cardRowsScale = overrides.cardRows?.size?.scale ?? 0.86;
  const columnLayout = panelLayouts?.['waterfall-columns'];
  const mobileSections = mobilePreviewSections(overrides, sectionLabels);

  return (
    <SettingsBlock
      title={t('client.layout_v2.dialogs.preview_block', {
        defaultValue: 'Preview',
      })}
    >
      <div className='overflow-hidden rounded-[6px] border border-[color:var(--metal-edge)] bg-[oklch(0.08_0.018_260)] p-2'>
        <PreviewChrome
          label={t('client.layout_v2.dialogs.preview_topbar', {
            defaultValue: 'TopBar',
          })}
        />
        <PreviewChrome
          label={t('client.layout_v2.dialogs.preview_actionbar', {
            defaultValue: 'ActionBar',
          })}
        />

        {mode === 'tab' ? (
          <div className='space-y-2 rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-surface-950/60 p-2'>
            <div className='flex gap-1 overflow-hidden'>
              {TAB_PREVIEW_DEFINITION.map((tab, index) => (
                <span
                  key={tab.id}
                  className={cn(
                    'rounded-[3px] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em]',
                    index === 0
                      ? 'bg-accent-500/25 text-accent-200'
                      : 'bg-surface-800 text-text-500',
                  )}
                >
                  {t(`client.game_layout.tabs.${tab.id}`, {
                    defaultValue: tab.defaultLabel,
                  })}
                </span>
              ))}
            </div>
            <div className='grid min-h-[150px] grid-cols-[1fr_86px] gap-2'>
              <PreviewBlock label={sectionLabels.solarSystem} />
              <div className='space-y-2'>
                <PreviewBlock label={sectionLabels.playerBoard} compact />
                <PreviewBlock
                  label={`${sectionLabels.log} · ${logHeight} · grow ${logGrow}`}
                  compact
                />
              </div>
            </div>
          </div>
        ) : (
          <div className='grid min-h-[180px] grid-cols-[0.95fr_1.35fr_1fr] gap-2 rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-surface-950/60 p-2'>
            {WATERFALL_PREVIEW_DEFINITION.map((column) => (
              <div key={column.slot} className='space-y-2'>
                <div className='truncate font-mono text-[9px] uppercase tracking-[0.12em] text-text-500'>
                  {t(column.i18nKey, { defaultValue: column.defaultLabel })} ·{' '}
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
                {column.sectionIds.map((sectionId) => {
                  const baseLabel = sectionLabels[sectionId];
                  const label =
                    sectionId === 'log'
                      ? `${baseLabel} · ${logHeight} · grow ${logGrow}`
                      : sectionId === 'techBoard'
                        ? `${baseLabel} · scale ${techScale}`
                        : sectionId === 'cardRows'
                          ? `${baseLabel} · scale ${cardRowsScale}`
                          : baseLabel;
                  return (
                    <PreviewBlock
                      key={sectionId}
                      label={label}
                      compact={sectionId === 'endGame' || sectionId === 'log'}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )}

        <PreviewChrome
          label={`${t('client.layout_v2.dialogs.preview_hand', {
            defaultValue: 'Hand',
          })} · ${handHeight}`}
        />
      </div>

      <div className='rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-surface-950/60 p-2'>
        <div className='mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-text-500'>
          {t('client.layout_v2.dialogs.preview_mobile_order_label', {
            defaultValue: 'Mobile order',
          })}
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
    <div className='rounded-[6px] border border-[color:var(--metal-edge-soft)] bg-[var(--surface-panel)]/72 p-4 shadow-hairline-inset'>
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
