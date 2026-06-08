import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { debugApi } from '@/api/debugApi';
import type {
  IDebugReplayPresetDefinition,
  IDebugReplaySessionResponse,
  IDebugSnapshotSessionResponse,
} from '@/api/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GameContextProvider, useGameContext } from '@/pages/game/GameContext';
import { GameLayout } from '@/pages/game/GameLayout';
import type { IAuthUser } from '@/stores/authStore';
import { useAuthStore } from '@/stores/authStore';
import { useGameViewStore } from '@/stores/gameViewStore';
import { GAME_Z_INDEX } from '@/styles/zIndex';

interface IAuthSnapshot {
  token: string | null;
  user: IAuthUser | null;
  isAuthenticated: boolean;
}

export interface IDebugSnapshotVersionParseResult {
  version?: number;
  errorMessage?: string;
}

export function parseDebugSnapshotVersionInput(
  rawVersion: string,
): IDebugSnapshotVersionParseResult {
  const trimmed = rawVersion.trim();
  if (!trimmed) {
    return { version: undefined };
  }

  const version = Number(trimmed);
  if (!Number.isInteger(version) || version <= 0) {
    return {
      errorMessage:
        'Snapshot version must be a positive whole number greater than 0.',
    };
  }

  return { version };
}

function getInitialReplayFieldValue(
  field: IDebugReplayPresetDefinition['fields'][number],
): string {
  if (field.kind === 'select') {
    return field.options[0]?.value ?? '';
  }

  return field.defaultValue ?? '';
}

function DebugReplayGameContent(): React.JSX.Element {
  const { t } = useTranslation('common');
  const { isConnected, gameState } = useGameContext();
  const setActiveTab = useGameViewStore((state) => state.setActiveTab);

  useEffect(() => {
    setActiveTab('board');
  }, [setActiveTab]);

  if (!isConnected || !gameState) {
    return (
      <div className='flex h-screen flex-col items-center justify-center gap-4 bg-[var(--surface-void)]'>
        <LoadingSpinner />
        <p className='text-sm text-text-500'>
          {t('client.debug.replay.connecting', {
            defaultValue: 'Connecting to replay session...',
          })}
        </p>
      </div>
    );
  }

  return <GameLayout />;
}

type TReplayLanguage = 'en' | 'zh-CN' | 'pt-BR';

function resolveReplayLanguage(
  rawLanguage: string | undefined,
): TReplayLanguage {
  const normalized = (rawLanguage ?? 'en').toLowerCase();
  if (normalized.startsWith('zh')) return 'zh-CN';
  if (normalized.startsWith('pt')) return 'pt-BR';
  return 'en';
}

export function DebugReplayPage(): React.JSX.Element {
  const { t, i18n } = useTranslation('common');
  const [presets, setPresets] = useState<IDebugReplayPresetDefinition[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [selectedCheckpointId, setSelectedCheckpointId] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [session, setSession] = useState<IDebugReplaySessionResponse | null>(
    null,
  );
  const [snapshotSession, setSnapshotSession] =
    useState<IDebugSnapshotSessionResponse | null>(null);
  const [snapshotGameId, setSnapshotGameId] = useState('');
  const [snapshotVersion, setSnapshotVersion] = useState('');
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const authSnapshotRef = useRef<IAuthSnapshot | null>(null);

  const selectedPreset = useMemo(
    () => presets.find((preset) => preset.id === selectedPresetId) ?? null,
    [presets, selectedPresetId],
  );

  const initializeSelections = useCallback(
    (nextPresets: IDebugReplayPresetDefinition[]) => {
      const firstPreset = nextPresets[0];
      if (!firstPreset) {
        setSelectedPresetId('');
        setSelectedCheckpointId('');
        setFieldValues({});
        return;
      }

      setSelectedPresetId(firstPreset.id);
      setSelectedCheckpointId(firstPreset.checkpoints[0]?.id ?? '');
      setFieldValues(
        firstPreset.fields.reduce<Record<string, string>>(
          (accumulator, field) => {
            accumulator[field.id] = getInitialReplayFieldValue(field);
            return accumulator;
          },
          {},
        ),
      );
    },
    [],
  );

  const loadPresets = useCallback(async () => {
    setIsLoadingPresets(true);
    setErrorMessage(null);
    try {
      const nextPresets = await debugApi.getReplayPresets();
      setPresets(nextPresets);
      initializeSelections(nextPresets);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t('client.debug.replay.load_presets_failed', {
              defaultValue: 'Failed to load replay presets',
            }),
      );
    } finally {
      setIsLoadingPresets(false);
    }
  }, [initializeSelections, t]);

  useEffect(() => {
    void loadPresets();
  }, [loadPresets]);

  useEffect(() => {
    return () => {
      const authSnapshot = authSnapshotRef.current;
      if (!authSnapshot) {
        return;
      }

      if (
        authSnapshot.token &&
        authSnapshot.user &&
        authSnapshot.isAuthenticated
      ) {
        useAuthStore.getState().login(authSnapshot.token, authSnapshot.user);
      } else {
        useAuthStore.getState().logout();
      }
    };
  }, []);

  const updatePreset = useCallback(
    (presetId: string) => {
      const nextPreset = presets.find((preset) => preset.id === presetId);
      if (!nextPreset) {
        return;
      }

      setSelectedPresetId(nextPreset.id);
      setSelectedCheckpointId(nextPreset.checkpoints[0]?.id ?? '');
      setFieldValues(
        nextPreset.fields.reduce<Record<string, string>>(
          (accumulator, field) => {
            accumulator[field.id] = getInitialReplayFieldValue(field);
            return accumulator;
          },
          {},
        ),
      );
    },
    [presets],
  );

  const startReplay = useCallback(async () => {
    if (!selectedPreset || !selectedCheckpointId) {
      return;
    }

    if (!authSnapshotRef.current) {
      const authState = useAuthStore.getState();
      authSnapshotRef.current = {
        token: authState.token,
        user: authState.user,
        isAuthenticated: authState.isAuthenticated,
      };
    }

    setIsCreating(true);
    setErrorMessage(null);
    try {
      const nextSession = await debugApi.createReplaySession({
        presetId: selectedPreset.id,
        checkpointId: selectedCheckpointId,
        fieldValues,
      });
      useAuthStore
        .getState()
        .login(nextSession.accessToken, nextSession.user as IAuthUser);
      setSession(nextSession);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t('client.debug.replay.create_session_failed', {
              defaultValue: 'Failed to create replay session',
            }),
      );
    } finally {
      setIsCreating(false);
    }
  }, [fieldValues, selectedCheckpointId, selectedPreset, t]);

  const loadSnapshot = useCallback(async () => {
    if (!snapshotGameId.trim()) {
      return;
    }

    const parsedVersion = parseDebugSnapshotVersionInput(snapshotVersion);
    if (parsedVersion.errorMessage) {
      setErrorMessage(parsedVersion.errorMessage);
      return;
    }

    if (!authSnapshotRef.current) {
      const authState = useAuthStore.getState();
      authSnapshotRef.current = {
        token: authState.token,
        user: authState.user,
        isAuthenticated: authState.isAuthenticated,
      };
    }

    setIsLoadingSnapshot(true);
    setErrorMessage(null);
    try {
      const nextSession = await debugApi.createSnapshotSession({
        gameId: snapshotGameId.trim(),
        version: parsedVersion.version,
      });
      useAuthStore
        .getState()
        .login(nextSession.accessToken, nextSession.user as IAuthUser);
      setSnapshotSession(nextSession);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t('client.debug.replay.load_snapshot_failed', {
              defaultValue: 'Failed to load snapshot session',
            }),
      );
    } finally {
      setIsLoadingSnapshot(false);
    }
  }, [snapshotGameId, snapshotVersion, t]);

  if (snapshotSession) {
    return (
      <>
        <ReplayBanner
          kind='Snapshot'
          primaryLabel={`R${snapshotSession.round} · ${snapshotSession.phase}`}
          secondaryLabel={t('client.debug.replay.banner.source_label', {
            defaultValue: 'src: {{id}}',
            id: snapshotSession.sourceGameId.slice(0, 8),
          })}
          onDismiss={() => setSnapshotSession(null)}
        />
        <GameContextProvider
          key={snapshotSession.gameId}
          gameId={snapshotSession.gameId}
        >
          <DebugReplayGameContent />
        </GameContextProvider>
      </>
    );
  }

  if (session) {
    return (
      <>
        <ReplayBanner
          kind='Replay'
          primaryLabel={session.replay.presetId}
          secondaryLabel={session.replay.checkpointId}
          onDismiss={() => setSession(null)}
        />
        <GameContextProvider key={session.gameId} gameId={session.gameId}>
          <DebugReplayGameContent />
        </GameContextProvider>
      </>
    );
  }

  return (
    <div className='relative flex min-h-screen items-center justify-center bg-[var(--surface-void)] px-6 py-10'>
      <div
        className='pointer-events-none fixed inset-0 -z-10 bg-[image:var(--bg-atmosphere)] bg-cover bg-center'
        aria-hidden
      />
      {/*
        Replay picker only needs the language switch — text-mode and
        hotspots aren't relevant here (no live game art is visible).
      */}
      <div
        className='fixed right-3 top-3 rounded-[5px] border border-[color:var(--metal-edge)] bg-[var(--surface-raised)]/95 p-1.5 shadow-instrument backdrop-blur'
        style={{ zIndex: GAME_Z_INDEX.popover }}
      >
        <Select
          value={resolveReplayLanguage(i18n.resolvedLanguage ?? i18n.language)}
          onValueChange={(value) => {
            void i18n.changeLanguage(resolveReplayLanguage(value));
          }}
        >
          <SelectTrigger
            className='h-8 w-[120px] text-xs'
            aria-label={t('home.language')}
            data-testid='debug-replay-language-select'
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
      <div className='w-full max-w-xl rounded-[6px] border border-[color:var(--metal-edge)] bg-[var(--surface-panel)]/95 p-6 shadow-instrument'>
        <div className='mb-6 space-y-2'>
          <span className='micro-label inline-flex items-center gap-2 text-[oklch(0.78_0.10_240)]'>
            <span className='h-px w-6 bg-[var(--signal-blue)]' />
            {t('client.debug.replay.kicker', {
              defaultValue: 'Calibration · Replay',
            })}
          </span>
          <h1 className='font-display text-2xl font-semibold tracking-[0.06em] text-text-100'>
            {t('client.debug.replay.title', {
              defaultValue: 'Replay presets with checkpoint resume',
            })}
          </h1>
          <p className='text-sm text-text-500'>
            {t('client.debug.replay.subtitle', {
              defaultValue:
                'Stage a real debug session from a reusable preset, then re-engage through the live mission console.',
            })}
          </p>
        </div>

        {isLoadingPresets ? (
          <div className='flex items-center gap-3 rounded-[5px] border border-[color:var(--metal-edge-soft)] bg-[var(--surface-instrument)]/70 px-4 py-5'>
            <LoadingSpinner />
            <p className='text-sm text-text-400'>
              {t('client.debug.replay.loading_presets', {
                defaultValue: 'Loading replay presets...',
              })}
            </p>
          </div>
        ) : selectedPreset ? (
          <div className='space-y-4'>
            <div className='space-y-2'>
              <label className='text-sm text-text-300'>
                {t('client.debug.replay.preset_label', {
                  defaultValue: 'Preset',
                })}
              </label>
              <Select value={selectedPresetId} onValueChange={updatePreset}>
                <SelectTrigger data-testid='debug-replay-preset'>
                  <SelectValue
                    placeholder={t('client.debug.replay.preset_placeholder', {
                      defaultValue: 'Select replay preset',
                    })}
                  />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-text-500'>
                {selectedPreset.description}
              </p>
            </div>

            <div className='space-y-2'>
              <label className='text-sm text-text-300'>
                {t('client.debug.replay.checkpoint_label', {
                  defaultValue: 'Checkpoint',
                })}
              </label>
              <Select
                value={selectedCheckpointId}
                onValueChange={setSelectedCheckpointId}
              >
                <SelectTrigger data-testid='debug-replay-checkpoint'>
                  <SelectValue
                    placeholder={t(
                      'client.debug.replay.checkpoint_placeholder',
                      {
                        defaultValue: 'Select checkpoint',
                      },
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {selectedPreset.checkpoints.map((checkpoint) => (
                    <SelectItem key={checkpoint.id} value={checkpoint.id}>
                      {checkpoint.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-text-500'>
                {selectedPreset.checkpoints.find(
                  (checkpoint) => checkpoint.id === selectedCheckpointId,
                )?.description ??
                  t('client.debug.replay.checkpoint_default_hint', {
                    defaultValue: 'Choose where the replay should stop.',
                  })}
              </p>
            </div>

            {selectedPreset.fields.map((field) => (
              <div key={field.id} className='space-y-2'>
                <label className='text-sm text-text-300'>{field.label}</label>
                {field.kind === 'select' ? (
                  <Select
                    value={fieldValues[field.id] ?? ''}
                    onValueChange={(value) =>
                      setFieldValues((current) => ({
                        ...current,
                        [field.id]: value,
                      }))
                    }
                  >
                    <SelectTrigger
                      data-testid={`debug-replay-field-${field.id}`}
                    >
                      <SelectValue
                        placeholder={t(
                          'client.debug.replay.field_select_placeholder',
                          {
                            defaultValue: 'Select {{label}}',
                            label: field.label,
                          },
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          disabled={option.disabled}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={fieldValues[field.id] ?? ''}
                    onChange={(event) =>
                      setFieldValues((current) => ({
                        ...current,
                        [field.id]: event.target.value,
                      }))
                    }
                    placeholder={field.placeholder ?? field.label}
                    type={field.kind === 'number' ? 'number' : 'text'}
                    data-testid={`debug-replay-field-${field.id}`}
                  />
                )}
              </div>
            ))}

            {errorMessage ? (
              <div className='relative rounded-[5px] border border-[color:var(--metal-edge-soft)] bg-[var(--surface-instrument)]/80 px-3 py-2 text-sm text-[var(--signal-red-hi)]'>
                <span
                  aria-hidden
                  className='pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[var(--signal-red)] opacity-60'
                />
                <span className='micro-label mr-2 text-[var(--signal-red-hi)]'>
                  {t('client.debug.replay.anomaly_label', {
                    defaultValue: 'Anomaly',
                  })}
                </span>
                {errorMessage}
              </div>
            ) : null}

            <div className='flex items-center justify-between gap-3 pt-2'>
              <Button variant='ghost' onClick={() => void loadPresets()}>
                {t('client.debug.replay.refresh_presets', {
                  defaultValue: 'Refresh presets',
                })}
              </Button>
              <Button
                onClick={() => void startReplay()}
                disabled={isCreating}
                data-testid='debug-replay-start'
              >
                {isCreating
                  ? t('client.debug.replay.starting', {
                      defaultValue: 'Starting...',
                    })
                  : t('client.debug.replay.start_replay', {
                      defaultValue: 'Start Replay',
                    })}
              </Button>
            </div>
          </div>
        ) : (
          <div className='rounded-[5px] border border-[color:var(--metal-edge-soft)] bg-[var(--surface-instrument)]/70 px-4 py-5 text-sm text-text-500'>
            {t('client.debug.replay.no_presets', {
              defaultValue: 'No replay presets available.',
            })}
          </div>
        )}

        <div className='mt-6 border-t border-[color:var(--metal-edge-soft)] pt-6'>
          <div className='mb-4 space-y-2'>
            <span className='micro-label inline-flex items-center gap-2 text-[oklch(0.78_0.10_240)]'>
              <span className='h-px w-5 bg-[var(--signal-blue)]' />
              {t('client.debug.replay.snapshot_kicker', {
                defaultValue: 'Snapshot · Resume',
              })}
            </span>
            <p className='text-sm text-text-500'>
              {t('client.debug.replay.snapshot_subtitle', {
                defaultValue:
                  'Re-engage from a stored snapshot by entering its game ID.',
              })}
            </p>
          </div>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <label className='text-sm text-text-300'>
                {t('client.debug.replay.game_id_label', {
                  defaultValue: 'Game ID',
                })}
              </label>
              <Input
                value={snapshotGameId}
                onChange={(e) => setSnapshotGameId(e.target.value)}
                placeholder={t('client.debug.replay.game_id_placeholder', {
                  defaultValue: 'Enter game UUID',
                })}
                data-testid='debug-snapshot-game-id'
              />
            </div>

            <div className='space-y-2'>
              <label className='text-sm text-text-300'>
                {t('client.debug.replay.version_label', {
                  defaultValue: 'Version (optional, latest if empty)',
                })}
              </label>
              <Input
                value={snapshotVersion}
                onChange={(e) => setSnapshotVersion(e.target.value)}
                placeholder={t('client.debug.replay.version_placeholder', {
                  defaultValue: 'e.g. 5',
                })}
                type='text'
                inputMode='numeric'
                data-testid='debug-snapshot-version'
              />
            </div>

            <div className='flex items-center justify-end pt-2'>
              <Button
                onClick={() => void loadSnapshot()}
                disabled={isLoadingSnapshot || !snapshotGameId.trim()}
                data-testid='debug-snapshot-start'
              >
                {isLoadingSnapshot
                  ? t('client.debug.replay.loading_snapshot', {
                      defaultValue: 'Loading...',
                    })
                  : t('client.debug.replay.load_snapshot', {
                      defaultValue: 'Load Snapshot',
                    })}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface IReplayBannerProps {
  kind: 'Replay' | 'Snapshot';
  primaryLabel: string;
  secondaryLabel: string;
  onDismiss: () => void;
}

/**
 * Floating debug-session banner. Sits below the in-game TopBar so it never
 * occludes the language / text-mode controls. Collapses to a small kind-tag
 * pill when the player wants the corner reclaimed; click again to expand.
 */
function ReplayBanner({
  kind,
  primaryLabel,
  secondaryLabel,
  onDismiss,
}: IReplayBannerProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const [collapsed, setCollapsed] = useState(false);
  const kindLabel =
    kind === 'Snapshot'
      ? t('client.debug.replay.banner.kind_snapshot', {
          defaultValue: 'Snapshot',
        })
      : t('client.debug.replay.banner.kind_replay', { defaultValue: 'Replay' });

  if (collapsed) {
    return (
      <button
        type='button'
        onClick={() => setCollapsed(false)}
        className='fixed right-3 top-14 inline-flex items-center gap-1 rounded-[4px] border border-[color:var(--metal-edge)] bg-[var(--surface-raised)]/95 px-2 py-1 font-mono text-[10px] uppercase tracking-microlabel text-text-300 backdrop-blur transition-colors hover:text-text-100'
        style={{ zIndex: GAME_Z_INDEX.popover }}
        aria-label={t('client.debug.replay.banner.expand_aria', {
          defaultValue: 'Expand {{kind}} banner',
          kind: kind.toLowerCase(),
        })}
        data-testid='replay-banner-collapsed'
      >
        {kindLabel}
        <span aria-hidden className='text-text-500'>
          ›
        </span>
      </button>
    );
  }

  return (
    <div
      className='fixed right-3 top-14 flex items-center gap-2 rounded-[5px] border border-[color:var(--metal-edge)] bg-[var(--surface-raised)]/95 p-2 text-xs backdrop-blur'
      data-testid='replay-banner'
      style={{ zIndex: GAME_Z_INDEX.popover }}
    >
      <span className='font-mono text-text-500'>{kindLabel}</span>
      <span className='font-mono text-text-300'>{primaryLabel}</span>
      <span className='font-mono text-[10px] text-text-500'>
        {secondaryLabel}
      </span>
      <Button
        size='sm'
        variant='ghost'
        onClick={() => setCollapsed(true)}
        className='h-7 px-1.5'
        aria-label={t('client.debug.replay.banner.collapse_aria', {
          defaultValue: 'Collapse banner',
        })}
      >
        <span aria-hidden>‹</span>
      </Button>
      <Button size='sm' variant='ghost' onClick={onDismiss} className='h-7'>
        {t('client.debug.replay.banner.new_replay', {
          defaultValue: 'New Replay',
        })}
      </Button>
    </div>
  );
}
