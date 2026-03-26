import { useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { useCurrentUser, useLogout, useUpdateProfile } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';

export function ProfilePage(): React.JSX.Element {
  const { data: user, isLoading } = useCurrentUser();
  const updateMutation = useUpdateProfile();
  const logout = useLogout();
  const storedUser = useAuthStore((s) => s.user);
  const [editName, setEditName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const displayUser = user ?? storedUser;

  if (isLoading && !displayUser) {
    return (
      <div className='flex min-h-[50vh] items-center justify-center'>
        <LoadingSpinner />
      </div>
    );
  }

  const handleSave = () => {
    if (!editName.trim() || editName.trim().length < 2) {
      toast({ title: 'Name must be at least 2 characters', variant: 'error' });
      return;
    }
    updateMutation.mutate(
      { name: editName.trim() },
      {
        onSuccess: () => {
          toast({ title: 'Profile updated', variant: 'success' });
          setIsEditing(false);
        },
        onError: (err) =>
          toast({
            title: 'Update failed',
            description: err.message,
            variant: 'error',
          }),
      },
    );
  };

  return (
    <div className='space-y-6'>
      <h1 className='font-display text-2xl font-bold uppercase tracking-wider text-text-100'>
        Operative Profile
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-[120px_1fr] items-center gap-3'>
            <span className='font-mono text-xs uppercase tracking-wider text-text-500'>
              ID
            </span>
            <span className='font-mono text-sm text-text-300'>
              {displayUser?.id ?? '—'}
            </span>

            <span className='font-mono text-xs uppercase tracking-wider text-text-500'>
              Callsign
            </span>
            {isEditing ? (
              <div className='flex flex-wrap items-center gap-2'>
                <Label htmlFor='profile-name' className='sr-only'>
                  Callsign
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
                  Save
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className='flex items-center gap-2'>
                <span className='text-sm text-text-100'>
                  {displayUser?.name ?? '—'}
                </span>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => {
                    setEditName(displayUser?.name ?? '');
                    setIsEditing(true);
                  }}
                >
                  Edit
                </Button>
              </div>
            )}

            <span className='font-mono text-xs uppercase tracking-wider text-text-500'>
              Email
            </span>
            <span className='text-sm text-text-300'>
              {displayUser?.email ?? '—'}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className='flex justify-end'>
        <Button
          variant='ghost'
          onClick={logout}
          className='text-danger-500 hover:bg-danger-500/10 hover:text-danger-500'
        >
          Disconnect Terminal
        </Button>
      </div>
    </div>
  );
}
