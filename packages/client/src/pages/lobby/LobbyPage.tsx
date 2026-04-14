import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { lobbyApi } from '@/api/lobbyApi';
import type { IGameOptions } from '@/api/types';
import { ERoomStatus } from '@/api/types';
import { CreateRoomDialog } from '@/components/CreateRoomDialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { RoomCard } from '@/components/RoomCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';

type TFilterValue = 'all' | ERoomStatus.WAITING | ERoomStatus.PLAYING;

export function LobbyPage(): React.JSX.Element {
  const { t } = useTranslation('common');
  const [filter, setFilter] = useState<TFilterValue>('all');
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

  const createMutation = useMutation({
    mutationFn: (vars: { name: string; options: IGameOptions }) =>
      lobbyApi.createRoom({ name: vars.name, options: vars.options }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setCreateOpen(false);
      toast({ title: t('client.lobby.toast.created'), variant: 'success' });
    },
    onError: (err) =>
      toast({
        title: t('client.lobby.toast.create_failed'),
        description: err.message,
        variant: 'error',
      }),
  });

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='font-display text-2xl font-bold uppercase tracking-wider text-text-100'>
          {t('client.lobby.title')}
        </h1>
        <Button
          onClick={() => setCreateOpen(true)}
          data-testid='lobby-new-mission'
        >
          {t('client.lobby.new_mission')}
        </Button>
      </div>

      <Tabs
        defaultValue='all'
        onValueChange={(v) => setFilter(v as TFilterValue)}
      >
        <TabsList>
          <TabsTrigger value='all'>{t('client.lobby.filters.all')}</TabsTrigger>
          <TabsTrigger value={ERoomStatus.WAITING}>
            {t('client.lobby.filters.waiting')}
          </TabsTrigger>
          <TabsTrigger value={ERoomStatus.PLAYING}>
            {t('client.lobby.filters.in_progress')}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <LoadingSpinner />
        </div>
      ) : !rooms?.length ? (
        <div className='rounded-lg border border-surface-700 bg-surface-900/50 p-8 text-center'>
          <p className='text-text-500'>{t('client.lobby.empty')}</p>
        </div>
      ) : (
        <div className='grid gap-3 sm:grid-cols-2'>
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}

      <CreateRoomDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(name, options) => createMutation.mutate({ name, options })}
        isPending={createMutation.isPending}
      />
    </div>
  );
}
