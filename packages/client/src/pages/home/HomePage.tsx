import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { lobbyApi } from '@/api/lobbyApi';
import type { IAlienTypeOption, IGameOptions } from '@/api/types';
import { ERoomStatus } from '@/api/types';
import { CreateRoomDialog } from '@/components/CreateRoomDialog';
import { useSceneHero } from '@/components/layout/SceneBackground';
import {
  MissionHubView,
  type TMissionFilterValue,
} from '@/components/MissionHub';
import { toast } from '@/components/ui/toast';
import { useAuthStore } from '@/stores/authStore';

const ROOM_PAGE_SIZE = 12;

const HOME_SCENE_HERO = '/assets/seti/scenes/lobby.webp';

/**
 * HomePage — the Mission Hub.
 *
 * Per home-redesign-style.md: Hero scene with low-poly assets, 3 mission-state
 * tiles, room filter tabs, and room grid. This is the task center where players
 * create or join missions.
 */
export function HomePage(): React.JSX.Element {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [filter, setFilter] = useState<TMissionFilterValue>('all');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  useSceneHero(HOME_SCENE_HERO);

  const { data: roomsPage, isLoading } = useQuery({
    queryKey: ['rooms', filter, page],
    queryFn: () =>
      lobbyApi.listRooms(
        filter === 'all'
          ? { page, pageSize: ROOM_PAGE_SIZE }
          : {
              status: filter as ERoomStatus,
              page,
              pageSize: ROOM_PAGE_SIZE,
            },
      ),
    refetchInterval: 5000,
  });

  const { data: allRoomsPage } = useQuery({
    queryKey: ['rooms', 'all', 'summary'],
    queryFn: () => lobbyApi.listRooms({ page: 1, pageSize: ROOM_PAGE_SIZE }),
    refetchInterval: 5000,
  });

  const { data: waitingRoomsPage } = useQuery({
    queryKey: ['rooms', 'waiting', 'summary'],
    queryFn: () =>
      lobbyApi.listRooms({
        status: ERoomStatus.WAITING,
        page: 1,
        pageSize: 1,
      }),
    refetchInterval: 5000,
  });

  const { data: playingRoomsPage } = useQuery({
    queryKey: ['rooms', 'playing', 'summary'],
    queryFn: () =>
      lobbyApi.listRooms({
        status: ERoomStatus.PLAYING,
        page: 1,
        pageSize: 1,
      }),
    refetchInterval: 5000,
  });

  const { data: alienTypeMap } = useQuery<Record<string, IAlienTypeOption>>({
    queryKey: ['lobby-alien-types'],
    queryFn: () => lobbyApi.getAlienTypeMap(),
    staleTime: 5 * 60 * 1000,
  });

  const stats = useMemo(() => {
    const waiting = waitingRoomsPage?.total ?? 0;
    const playing = playingRoomsPage?.total ?? 0;
    const players = allRoomsPage?.totalPlayers ?? 0;
    return { waiting, playing, players };
  }, [allRoomsPage, playingRoomsPage, waitingRoomsPage]);

  const createMutation = useMutation({
    mutationFn: (vars: {
      name: string;
      options: IGameOptions;
      visibleInLobby: boolean;
    }) =>
      lobbyApi.createRoom({
        name: vars.name,
        options: vars.options,
        visibleInLobby: vars.visibleInLobby,
      }),
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['my-games'] });
      setCreateOpen(false);
      toast({ title: t('client.lobby.toast.created'), variant: 'success' });
      navigate({ to: '/room/$roomId', params: { roomId: room.id } });
    },
    onError: (err) =>
      toast({
        title: t('client.lobby.toast.create_failed'),
        description: err.message,
        variant: 'error',
      }),
  });

  return (
    <>
      <MissionHubView
        title={t('client.home.title', { defaultValue: 'Mission Hub' })}
        subtitle={t('client.home.subtitle', {
          defaultValue:
            'Choose an organization, join a mission, and compete for first contact.',
        })}
        kicker={t('client.home.hero_kicker', {
          defaultValue: 'Space Agencies',
        })}
        createLabel={t('client.home.create_mission', {
          defaultValue: 'Create Mission',
        })}
        onCreateMission={() =>
          isAuthenticated ? setCreateOpen(true) : navigate({ to: '/auth' })
        }
        filter={filter}
        onFilterChange={(nextFilter) => {
          setFilter(nextFilter);
          setPage(1);
        }}
        filterLabels={{
          all: t('client.lobby.filters.all', { defaultValue: 'All' }),
          waiting: t('client.lobby.filters.waiting', {
            defaultValue: 'Waiting',
          }),
          playing: t('client.lobby.filters.in_progress', {
            defaultValue: 'In Progress',
          }),
        }}
        stats={stats}
        statLabels={{
          waiting: t('client.home.stat.waiting', {
            defaultValue: 'Waiting',
          }),
          waitingSub: t('client.home.stat.waiting_sub', {
            defaultValue: 'Available missions',
          }),
          playing: t('client.home.stat.playing', {
            defaultValue: 'In Progress',
          }),
          playingSub: t('client.home.stat.playing_sub', {
            defaultValue: 'Active missions',
          }),
          players: t('client.home.stat.players', { defaultValue: 'Players' }),
          playersSub: t('client.home.stat.players_sub', {
            defaultValue: 'In missions',
          }),
        }}
        rooms={roomsPage?.items}
        isLoading={isLoading}
        loadingLabel={t('client.lobby.loading', {
          defaultValue: 'Loading missions...',
        })}
        emptyLabel={t('client.lobby.empty', {
          defaultValue: 'No missions available',
        })}
        page={roomsPage?.page ?? page}
        pageSize={roomsPage?.pageSize ?? ROOM_PAGE_SIZE}
        total={roomsPage?.total ?? 0}
        totalPages={roomsPage?.totalPages ?? 0}
        hasMore={roomsPage?.hasMore ?? false}
        onPageChange={setPage}
      />

      <CreateRoomDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(name, options, visibleInLobby) =>
          createMutation.mutate({ name, options, visibleInLobby })
        }
        isPending={createMutation.isPending}
        alienTypeMap={alienTypeMap}
      />
    </>
  );
}
