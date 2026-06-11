import type { IGameOptionsPatch } from '@seti/common/types/protocol/options';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { lobbyApi } from '@/api/lobbyApi';
import { ERoomStatus, type IPlayerPublicProfile } from '@/api/types';
import { useSceneHero } from '@/components/layout/SceneBackground';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PlayerSlot } from '@/components/PlayerSlot';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { getRequiredHumanPlayerCount } from '@/lib/roomOptions';
import { GameSettingsPanel } from '@/pages/lobby/GameSettingsPanel';
import { useAuthStore } from '@/stores/authStore';

const ROOM_STATUS_VARIANT = {
  [ERoomStatus.WAITING]: 'info',
  [ERoomStatus.PLAYING]: 'warning',
  [ERoomStatus.FINISHED]: 'neutral',
} as const;

const ROOM_SCENE_HERO = '/assets/seti/scenes/room.webp';

export function RoomPage(): React.JSX.Element {
  const { t } = useTranslation('common');
  const { roomId } = useParams({ strict: false }) as { roomId: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const [profilePlayerId, setProfilePlayerId] = useState<string | null>(null);

  useSceneHero(ROOM_SCENE_HERO);

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

  const updateOptionsMutation = useMutation({
    mutationFn: (patch: IGameOptionsPatch) =>
      lobbyApi.updateRoomOptions(roomId, patch),
    onSuccess: (nextRoom) => {
      queryClient.setQueryData(['room', roomId], nextRoom);
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (err) =>
      toast({
        title: t('client.room.toast.update_failed', {
          defaultValue: 'Could not update mission settings',
        }),
        description: err.message,
        variant: 'error',
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => lobbyApi.deleteRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['my-games'] });
      toast({
        title: t('client.room.toast.deleted', {
          defaultValue: 'Mission deleted',
        }),
        variant: 'success',
      });
      navigate({ to: '/lobby' });
    },
    onError: (err) =>
      toast({
        title: t('client.room.toast.delete_failed', {
          defaultValue: 'Could not delete mission',
        }),
        description: err.message,
        variant: 'error',
      }),
  });

  const profileQuery = useQuery({
    queryKey: ['player-public-profile', profilePlayerId],
    queryFn: () => lobbyApi.getPlayerPublicProfile(profilePlayerId ?? ''),
    enabled: profilePlayerId !== null,
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
  const requiredHumanPlayers = getRequiredHumanPlayerCount(room.options);
  const isFull = room.players.length >= requiredHumanPlayers;
  const canStart = isHost && isFull && room.status === ERoomStatus.WAITING;
  const canEnterGame = isInRoom && room.status === ERoomStatus.PLAYING;
  const canLeave = isInRoom && !isHost && room.status === ERoomStatus.WAITING;
  const canDelete = isHost && room.status === ERoomStatus.WAITING;

  const statusLabel =
    room.status === ERoomStatus.WAITING
      ? t('client.room.status.waiting')
      : room.status === ERoomStatus.PLAYING
        ? t('client.room.status.playing')
        : t('client.room.status.finished');
  const hostName =
    room.players.find((player) => player.id === room.hostId)?.name ??
    t('client.common.unknown');

  const emptySlots = Array.from(
    { length: requiredHumanPlayers - room.players.length },
    (_, i) => room.players.length + i,
  );

  return (
    <div className='space-y-6' data-testid='room-page'>
      <section
        className='relative'
        data-testid='room-scene'
        data-scene='mission-room'
      >
        <div className='relative z-10 flex min-h-[300px] flex-col justify-between gap-8 py-5 sm:min-h-[340px] sm:py-8'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
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
            <Badge variant={ROOM_STATUS_VARIANT[room.status]}>
              {statusLabel}
            </Badge>
          </div>

          <div className='max-w-[720px] space-y-4'>
            <span className='micro-label inline-flex items-center gap-2 text-[oklch(0.78_0.10_240)]'>
              <span className='h-px w-6 bg-[var(--signal-blue)]' />
              {t('client.common.mission', { defaultValue: 'Mission' })} ·{' '}
              <span className='readout text-text-500'>
                {room.id.slice(0, 8)}
              </span>
            </span>
            <div className='space-y-2'>
              <h1
                className='font-display text-[clamp(2.2rem,5vw,4.2rem)] font-semibold tracking-[0.06em] text-text-100'
                style={{ textShadow: '0 2px 18px rgba(1, 15, 30, 0.7)' }}
              >
                {room.name}
              </h1>
              <p
                className='max-w-2xl text-sm leading-relaxed text-text-100/90 sm:text-base'
                style={{ textShadow: '0 1px 10px rgba(1, 15, 30, 0.7)' }}
              >
                {hostName} · {room.players.length}/{requiredHumanPlayers}{' '}
                {t('client.room.crew').toLowerCase()}
              </p>
            </div>
          </div>

          <div className='grid gap-3 sm:grid-cols-3'>
            <RoomHeroMetric
              label={t('client.room.crew')}
              value={`${room.players.length}/${requiredHumanPlayers}`}
              sub={
                isFull
                  ? t('client.common.ready', { defaultValue: 'Ready' })
                  : t('client.common.pending', { defaultValue: 'Pending' })
              }
            />
            <RoomHeroMetric
              label={t('client.game_settings.mode', { defaultValue: 'Mode' })}
              value={
                room.options.isSoloMode
                  ? t('client.room.mode_solo_short', { defaultValue: 'Solo' })
                  : t('client.room.mode_multi_short', { defaultValue: 'Multi' })
              }
              sub={
                room.options.isSoloMode
                  ? `D${room.options.soloDifficulty ?? 1}`
                  : t('client.common.live', { defaultValue: 'Shared mission' })
              }
            />
            <RoomHeroMetric
              label={t('client.game_settings.turn_timer')}
              value={
                room.options.timerPerTurn > 0
                  ? t('client.common.seconds_short', {
                      count: room.options.timerPerTurn,
                    })
                  : t('client.common.off')
              }
              sub={
                room.status === ERoomStatus.PLAYING
                  ? t('client.room.status.playing')
                  : t('client.room.status.waiting')
              }
            />
          </div>
        </div>
      </section>

      <div className='grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,420px)]'>
        <Card variant='instrument' className='mission-panel'>
          <PanelBackdrop
            terrain='terrain_01_01.webp'
            object='objects_00_01.webp'
          />
          <CardHeader className='relative z-10'>
            <div className='flex items-center justify-between'>
              <CardTitle>{t('client.room.crew')}</CardTitle>
              <span className='readout text-xs text-text-500'>
                {room.players.length}/{requiredHumanPlayers}
              </span>
            </div>
          </CardHeader>
          <CardContent className='relative z-10 space-y-2.5'>
            {room.players.map((player) => (
              <PlayerSlot
                key={player.id}
                player={player}
                seatIndex={player.seatIndex}
                isCurrentUser={player.id === userId}
                onInspectPlayer={setProfilePlayerId}
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
          <Card className='mission-panel'>
            <PanelBackdrop
              terrain='terrain_02_00.webp'
              object='objects_01_01.webp'
            />
            <CardContent className='relative z-10 py-5'>
              <GameSettingsPanel
                options={room.options}
                readOnly={!isHost}
                onChange={
                  isHost
                    ? (patch) => updateOptionsMutation.mutate(patch)
                    : undefined
                }
              />
            </CardContent>
          </Card>

          <Card className='mission-panel'>
            <PanelBackdrop
              terrain='terrain_02_02.webp'
              object='objects_02_00.webp'
            />
            <CardHeader className='relative z-10'>
              <CardTitle>
                {t('client.common.actions', { defaultValue: 'Actions' })}
              </CardTitle>
            </CardHeader>
            <CardContent className='relative z-10 flex flex-col gap-2'>
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
              {canDelete && (
                <Button
                  variant='danger'
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  data-testid='room-delete'
                >
                  {deleteMutation.isPending
                    ? t('client.room.actions.deleting', {
                        defaultValue: 'Deleting mission...',
                      })
                    : t('client.room.actions.delete', {
                        defaultValue: 'Delete Mission',
                      })}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PlayerPublicProfileDialog
        open={profilePlayerId !== null}
        profile={profileQuery.data}
        isLoading={profileQuery.isLoading}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setProfilePlayerId(null);
          }
        }}
      />
    </div>
  );
}

function PlayerPublicProfileDialog({
  open,
  profile,
  isLoading,
  onOpenChange,
}: {
  open: boolean;
  profile?: IPlayerPublicProfile;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
}): React.JSX.Element {
  const { t } = useTranslation('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        scene='/assets/seti/scenes/profile.webp'
        sceneHeight={170}
        data-testid='player-public-profile'
      >
        <DialogHeader>
          <span className='micro-label text-[oklch(0.74_0.10_240)]'>
            {t('client.player_profile.kicker', {
              defaultValue: 'Player Profile',
            })}
          </span>
          <DialogTitle>
            {profile?.name ??
              t('client.player_profile.loading', {
                defaultValue: 'Loading player...',
              })}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !profile ? (
          <LoadingSpinner variant='scanline' />
        ) : (
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-3'>
              <ProfileReadout
                label={t('client.player_profile.games_played', {
                  defaultValue: 'Recent Games',
                })}
                value={String(profile.stats.gamesPlayed)}
              />
              <ProfileReadout
                label={t('client.player_profile.hosted', {
                  defaultValue: 'Hosted',
                })}
                value={String(profile.stats.hostedGames)}
              />
            </div>

            <div className='space-y-2'>
              <p className='micro-label text-text-500'>
                {t('client.player_profile.recent', {
                  defaultValue: 'Recent Activity',
                })}
              </p>
              {!profile.recentGames.length ? (
                <p className='text-sm text-text-500'>
                  {t('client.player_profile.no_recent_games', {
                    defaultValue: 'No recent games yet.',
                  })}
                </p>
              ) : (
                <div className='space-y-2'>
                  {profile.recentGames.map((game) => (
                    <div
                      key={game.id}
                      className='rounded-[5px] border border-[color:var(--metal-edge-soft)] bg-[var(--surface-instrument)]/72 px-3 py-2'
                    >
                      <div className='flex items-center justify-between gap-3'>
                        <p className='truncate text-sm font-medium text-text-100'>
                          {game.name}
                        </p>
                        <span className='readout text-[0.6875rem] uppercase tracking-microlabel text-text-500'>
                          {game.status}
                        </span>
                      </div>
                      <p className='mt-1 text-xs text-text-500'>
                        {game.isSoloMode
                          ? t('client.room_card.solo', {
                              defaultValue: 'Solo',
                            })
                          : t('client.room.mode_multi_short', {
                              defaultValue: 'Multi',
                            })}
                        {!game.visibleInLobby
                          ? ` · ${t('client.my_games.hidden', {
                              defaultValue: 'Hidden',
                            })}`
                          : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProfileReadout({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <div className='rounded-[5px] border border-[color:var(--metal-edge-soft)] bg-[var(--surface-instrument)]/72 px-3 py-2'>
      <p className='micro-label text-text-500'>{label}</p>
      <p className='mt-1 font-display text-2xl font-semibold tracking-[0.06em] text-text-100'>
        {value}
      </p>
    </div>
  );
}

function PanelBackdrop({
  terrain,
  object,
}: {
  terrain: string;
  object: string;
}): React.JSX.Element {
  return (
    <>
      <span
        aria-hidden
        className='pointer-events-none absolute inset-0 opacity-[0.14]'
        style={{
          backgroundImage: `url('/assets/seti/sprites/${terrain}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
        }}
      />
      <span
        aria-hidden
        className='pointer-events-none absolute -bottom-[16%] right-[-10%] h-40 w-40 opacity-[0.16] mix-blend-screen'
        style={{
          backgroundImage: `url('/assets/seti/sprites/${object}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <span
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-[oklch(0.07_0.015_260/0.68)]'
      />
    </>
  );
}

function RoomHeroMetric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}): React.JSX.Element {
  return (
    <div className='rounded-[6px] border border-[color:var(--metal-edge-soft)] bg-[oklch(0.12_0.022_260/0.72)] px-4 py-3 shadow-hairline-inset'>
      <p className='micro-label text-text-500'>{label}</p>
      <p className='mt-2 font-display text-2xl font-semibold tracking-[0.06em] text-text-100'>
        {value}
      </p>
      <p className='mt-1 text-xs text-text-500'>{sub}</p>
    </div>
  );
}
