import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { lobbyApi } from '@/api/lobbyApi';
import { ERoomStatus } from '@/api/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PlayerSlot } from '@/components/PlayerSlot';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { GameSettingsPanel } from '@/pages/lobby/GameSettingsPanel';
import { useAuthStore } from '@/stores/authStore';

export function RoomPage(): React.JSX.Element {
  const { roomId } = useParams({ strict: false }) as { roomId: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  const { data: room, isLoading } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => lobbyApi.getRoom(roomId),
    refetchInterval: 3000,
  });

  const joinMutation = useMutation({
    mutationFn: () => lobbyApi.joinRoom(roomId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['room', roomId] }),
    onError: (err) =>
      toast({
        title: 'Join failed',
        description: err.message,
        variant: 'error',
      }),
  });

  const leaveMutation = useMutation({
    mutationFn: () => lobbyApi.leaveRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      navigate({ to: '/lobby' });
    },
    onError: (err) =>
      toast({
        title: 'Leave failed',
        description: err.message,
        variant: 'error',
      }),
  });

  const startMutation = useMutation({
    mutationFn: () => lobbyApi.startGame(roomId),
    onSuccess: (data) =>
      navigate({ to: '/game/$gameId', params: { gameId: data.gameId } }),
    onError: (err) =>
      toast({
        title: 'Start failed',
        description: err.message,
        variant: 'error',
      }),
  });

  if (isLoading || !room) {
    return (
      <div className='flex min-h-[50vh] items-center justify-center'>
        <LoadingSpinner />
      </div>
    );
  }

  const isHost = room.hostId === userId;
  const isInRoom = room.players.some((p) => p.id === userId);
  const isFull = room.players.length >= room.options.playerCount;
  const canStart = isHost && isFull && room.status === ERoomStatus.WAITING;

  const emptySlots = Array.from(
    { length: room.options.playerCount - room.players.length },
    (_, i) => room.players.length + i,
  );

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3'>
        <Button variant='ghost' onClick={() => navigate({ to: '/lobby' })}>
          ← Back
        </Button>
        <h1 className='font-display text-2xl font-bold uppercase tracking-wider text-text-100'>
          {room.name}
        </h1>
        <Badge
          variant={room.status === ERoomStatus.WAITING ? 'success' : 'warning'}
        >
          {room.status}
        </Badge>
      </div>

      <div className='grid gap-6 lg:grid-cols-[1fr_300px]'>
        <Card>
          <CardHeader>
            <CardTitle>Crew</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {room.players.map((player) => (
              <PlayerSlot
                key={player.id}
                player={player}
                seatIndex={player.seatIndex}
                isCurrentUser={player.id === userId}
              />
            ))}
            {emptySlots.map((idx) => (
              <PlayerSlot
                key={`empty-${idx}`}
                player={null}
                seatIndex={idx}
                isCurrentUser={false}
              />
            ))}
          </CardContent>
        </Card>

        <div className='space-y-4'>
          <Card>
            <CardContent className='pt-5'>
              <GameSettingsPanel options={room.options} readOnly={!isHost} />
            </CardContent>
          </Card>

          <div className='flex flex-col gap-2'>
            {!isInRoom && room.status === ERoomStatus.WAITING && !isFull && (
              <Button
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending}
              >
                {joinMutation.isPending ? 'Joining...' : 'Join Mission'}
              </Button>
            )}
            {isInRoom && !isHost && (
              <Button
                variant='ghost'
                onClick={() => leaveMutation.mutate()}
                disabled={leaveMutation.isPending}
              >
                Leave Mission
              </Button>
            )}
            {canStart && (
              <Button
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
              >
                {startMutation.isPending ? 'Launching...' : 'Launch Game'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
