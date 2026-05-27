import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { lobbyApi } from '@/api/lobbyApi';
import type { IAlienTypeOption, IGameOptions } from '@/api/types';
import { ERoomStatus } from '@/api/types';
import { CreateRoomDialog } from '@/components/CreateRoomDialog';
import {
  MissionHubView,
  type TMissionFilterValue,
} from '@/components/MissionHub';
import { toast } from '@/components/ui/toast';
import { useAuthStore } from '@/stores/authStore';

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
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms', filter],
    queryFn: () =>
      lobbyApi.listRooms(
        filter === 'all' ? undefined : { status: filter as ERoomStatus },
      ),
    refetchInterval: 5000,
  });

  const { data: allRooms } = useQuery({
    queryKey: ['rooms', 'all'],
    queryFn: () => lobbyApi.listRooms(),
    refetchInterval: 5000,
  });

  const { data: alienTypeMap } = useQuery<Record<string, IAlienTypeOption>>({
    queryKey: ['lobby-alien-types'],
    queryFn: () => lobbyApi.getAlienTypeMap(),
    staleTime: 5 * 60 * 1000,
  });

  const stats = useMemo(() => {
    const list = allRooms ?? [];
    const waiting = list.filter((r) => r.status === ERoomStatus.WAITING).length;
    const playing = list.filter((r) => r.status === ERoomStatus.PLAYING).length;
    const players = list.reduce((acc, r) => acc + r.players.length, 0);
    return { waiting, playing, players };
  }, [allRooms]);

  const createMutation = useMutation({
    mutationFn: (vars: { name: string; options: IGameOptions }) =>
      lobbyApi.createRoom({ name: vars.name, options: vars.options }),
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
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
        title={t('client.home.title', { defaultValue: '任务中心' })}
        subtitle={t('client.home.subtitle', {
          defaultValue: '探索未知，连接未来。',
        })}
        kicker={t('client.home.hero_kicker', {
          defaultValue: '可加入任务',
        })}
        createLabel={t('client.home.create_mission', {
          defaultValue: '创建任务',
        })}
        onCreateMission={() =>
          isAuthenticated ? setCreateOpen(true) : navigate({ to: '/auth' })
        }
        filter={filter}
        onFilterChange={setFilter}
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
          waiting: t('client.home.stat.waiting', {
            defaultValue: '等待玩家',
          }),
          waitingSub: t('client.home.stat.waiting_sub', {
            defaultValue: '可加入任务',
          }),
          playing: t('client.home.stat.playing', { defaultValue: '进行中' }),
          playingSub: t('client.home.stat.playing_sub', {
            defaultValue: '已开始任务',
          }),
          players: t('client.home.stat.players', { defaultValue: '参与玩家' }),
          playersSub: t('client.home.stat.players_sub', {
            defaultValue: '当前任务中',
          }),
        }}
        rooms={rooms}
        isLoading={isLoading}
        loadingLabel={t('client.lobby.loading', {
          defaultValue: 'Loading missions...',
        })}
        emptyLabel={t('client.lobby.empty', {
          defaultValue: 'No missions available',
        })}
      />

      <CreateRoomDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(name, options) => createMutation.mutate({ name, options })}
        isPending={createMutation.isPending}
        alienTypeMap={alienTypeMap}
      />
    </>
  );
}
