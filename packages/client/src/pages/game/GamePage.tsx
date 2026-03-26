import { useParams } from '@tanstack/react-router';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameContextProvider, useGameContext } from '@/pages/game/GameContext';

function GameContent(): React.JSX.Element {
  const { gameState, isConnected, isMyTurn, myPlayerId, isSpectator, events } =
    useGameContext();

  if (!isConnected) {
    return (
      <div className='flex min-h-[50vh] flex-col items-center justify-center gap-4'>
        <LoadingSpinner />
        <p className='text-sm text-text-500'>
          Establishing secure connection...
        </p>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className='flex min-h-[50vh] flex-col items-center justify-center gap-4'>
        <LoadingSpinner />
        <p className='text-sm text-text-500'>Awaiting mission data...</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-3'>
        <h1 className='font-display text-xl font-bold uppercase tracking-wider text-text-100'>
          Mission {gameState.gameId.slice(0, 8)}
        </h1>
        <Badge variant='accent'>Round {gameState.round}</Badge>
        <Badge>{gameState.phase}</Badge>
        {isSpectator && <Badge variant='warning'>Spectating</Badge>}
        {isMyTurn && <Badge variant='success'>Your Turn</Badge>}
      </div>

      <div className='grid gap-4 lg:grid-cols-3'>
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Board Area</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-text-500'>
              Board components will be implemented in Stage 6.
              {gameState.players.length} players in game.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Log</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className='text-xs text-text-500'>No events yet.</p>
            ) : (
              <div className='space-y-1'>
                {events.slice(0, 10).map((event, i) => (
                  <div
                    key={i}
                    className='rounded bg-surface-900/50 px-2 py-1 font-mono text-xs text-text-300'
                  >
                    {event.type}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-4'>
            {gameState.players.map((player) => (
              <div
                key={player.playerId}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  player.playerId === myPlayerId
                    ? 'border-accent-500/40 bg-accent-500/10'
                    : 'border-surface-700 bg-surface-900/50'
                }`}
              >
                <p className='font-medium text-text-100'>{player.playerName}</p>
                <p className='font-mono text-xs text-text-500'>
                  Score: {player.score} | Hand: {player.handSize}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function GamePage(): React.JSX.Element {
  const { gameId } = useParams({ strict: false }) as { gameId: string };

  return (
    <GameContextProvider gameId={gameId}>
      <GameContent />
    </GameContextProvider>
  );
}

export function SpectatePage(): React.JSX.Element {
  const { gameId } = useParams({ strict: false }) as { gameId: string };

  return (
    <GameContextProvider gameId={gameId} spectate>
      <GameContent />
    </GameContextProvider>
  );
}
