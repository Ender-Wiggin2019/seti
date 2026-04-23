import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { debugApi } from '@/api/debugApi';
import type {
  IDebugReplayPresetDefinition,
  IDebugReplaySessionResponse,
} from '@/api/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
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

interface IAuthSnapshot {
  token: string | null;
  user: IAuthUser | null;
  isAuthenticated: boolean;
}

function DebugReplayGameContent(): React.JSX.Element {
  const { isConnected, gameState } = useGameContext();
  const setActiveTab = useGameViewStore((state) => state.setActiveTab);

  useEffect(() => {
    setActiveTab('board');
  }, [setActiveTab]);

  if (!isConnected || !gameState) {
    return (
      <div className='flex h-screen flex-col items-center justify-center gap-4 bg-background-950'>
        <LoadingSpinner />
        <p className='text-sm text-text-500'>Connecting to replay session...</p>
      </div>
    );
  }

  return <GameLayout />;
}

export function DebugReplayPage(): React.JSX.Element {
  const [presets, setPresets] = useState<IDebugReplayPresetDefinition[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [selectedCheckpointId, setSelectedCheckpointId] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [session, setSession] = useState<IDebugReplaySessionResponse | null>(
    null,
  );
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
        firstPreset.fields.reduce<Record<string, string>>((accumulator, field) => {
          accumulator[field.id] = field.options[0]?.value ?? '';
          return accumulator;
        }, {}),
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
        error instanceof Error ? error.message : 'Failed to load replay presets',
      );
    } finally {
      setIsLoadingPresets(false);
    }
  }, [initializeSelections]);

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
        nextPreset.fields.reduce<Record<string, string>>((accumulator, field) => {
          accumulator[field.id] = field.options[0]?.value ?? '';
          return accumulator;
        }, {}),
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
        error instanceof Error ? error.message : 'Failed to create replay session',
      );
    } finally {
      setIsCreating(false);
    }
  }, [fieldValues, selectedCheckpointId, selectedPreset]);

  if (session) {
    return (
      <>
        <div className='fixed right-3 top-3 z-50 flex items-center gap-2 rounded border border-surface-700/70 bg-surface-900/90 p-2 text-xs backdrop-blur'>
          <span className='font-mono text-text-500'>Replay</span>
          <span className='font-mono text-text-300'>
            {session.replay.presetId}
          </span>
          <span className='font-mono text-text-300'>
            {session.replay.checkpointId}
          </span>
          <Button
            size='sm'
            variant='ghost'
            onClick={() => setSession(null)}
            className='h-7'
          >
            New Replay
          </Button>
        </div>
        <GameContextProvider key={session.gameId} gameId={session.gameId}>
          <DebugReplayGameContent />
        </GameContextProvider>
      </>
    );
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-background-950 px-6 py-10'>
      <div className='w-full max-w-xl rounded-xl border border-surface-700/70 bg-surface-900/90 p-6 shadow-2xl shadow-black/40'>
        <div className='mb-6 space-y-2'>
          <p className='font-mono text-xs uppercase tracking-[0.18em] text-text-500'>
            Debug Replay
          </p>
          <h1 className='font-display text-2xl text-text-100'>
            Replay presets with checkpoint resume
          </h1>
          <p className='text-sm text-text-400'>
            Create a real debug session from a reusable preset, then continue
            through the live game UI.
          </p>
        </div>

        {isLoadingPresets ? (
          <div className='flex items-center gap-3 rounded-lg border border-surface-700/60 bg-surface-950/60 px-4 py-5'>
            <LoadingSpinner />
            <p className='text-sm text-text-400'>Loading replay presets...</p>
          </div>
        ) : selectedPreset ? (
          <div className='space-y-4'>
            <div className='space-y-2'>
              <label className='text-sm text-text-300'>Preset</label>
              <Select value={selectedPresetId} onValueChange={updatePreset}>
                <SelectTrigger data-testid='debug-replay-preset'>
                  <SelectValue placeholder='Select replay preset' />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-text-500'>{selectedPreset.description}</p>
            </div>

            <div className='space-y-2'>
              <label className='text-sm text-text-300'>Checkpoint</label>
              <Select
                value={selectedCheckpointId}
                onValueChange={setSelectedCheckpointId}
              >
                <SelectTrigger data-testid='debug-replay-checkpoint'>
                  <SelectValue placeholder='Select checkpoint' />
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
                )?.description ?? 'Choose where the replay should stop.'}
              </p>
            </div>

            {selectedPreset.fields.map((field) => (
              <div key={field.id} className='space-y-2'>
                <label className='text-sm text-text-300'>{field.label}</label>
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
                    <SelectValue placeholder={`Select ${field.label}`} />
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
              </div>
            ))}

            {errorMessage ? (
              <div className='rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200'>
                {errorMessage}
              </div>
            ) : null}

            <div className='flex items-center justify-between gap-3 pt-2'>
              <Button variant='ghost' onClick={() => void loadPresets()}>
                Refresh presets
              </Button>
              <Button
                onClick={() => void startReplay()}
                disabled={isCreating}
                data-testid='debug-replay-start'
              >
                {isCreating ? 'Starting...' : 'Start Replay'}
              </Button>
            </div>
          </div>
        ) : (
          <div className='rounded-lg border border-surface-700/60 bg-surface-950/60 px-4 py-5 text-sm text-text-400'>
            No replay presets available.
          </div>
        )}
      </div>
    </div>
  );
}
