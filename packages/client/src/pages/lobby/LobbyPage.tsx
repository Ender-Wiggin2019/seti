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

const ROOM_PAGE_SIZE = 12;

const LOBBY_SCENE_HERO = '/assets/seti/scenes/lobby.webp';

/**
 * LobbyPage — authenticated Mission Hub.
 *
 * Reuses the same lunar lobby surface as HomePage so players do not lose the
 * refine v2 task-center context after login.
 */
export function LobbyPage(): React.JSX.Element {
  const { t } = useTranslation('common');
  const [filter, setFilter] = useState<TMissionFilterValue>('all');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useSceneHero(LOBBY_SCENE_HERO);

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
        title={t('client.lobby.title', { defaultValue: '任务中心' })}
        subtitle={t('client.home.subtitle', {
          defaultValue: '探索未知，连接未来。',
        })}
        kicker={t('client.lobby.kicker', { defaultValue: '可加入任务' })}
        createLabel={t('client.lobby.new_mission', {
          defaultValue: '创建任务',
        })}
        onCreateMission={() => setCreateOpen(true)}
        filter={filter}
        onFilterChange={(nextFilter) => {
          setFilter(nextFilter);
          setPage(1);
        }}
        filterLabels={{
          all: t('client.lobby.filters.all', { defaultValue: '全部' }),
          waiting: t('client.lobby.filters.waiting', {
            defaultValue: '等待玩家',
          }),
          playing: t('client.lobby.filters.in_progress', {
            defaultValue: '进行中',
          }),
        }}
        stats={stats}
        statLabels={{
          waiting: t('client.lobby.telemetry.open', {
            defaultValue: '等待玩家',
          }),
          waitingSub: t('client.lobby.telemetry.open_sub', {
            defaultValue: '可加入任务',
          }),
          playing: t('client.lobby.telemetry.in_orbit', {
            defaultValue: '进行中',
          }),
          playingSub: t('client.lobby.telemetry.in_orbit_sub', {
            defaultValue: '已开始任务',
          }),
          players: t('client.lobby.telemetry.operators', {
            defaultValue: '参与玩家',
          }),
          playersSub: t('client.lobby.telemetry.operators_sub', {
            defaultValue: '当前任务中',
          }),
        }}
        rooms={roomsPage?.items}
        isLoading={isLoading}
        loadingLabel={t('client.lobby.loading', {
          defaultValue: 'Loading missions...',
        })}
        emptyLabel={t('client.lobby.empty')}
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
