import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('common');
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
        title: t('client.room.toast.join_failed'),
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
        title: t('client.room.toast.leave_failed'),
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
        title: t('client.room.toast.start_failed'),
        description: err.message,
        variant: 'error',
      }),
  });

  if (isLoading || !room) {
    return (
      <div className='flex min-h-[50vh] items-center justify-center'>
        <LoadingSpinner variant='block' />
      </div>
    );
  }

  const isHost = room.hostId === userId;
  const isInRoom = room.players.some((p) => p.id === userId);
  const isFull = room.players.length >= room.options.playerCount;
  const canStart = isHost && isFull && room.status === ERoomStatus.WAITING;
  const canEnterGame = isInRoom && room.status === ERoomStatus.PLAYING;
  const canLeave = isInRoom && !isHost && room.status === ERoomStatus.WAITING;

  const statusLabel =
    room.status === ERoomStatus.WAITING
      ? t('client.room.status.waiting')
      : room.status === ERoomStatus.PLAYING
        ? t('client.room.status.playing')
        : t('client.room.status.finished');

  const emptySlots = Array.from(
    { length: room.options.playerCount - room.players.length },
    (_, i) => room.players.length + i,
  );

  return (
    <div className='space-y-8'>
      {/* Header: back chevron, display-font name, status tag. */}
      <header className='space-y-3'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => navigate({ to: '/lobby' })}
        >
          <svg
            viewBox='0 0 24 24'
            className='h-3.5 w-3.5'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden
          >
            <path d='M15 18l-6-6 6-6' />
          </svg>
          {t('client.room.back')}
        </Button>

        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div className='space-y-1.5'>
            <span className='micro-label text-[oklch(0.74_0.10_240)]'>
              {t('client.common.mission', { defaultValue: 'Mission' })} ·{' '}
              <span className='text-text-500'>{room.id.slice(0, 8)}</span>
            </span>
            <h1 className='font-display text-3xl font-semibold tracking-[0.08em] text-text-100'>
              {room.name}
            </h1>
          </div>
          <Badge
            variant={
              room.status === ERoomStatus.WAITING ? 'success' : 'warning'
            }
          >
            {statusLabel}
          </Badge>
        </div>
      </header>

      <div className='grid gap-6 lg:grid-cols-[1fr_320px]'>
        {/* Crew manifest */}
        <Card variant='instrument'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>{t('client.room.crew')}</CardTitle>
              <span className='readout text-xs text-text-500'>
                {room.players.length}/{room.options.playerCount}
              </span>
            </div>
          </CardHeader>
          <CardContent className='space-y-2.5'>
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

        {/* Right column: mission parameters + action group */}
        <div className='space-y-4'>
          <Card>
            <CardContent className='py-5'>
              <GameSettingsPanel options={room.options} readOnly={!isHost} />
            </CardContent>
          </Card>

          <div className='flex flex-col gap-2'>
            {!isInRoom && room.status === ERoomStatus.WAITING && !isFull && (
              <Button
                size='lg'
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending}
                data-testid='room-join'
              >
                {joinMutation.isPending
                  ? t('client.room.actions.joining')
                  : t('client.room.actions.join')}
              </Button>
            )}
            {canLeave && (
              <Button
                variant='ghost'
                onClick={() => leaveMutation.mutate()}
                disabled={leaveMutation.isPending}
                data-testid='room-leave'
              >
                {t('client.room.actions.leave')}
              </Button>
            )}
            {canEnterGame && (
              <Button
                size='lg'
                onClick={() =>
                  navigate({
                    to: '/game/$gameId',
                    params: { gameId: room.gameId ?? room.id },
                  })
                }
                data-testid='room-enter-game'
              >
                {t('client.room.actions.enter_game')}
              </Button>
            )}
            {canStart && (
              <Button
                size='lg'
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                data-testid='room-launch-game'
              >
                {startMutation.isPending
                  ? t('client.room.actions.launching')
                  : t('client.room.actions.launch')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
