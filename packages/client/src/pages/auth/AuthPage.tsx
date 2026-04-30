import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { useLogin, useRegister } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

type TLoginForm = z.infer<typeof loginSchema>;
type TRegisterForm = z.infer<typeof registerSchema>;

function FieldError({
  message,
}: {
  message?: string;
}): React.JSX.Element | null {
  if (!message) return null;
  return (
    <p className='font-mono text-[0.6875rem] uppercase tracking-microlabel text-[oklch(0.65_0.16_28)]'>
      {message}
    </p>
  );
}

function LoginForm(): React.JSX.Element {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const [form, setForm] = useState<TLoginForm>({ email: '', password: '' });
  const [errors, setErrors] = useState<
    Partial<Record<keyof TLoginForm, string>>
  >({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (fieldErrors[key]) continue;
        if (key === 'email') {
          fieldErrors[key] = t('client.auth.validation.invalid_email');
          continue;
        }
        if (key === 'password') {
          fieldErrors[key] = t('client.auth.validation.password_min');
          continue;
        }
        fieldErrors[key] = t('client.auth.validation.invalid_field');
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    loginMutation.mutate(result.data, {
      onSuccess: () => navigate({ to: '/lobby' }),
      onError: (err) =>
        toast({
          title: t('client.auth.toast.login_failed'),
          description: err.message,
          variant: 'error',
        }),
    });
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-5'>
      <div className='space-y-1.5'>
        <Label htmlFor='login-email' variant='micro'>
          {t('client.auth.fields.email')}
        </Label>
        <Input
          id='login-email'
          type='email'
          placeholder={t('client.auth.placeholders.email')}
          value={form.email}
          mono
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <FieldError message={errors.email} />
      </div>
      <div className='space-y-1.5'>
        <Label htmlFor='login-password' variant='micro'>
          {t('client.auth.fields.password')}
        </Label>
        <Input
          id='login-password'
          type='password'
          placeholder='••••••••'
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />
        <FieldError message={errors.password} />
      </div>
      <Button
        type='submit'
        size='lg'
        className='w-full'
        disabled={loginMutation.isPending}
        data-testid='auth-login-submit'
      >
        {loginMutation.isPending
          ? t('client.auth.actions.authenticating')
          : t('client.auth.actions.access_terminal')}
      </Button>
    </form>
  );
}

function RegisterForm(): React.JSX.Element {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const [form, setForm] = useState<TRegisterForm>({
    name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof TRegisterForm, string>>
  >({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (fieldErrors[key]) continue;
        if (key === 'name') {
          fieldErrors[key] = t('client.auth.validation.name_min');
          continue;
        }
        if (key === 'email') {
          fieldErrors[key] = t('client.auth.validation.invalid_email');
          continue;
        }
        if (key === 'password') {
          fieldErrors[key] = t('client.auth.validation.password_min');
          continue;
        }
        fieldErrors[key] = t('client.auth.validation.invalid_field');
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    registerMutation.mutate(result.data, {
      onSuccess: () => navigate({ to: '/lobby' }),
      onError: (err) =>
        toast({
          title: t('client.auth.toast.registration_failed'),
          description: err.message,
          variant: 'error',
        }),
    });
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-5'>
      <div className='space-y-1.5'>
        <Label htmlFor='reg-name' variant='micro'>
          {t('client.auth.fields.callsign')}
        </Label>
        <Input
          id='reg-name'
          type='text'
          placeholder={t('client.auth.placeholders.callsign')}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <FieldError message={errors.name} />
      </div>
      <div className='space-y-1.5'>
        <Label htmlFor='reg-email' variant='micro'>
          {t('client.auth.fields.email')}
        </Label>
        <Input
          id='reg-email'
          type='email'
          placeholder={t('client.auth.placeholders.email')}
          value={form.email}
          mono
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <FieldError message={errors.email} />
      </div>
      <div className='space-y-1.5'>
        <Label htmlFor='reg-password' variant='micro'>
          {t('client.auth.fields.access_code')}
        </Label>
        <Input
          id='reg-password'
          type='password'
          placeholder='••••••••'
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />
        <FieldError message={errors.password} />
      </div>
      <Button
        type='submit'
        size='lg'
        className='w-full'
        disabled={registerMutation.isPending}
        data-testid='auth-register-submit'
      >
        {registerMutation.isPending
          ? t('client.auth.actions.initializing')
          : t('client.auth.actions.register')}
      </Button>
    </form>
  );
}

export function AuthPage(): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <div
      className={cn(
        'relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-10',
      )}
    >
      {/* Deep-space instrument-light pool — pure blue radial on void.
          Replaces the previous orange/cyan orb stack. */}
      <div
        className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1100px_620px_at_50%_-10%,oklch(0.22_0.06_240/0.20),transparent_60%),radial-gradient(900px_700px_at_50%_120%,oklch(0.16_0.05_280/0.18),transparent_55%)]'
        aria-hidden
      />

      <Card variant='instrument' className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <span className='micro-label mx-auto inline-flex items-center justify-center gap-2 text-[oklch(0.74_0.10_240)]'>
            <span className='h-px w-4 bg-[oklch(0.68_0.11_240)]' />
            {t('client.auth.hero.badge')}
            <span className='h-px w-4 bg-[oklch(0.68_0.11_240)]' />
          </span>
          <CardTitle className='mt-2 text-2xl tracking-[0.08em]'>
            {t('client.auth.hero.title')}
          </CardTitle>
          <CardDescription className='mx-auto mt-1 max-w-sm'>
            {t('client.auth.hero.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='login'>
            <TabsList className='w-full'>
              <TabsTrigger
                value='login'
                className='flex-1'
                data-testid='auth-tab-login'
              >
                {t('client.auth.tabs.login')}
              </TabsTrigger>
              <TabsTrigger
                value='register'
                className='flex-1'
                data-testid='auth-tab-register'
              >
                {t('client.auth.tabs.register')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value='login' className='mt-6'>
              <LoginForm />
            </TabsContent>
            <TabsContent value='register' className='mt-6'>
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
