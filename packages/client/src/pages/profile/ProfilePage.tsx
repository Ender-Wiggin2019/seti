import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignalIndicator } from '@/components/ui/telemetry';
import { toast } from '@/components/ui/toast';
import { UserLayoutSettingsDialog } from '@/features/layout/UserLayoutSettingsDialog';
import { useCurrentUser, useLogout, useUpdateProfile } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';

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
    <div className='space-y-8'>
      <header className='space-y-2'>
        <span className='micro-label inline-flex items-center gap-2 text-[oklch(0.78_0.10_240)]'>
          <span className='h-px w-6 bg-[var(--signal-blue)]' />
          {t('client.profile.kicker', { defaultValue: 'Member Info' })}
        </span>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <h1 className='font-display text-3xl font-semibold tracking-[0.08em] text-text-100'>
            {t('client.profile.title')}
          </h1>
          <div className='flex flex-wrap items-center gap-2'>
            <Button variant='ghost' onClick={() => setSettingsOpen(true)}>
              Settings
            </Button>
            <SignalIndicator
              signal='green'
              active
              label={t('client.profile.on_station', {
                defaultValue: 'Signed in',
              })}
            />
          </div>
        </div>
      </header>

      <UserLayoutSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      <Card variant='instrument'>
        <CardHeader>
          <CardTitle className='font-display tracking-tight'>
            {t('client.profile.identity')}
          </CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          <dl className='divide-y divide-[color:var(--metal-edge-soft)]'>
            <IdentityRow label='ID'>
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
                <div className='flex items-center gap-2'>
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

            <IdentityRow label='Email'>
              <span className='readout text-sm text-text-300'>
                {displayUser?.email ?? t('client.common.empty_value')}
              </span>
            </IdentityRow>
          </dl>
        </CardContent>
      </Card>

      <div
        className={cn(
          'relative flex items-center justify-between gap-4 overflow-hidden rounded-[6px]',
          'border border-[color:var(--metal-edge-soft)]',
          'bg-[var(--surface-instrument)]/70 px-5 py-4',
        )}
      >
        {/* Bottom hairline plasma-red — instrument underline, not a left stripe. */}
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
    </div>
  );
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
