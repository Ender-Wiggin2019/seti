import { useMemo } from 'react';
import { SolarSystemView } from '@/features/board/SolarSystemView';
import { useServerDebugSession } from '@/hooks/useServerDebugSession';
import type { IPublicGameState } from '@/types/re-exports';

function buildPlayerColors(
  players: IPublicGameState['players'],
): Record<string, string> {
  return Object.fromEntries(
    players.map((player) => [player.playerId, player.color]),
  );
}

function noop(): void {
  return undefined;
}

export function SolarSystemCompareDebugPage(): React.JSX.Element {
  const session = useServerDebugSession(true);
  const gameState = session?.gameState ?? null;
  const setupConfig = gameState?.solarSystemSetup;
  const playerColors = useMemo(
    () => buildPlayerColors(gameState?.players ?? []),
    [gameState?.players],
  );
  const myPlayerId =
    session?.viewerId || gameState?.players[0]?.playerId || 'debug-player';
  const canRotate = Boolean(gameState && setupConfig && session);

  return (
    <main className='min-h-screen bg-surface-950 px-4 py-4 text-text-100'>
      <header className='mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-surface-800 bg-surface-900/80 px-3 py-2'>
        <div>
          <h1 className='font-display text-lg font-bold uppercase tracking-wider'>
            Solar System Compare
          </h1>
          <p className='font-mono text-[11px] uppercase tracking-[0.14em] text-text-400'>
            {session?.gameId
              ? `Server game ${session.gameId.slice(0, 8)}`
              : 'Server game pending'}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => void session?.createSession()}
            disabled={!session || session.isCreating}
            className='rounded border border-accent-500/60 bg-accent-500/15 px-3 py-1.5 text-sm font-semibold text-accent-100 transition-colors hover:bg-accent-500/25 disabled:cursor-not-allowed disabled:opacity-50'
          >
            Init
          </button>
          <button
            type='button'
            onClick={() => void session?.solarRotateNext()}
            disabled={!canRotate}
            className='rounded border border-surface-700 bg-surface-800 px-3 py-1.5 text-sm font-semibold text-text-100 transition-colors hover:bg-surface-700 disabled:cursor-not-allowed disabled:opacity-50'
          >
            Rotate
          </button>
        </div>
      </header>

      {session?.errorMessage ? (
        <div className='mb-4 rounded-md border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-200'>
          {session.errorMessage}
        </div>
      ) : null}

      {!gameState || !setupConfig ? (
        <div className='rounded-md border border-surface-800 bg-surface-900/70 px-3 py-6 text-center text-sm text-text-300'>
          Initializing server solar system...
        </div>
      ) : (
        <div className='grid gap-4 2xl:grid-cols-2'>
          <section aria-label='Image mode solar system'>
            <h2 className='mb-2 font-display text-sm font-bold uppercase tracking-wider text-text-200'>
              Image Mode
            </h2>
            <SolarSystemView
              solarSystem={gameState.solarSystem}
              sectors={gameState.sectors}
              setupConfig={setupConfig}
              pendingInput={null}
              playerColors={playerColors}
              myPlayerId={myPlayerId}
              movementPoints={0}
              onMoveProbe={noop}
              onRespondInput={noop}
              textModeOverride={false}
            />
          </section>

          <section aria-label='Text mode solar system'>
            <h2 className='mb-2 font-display text-sm font-bold uppercase tracking-wider text-text-200'>
              Text Mode
            </h2>
            <SolarSystemView
              solarSystem={gameState.solarSystem}
              sectors={gameState.sectors}
              setupConfig={setupConfig}
              pendingInput={null}
              playerColors={playerColors}
              myPlayerId={myPlayerId}
              movementPoints={0}
              onMoveProbe={noop}
              onRespondInput={noop}
              textModeOverride={true}
            />
          </section>
        </div>
      )}
    </main>
  );
}
