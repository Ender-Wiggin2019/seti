import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSceneHero } from '@/components/layout/SceneBackground';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignalIndicator } from '@/components/ui/telemetry';
import { toast } from '@/components/ui/toast';
import { UserLayoutSettingsDialog } from '@/features/layout/UserLayoutSettingsDialog';
import { useCurrentUser, useLogout, useUpdateProfile } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';

const PROFILE_SCENE_IMAGE = '/assets/seti/sprites/terrain_00_02.webp';
const PROFILE_SCENE_HERO = '/assets/seti/scenes/profile.webp';

/**
 * ProfilePage — the signed-in player's account surface.
 *
 * A single instrument panel of identity readouts (ID, callsign, email),
 * with the callsign editable inline. The sign-out control is isolated
 * in a danger band to emphasize that signing out is intentional.
 */
export function ProfilePage(): React.JSX.Element {
  const { t } = useTranslation('common');
  const { data: user, isLoading } = useCurrentUser();
  const updateMutation = useUpdateProfile();
  const logout = useLogout();
  const storedUser = useAuthStore((s) => s.user);
  const [editName, setEditName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useSceneHero(PROFILE_SCENE_HERO);

  const displayUser = user ?? storedUser;

  if (isLoading && !displayUser) {
    return (
      <div className='flex min-h-[50vh] items-center justify-center'>
        <LoadingSpinner variant='block' />
      </div>
    );
  }

  const handleSave = () => {
    if (!editName.trim() || editName.trim().length < 2) {
      toast({
        title: t('client.profile.toast.invalid_name'),
        variant: 'error',
      });
      return;
    }
    updateMutation.mutate(
      { name: editName.trim() },
      {
        onSuccess: () => {
          toast({
            title: t('client.profile.toast.updated'),
            variant: 'success',
          });
          setIsEditing(false);
        },
        onError: (err) =>
          toast({
            title: t('client.profile.toast.update_failed'),
            description: err.message,
            variant: 'error',
          }),
      },
    );
  };

  return (
    <div
      className='mission-scene relative min-h-[calc(100vh-9rem)] overflow-hidden rounded-[8px] border border-[color:var(--metal-edge-soft)] shadow-instrument'
      data-scene='profile'
      data-scene-treatment='single-image'
      data-testid='profile-scene'
    >
      <img
        src={PROFILE_SCENE_IMAGE}
        alt=''
        aria-hidden
        data-testid='profile-scene-image'
        className='pointer-events-none absolute inset-0 h-full w-full object-cover object-[74%_center] opacity-[0.45]'
      />
      <span
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-[oklch(0.05_0.018_260/0.62)]'
      />
      <span
        aria-hidden
        className='pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-[oklch(0.04_0.012_260/0.55)]'
      />

      <UserLayoutSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      <div className='relative z-10 grid min-h-[calc(100vh-9rem)] lg:grid-cols-[210px_minmax(0,1fr)]'>
        <aside className='hidden border-r border-[color:var(--metal-edge-soft)] bg-[var(--surface-deep)]/62 p-4 backdrop-blur-md lg:block'>
          <div className='mb-8 flex items-center gap-3'>
            <span
              aria-hidden
              className='relative inline-flex h-7 w-7 items-center justify-center'
            >
              <span className='absolute inset-0.5 rotate-45 border border-[color:var(--metal-edge)] bg-[var(--surface-instrument)]' />
              <span className='absolute inset-[7px] rotate-45 border border-[oklch(0.48_0.10_240)] bg-[oklch(0.32_0.08_240)]' />
            </span>
            <span className='font-display text-sm font-medium tracking-wordmark text-text-100'>
              SETI
            </span>
          </div>

          <nav className='space-y-2' aria-label={t('client.profile.title')}>
            <ProfileRailItem active label={t('client.profile.title')} />
            <ProfileRailItem label={t('client.game_layout.mission_area')} />
            <ProfileRailItem label={t('client.game_layout.intel')} />
            <button
              type='button'
              onClick={() => setSettingsOpen(true)}
              className='w-full'
            >
              <ProfileRailItem label={t('client.profile.settings')} />
            </button>
          </nav>
        </aside>

        <main className='space-y-5 p-5 sm:p-6 lg:p-8'>
          <header className='flex flex-wrap items-start justify-between gap-4'>
            <div className='space-y-2'>
              <span className='micro-label inline-flex items-center gap-2 text-[oklch(0.78_0.10_240)]'>
                <span className='h-px w-6 bg-[var(--signal-blue)]' />
                {t('client.profile.kicker', { defaultValue: 'Member Info' })}
              </span>
              <h1 className='font-display text-3xl font-semibold tracking-[0.08em] text-text-100'>
                {t('client.profile.title')}
              </h1>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <Button
                className='lg:hidden'
                variant='ghost'
                onClick={() => setSettingsOpen(true)}
              >
                {t('client.profile.settings', { defaultValue: 'Settings' })}
              </Button>
              <SignalIndicator
                signal='green'
                active
                label={t('client.profile.on_station', {
                  defaultValue: 'Signed in',
                })}
              />
            </div>
          </header>

          <section className='mission-panel px-5 py-5 sm:px-6'>
            <div className='relative z-10 flex flex-col gap-5 md:flex-row md:items-center'>
              <ProfileAvatar name={displayUser?.name} />
              <div className='min-w-0 flex-1 space-y-3'>
                <div>
                  <p className='text-lg font-semibold text-text-100'>
                    {displayUser?.email ?? t('client.common.empty_value')}
                  </p>
                  <p className='mt-1 text-sm text-text-500'>
                    {t('client.profile.callsign')}:&nbsp;
                    <span className='text-text-300'>
                      {displayUser?.name ?? t('client.common.empty_value')}
                    </span>
                  </p>
                </div>
                <div className='instrument-tick max-w-sm' />
              </div>
            </div>
          </section>

          <section className='grid gap-3 md:grid-cols-4'>
            <ProfileMetric
              label={t('client.profile.id', { defaultValue: 'ID' })}
              value={shortId(displayUser?.id)}
              tone='blue'
            />
            <ProfileMetric
              label={t('client.profile.callsign')}
              value={displayUser?.name ?? t('client.common.empty_value')}
              tone='green'
            />
            <ProfileMetric
              label={t('client.profile.email', { defaultValue: 'Email' })}
              value={displayUser?.email ?? t('client.common.empty_value')}
              tone='white'
            />
            <ProfileMetric
              label={t('client.profile.on_station', {
                defaultValue: 'Signed in',
              })}
              value={t('client.common.ready')}
              tone='violet'
            />
          </section>

          <section className='mission-panel px-5 py-5 sm:px-6'>
            <div className='relative z-10 space-y-4'>
              <div className='section-head mb-2'>
                <span aria-hidden className='section-head__tick' />
                <p className='micro-label'>{t('client.profile.identity')}</p>
                <div aria-hidden className='section-head__rule' />
              </div>

              <dl className='divide-y divide-[color:var(--metal-edge-soft)] rounded-[6px] border border-[color:var(--metal-edge-soft)] bg-[var(--surface-instrument)]/72'>
                <IdentityRow
                  label={t('client.profile.id', { defaultValue: 'ID' })}
                >
                  <span className='readout text-sm text-text-300'>
                    {displayUser?.id ?? t('client.common.empty_value')}
                  </span>
                </IdentityRow>

                <IdentityRow label={t('client.profile.callsign')}>
                  {isEditing ? (
                    <div className='flex flex-wrap items-center gap-2'>
                      <Label htmlFor='profile-name' className='sr-only'>
                        {t('client.profile.callsign')}
                      </Label>
                      <Input
                        id='profile-name'
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className='max-w-xs'
                      />
                      <Button
                        size='sm'
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                      >
                        {t('client.common.save')}
                      </Button>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => setIsEditing(false)}
                      >
                        {t('client.common.cancel')}
                      </Button>
                    </div>
                  ) : (
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='text-sm text-text-100'>
                        {displayUser?.name ?? t('client.common.empty_value')}
                      </span>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => {
                          setEditName(displayUser?.name ?? '');
                          setIsEditing(true);
                        }}
                      >
                        {t('client.common.edit')}
                      </Button>
                    </div>
                  )}
                </IdentityRow>

                <IdentityRow
                  label={t('client.profile.email', { defaultValue: 'Email' })}
                >
                  <span className='readout text-sm text-text-300'>
                    {displayUser?.email ?? t('client.common.empty_value')}
                  </span>
                </IdentityRow>
              </dl>
            </div>
          </section>

          <div
            className={cn(
              'relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[6px]',
              'border border-[color:var(--metal-edge-soft)]',
              'bg-[var(--surface-instrument)]/78 px-5 py-4',
            )}
          >
            <span
              aria-hidden
              className='pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[var(--signal-red)] opacity-60'
            />
            <div className='space-y-1'>
              <p className='micro-label text-[var(--signal-red-hi)]'>
                {t('client.profile.danger_zone', {
                  defaultValue: 'Account Session',
                })}
              </p>
              <p className='text-xs text-text-500'>
                {t('client.profile.disconnect_hint', {
                  defaultValue:
                    'Sign out of this account. Sign in again to resume active missions.',
                })}
              </p>
            </div>
            <Button variant='danger' onClick={logout}>
              {t('client.profile.disconnect')}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}

function ProfileRailItem({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}): React.JSX.Element {
  return (
    <span
      className={cn(
        'relative flex h-10 items-center rounded-[4px] border px-3 text-left text-sm transition-colors',
        active
          ? 'border-[oklch(0.48_0.10_240/0.62)] bg-[oklch(0.24_0.06_240/0.38)] text-[oklch(0.86_0.10_240)]'
          : 'border-transparent text-text-500 hover:border-[color:var(--metal-edge-soft)] hover:bg-[var(--surface-panel)]/50 hover:text-text-300',
      )}
    >
      {active ? (
        <span
          aria-hidden
          className='absolute inset-y-1.5 right-0 w-px bg-[var(--signal-blue)]'
        />
      ) : null}
      {label}
    </span>
  );
}

function ProfileAvatar({ name }: { name?: string }): React.JSX.Element {
  return (
    <div className='relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-[color:var(--metal-edge)] bg-[var(--surface-instrument)] shadow-hairline-inset'>
      <img
        src='/assets/seti/sprites/objects_02_01.webp'
        alt=''
        aria-hidden
        className='absolute inset-0 h-full w-full object-cover opacity-70'
      />
      <span
        aria-hidden
        className='absolute inset-0 bg-[oklch(0.04_0.012_260/0.18)]'
      />
      <span className='relative z-10 flex h-full items-center justify-center font-display text-2xl font-semibold text-text-100'>
        {name?.charAt(0).toUpperCase() ?? '?'}
      </span>
    </div>
  );
}

function ProfileMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'blue' | 'green' | 'violet' | 'white';
}): React.JSX.Element {
  const color =
    tone === 'blue'
      ? 'text-[var(--signal-blue-hi)]'
      : tone === 'green'
        ? 'text-[var(--signal-green-hi)]'
        : tone === 'violet'
          ? 'text-[var(--signal-violet-hi)]'
          : 'text-text-100';

  return (
    <article className='relative overflow-hidden rounded-[6px] border border-[color:var(--metal-edge-soft)] bg-[var(--surface-instrument)]/76 px-4 py-4 shadow-hairline-inset'>
      <p className='micro-label text-[0.625rem] text-text-500'>{label}</p>
      <p className={cn('readout mt-3 truncate text-lg font-semibold', color)}>
        {value}
      </p>
    </article>
  );
}

function shortId(id: string | undefined): string {
  if (!id) return '-';
  return id.length > 12 ? id.slice(0, 12) : id;
}

function IdentityRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className='grid grid-cols-[140px_1fr] items-center gap-4 px-5 py-3.5'>
      <dt className='micro-label text-text-500'>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
