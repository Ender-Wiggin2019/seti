import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { lobbyApi } from '@/api/lobbyApi';
import type { IAlienTypeOption, IGameOptions } from '@/api/types';
import { ERoomStatus } from '@/api/types';
import { CreateRoomDialog } from '@/components/CreateRoomDialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { RoomCard } from '@/components/RoomCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';

type TFilterValue = 'all' | ERoomStatus.WAITING | ERoomStatus.PLAYING;

export function LobbyPage(): React.JSX.Element {
  const { t } = useTranslation('common');
  const [filter, setFilter] = useState<TFilterValue>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms', filter],
    queryFn: () =>
      lobbyApi.listRooms(
        filter === 'all' ? undefined : { status: filter as ERoomStatus },
      ),
    refetchInterval: 5000,
  });

  const { data: alienTypeMap } = useQuery<Record<string, IAlienTypeOption>>({
    queryKey: ['lobby-alien-types'],
    queryFn: () => lobbyApi.getAlienTypeMap(),
    staleTime: 5 * 60 * 1000,
  });

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
    <div className='space-y-8'>
      {/* Header strip: instrument kicker → display title → primary CTA. */}
      <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div className='space-y-2'>
          <span className='micro-label inline-flex items-center gap-2 text-[oklch(0.74_0.10_240)]'>
            <span className='h-px w-6 bg-[oklch(0.68_0.11_240)]' />
            {t('client.lobby.kicker', { defaultValue: 'Open Channels' })}
            <span className='readout text-[10px] text-text-500'>
              {String(rooms?.length ?? 0).padStart(2, '0')}
            </span>
          </span>
          <h1 className='font-display text-3xl font-semibold tracking-[0.08em] text-text-100'>
            {t('client.lobby.title')}
          </h1>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          data-testid='lobby-new-mission'
          size='lg'
        >
          {t('client.lobby.new_mission')}
        </Button>
      </header>

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
          <LoadingSpinner variant='block' />
        </div>
      ) : !rooms?.length ? (
        <EmptyState label={t('client.lobby.empty')} />
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
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
        alienTypeMap={alienTypeMap}
      />
    </div>
  );
}

function EmptyState({ label }: { label: string }): React.JSX.Element {
  return (
    <div
      className={cn(
        'metal-hairline-rounded relative overflow-hidden p-12 text-center',
        'bg-[oklch(0.10_0.02_260/0.4)]',
      )}
    >
      {/* A single scanning instrument-light pool, nothing more. */}
      <span
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-[radial-gradient(420px_200px_at_50%_30%,oklch(0.28_0.08_240/0.12),transparent_70%)]'
      />
      <div className='relative flex flex-col items-center gap-3'>
        <EmptyRadarMark />
        <p className='font-mono text-[0.75rem] uppercase tracking-microlabel text-text-400'>
          {label}
        </p>
      </div>
    </div>
  );
}

function EmptyRadarMark(): React.JSX.Element {
  return (
    <svg
      viewBox='0 0 48 48'
      className='h-10 w-10 text-[oklch(0.55_0.06_240)]'
      fill='none'
      stroke='currentColor'
      strokeWidth='1'
      aria-hidden
    >
      <circle cx='24' cy='24' r='20' />
      <circle cx='24' cy='24' r='13' opacity='0.6' />
      <circle cx='24' cy='24' r='6' opacity='0.4' />
      <path d='M24 4v40M4 24h40' strokeDasharray='2 3' opacity='0.4' />
      <path d='M24 24l14-8' stroke='oklch(0.74 0.10 240)' strokeWidth='1.4' />
    </svg>
  );
}
