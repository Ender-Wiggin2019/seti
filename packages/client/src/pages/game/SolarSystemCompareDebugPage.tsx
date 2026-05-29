import { findPlanetSpaceId } from '@seti/common/rules/solarSystem';
import { useMemo, useState } from 'react';
import { SolarSystemView } from '@/features/board/SolarSystemView';
import { InputRenderer } from '@/features/input/InputRenderer';
import { useServerDebugSession } from '@/hooks/useServerDebugSession';
import { mapPlayerColors } from '@/lib/playerColor';
import {
  EAlienType,
  EFreeAction,
  EMainAction,
  EPlanet,
  type IFreeActionRequest,
  type IInputResponse,
  type IPublicGameState,
  type IPublicOumuamuaTile,
  type TMovementTarget,
} from '@/types/re-exports';

function buildPlayerColors(
  players: IPublicGameState['players'],
): Record<string, string> {
  return mapPlayerColors(players);
}

function findOumuamuaTile(
  aliens: IPublicGameState['aliens'] | undefined,
): IPublicOumuamuaTile | null {
  const oumuamua = aliens?.find((alien) => alien.board?.type === 'oumuamua');
  return oumuamua?.board?.type === 'oumuamua'
    ? (oumuamua.board.tile ?? null)
    : null;
}

function findMascamitesSamplePools(
  aliens: IPublicGameState['aliens'] | undefined,
): { jupiter: number; saturn: number } | null {
  const mascamites = aliens?.find(
    (alien) => alien.board?.type === 'mascamites',
  );
  if (mascamites?.board?.type !== 'mascamites') return null;
  return {
    jupiter: mascamites.board.samplePools[EPlanet.JUPITER] ?? 0,
    saturn: mascamites.board.samplePools[EPlanet.SATURN] ?? 0,
  };
}

export function SolarSystemCompareDebugPage(): React.JSX.Element {
  const session = useServerDebugSession(true);
  const [moveModeActive, setMoveModeActive] = useState(false);
  const [selectedAlienType, setSelectedAlienType] = useState<EAlienType>(
    EAlienType.OUMUAMUA,
  );
  const gameState = session?.gameState ?? null;
  const setupConfig = gameState?.solarSystemSetup;
  const oumuamuaTile = useMemo(
    () => findOumuamuaTile(gameState?.aliens),
    [gameState?.aliens],
  );
  const mascamitesSamplePools = useMemo(
    () => findMascamitesSamplePools(gameState?.aliens),
    [gameState?.aliens],
  );
  const playerColors = useMemo(
    () => buildPlayerColors(gameState?.players ?? []),
    [gameState?.players],
  );
  const myPlayerId =
    session?.viewerId || gameState?.players[0]?.playerId || 'debug-player';
  const canRotate = Boolean(gameState && setupConfig && session);
  const canUseBoardAction = Boolean(gameState && session);
  const myPlayer = gameState?.players.find(
    (player) => player.playerId === myPlayerId,
  );
  const debugMovementPoints = moveModeActive
    ? Math.max(myPlayer?.movementPoints ?? 0, 1)
    : 0;

  function launchProbe(): void {
    if (!gameState || !session) return;
    const earthSpaceId = findPlanetSpaceId(
      gameState.solarSystem,
      EPlanet.EARTH,
    );
    if (!earthSpaceId) return;
    void session.placeProbeOn(earthSpaceId);
  }

  function startScan(): void {
    if (!session) return;
    void session.sendMainAction({ type: EMainAction.SCAN });
  }

  function revealAlien(): void {
    if (!session) return;
    void session.revealAlien(selectedAlienType);
  }

  function moveProbe(path: string[], target?: TMovementTarget): void {
    if (!session || path.length < 2) return;
    if (target?.type === 'probe') {
      void (async () => {
        for (const toSpaceId of path.slice(1)) {
          await session.moveProbeTo(target.id, toSpaceId);
        }
      })();
      return;
    }
    if (!target) return;

    const request: IFreeActionRequest = {
      type: EFreeAction.MOVEMENT,
      path,
      target,
    };
    void session.sendFreeAction(request);
  }

  function respondInput(response: IInputResponse): void {
    if (!session) return;
    void session.sendInput(response);
  }

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
        <div className='flex flex-wrap items-center gap-2'>
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
          <button
            type='button'
            onClick={launchProbe}
            disabled={!canUseBoardAction}
            className='rounded border border-emerald-500/60 bg-emerald-500/15 px-3 py-1.5 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50'
          >
            Launch
          </button>
          <button
            type='button'
            onClick={startScan}
            disabled={!canUseBoardAction || session?.pendingInput !== null}
            className='rounded border border-sky-500/60 bg-sky-500/15 px-3 py-1.5 text-sm font-semibold text-sky-100 transition-colors hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-50'
          >
            Scan
          </button>
          <button
            type='button'
            aria-pressed={moveModeActive}
            onClick={() => setMoveModeActive((current) => !current)}
            disabled={!canUseBoardAction}
            className='rounded border border-surface-700 bg-surface-800 px-3 py-1.5 text-sm font-semibold text-text-100 transition-colors hover:bg-surface-700 disabled:cursor-not-allowed disabled:opacity-50'
          >
            Move Mode {moveModeActive ? 'On' : 'Off'}
          </button>
          <label className='flex items-center gap-1 rounded border border-surface-700 bg-surface-800 px-2 py-1.5 text-sm font-semibold text-text-100'>
            Reveal
            <select
              aria-label='Reveal alien type'
              value={selectedAlienType}
              onChange={(event) =>
                setSelectedAlienType(
                  Number(event.currentTarget.value) as EAlienType,
                )
              }
              disabled={!canUseBoardAction}
              className='rounded border border-surface-700 bg-surface-950 px-2 py-1 text-sm text-text-100 disabled:cursor-not-allowed disabled:opacity-50'
            >
              <option value={EAlienType.OUMUAMUA}>Oumuamua</option>
              <option value={EAlienType.ANOMALIES}>Anomalies</option>
              <option value={EAlienType.MASCAMITES}>Mascamites</option>
              <option value={EAlienType.GLYPHIDS}>Glyphids</option>
            </select>
          </label>
          <button
            type='button'
            onClick={revealAlien}
            disabled={!canUseBoardAction}
            className='rounded border border-violet-500/60 bg-violet-500/15 px-3 py-1.5 text-sm font-semibold text-violet-100 transition-colors hover:bg-violet-500/25 disabled:cursor-not-allowed disabled:opacity-50'
          >
            Reveal Alien
          </button>
        </div>
      </header>

      {session?.errorMessage ? (
        <div className='mb-4 rounded-md border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-200'>
          {session.errorMessage}
        </div>
      ) : null}

      {session?.pendingInput ? (
        <section
          aria-label='Pending debug input'
          className='mb-4 rounded-md border border-surface-800 bg-surface-900/70 px-3 py-3'
        >
          <InputRenderer
            model={session.pendingInput}
            onSubmit={respondInput}
            techBoard={gameState?.techBoard}
          />
        </section>
      ) : null}

      {mascamitesSamplePools ? (
        <section
          data-testid='debug-mascamites-sample-pools'
          className='mb-4 rounded-md border border-surface-800 bg-surface-900/70 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-text-300'
        >
          Mascamites samples: Jupiter {mascamitesSamplePools.jupiter} / Saturn{' '}
          {mascamitesSamplePools.saturn}
        </section>
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
              pendingInput={session?.pendingInput ?? null}
              playerColors={playerColors}
              myPlayerId={myPlayerId}
              movementPoints={debugMovementPoints}
              moveModeActive={moveModeActive}
              onMoveProbe={moveProbe}
              onRespondInput={respondInput}
              allowMoveAnyProbe
              oumuamuaTile={oumuamuaTile}
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
              pendingInput={session?.pendingInput ?? null}
              playerColors={playerColors}
              myPlayerId={myPlayerId}
              movementPoints={debugMovementPoints}
              moveModeActive={moveModeActive}
              onMoveProbe={moveProbe}
              onRespondInput={respondInput}
              allowMoveAnyProbe
              oumuamuaTile={oumuamuaTile}
              textModeOverride={true}
            />
          </section>
        </div>
      )}
    </main>
  );
}
