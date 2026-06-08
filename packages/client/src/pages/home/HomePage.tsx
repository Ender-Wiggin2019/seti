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
        onFilterChange={setFilter}
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
