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
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='login-email'>{t('client.auth.fields.email')}</Label>
        <Input
          id='login-email'
          type='email'
          placeholder={t('client.auth.placeholders.email')}
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        {errors.email && (
          <p className='text-xs text-danger-500'>{errors.email}</p>
        )}
      </div>
      <div className='space-y-2'>
        <Label htmlFor='login-password'>
          {t('client.auth.fields.password')}
        </Label>
        <Input
          id='login-password'
          type='password'
          placeholder='••••••••'
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />
        {errors.password && (
          <p className='text-xs text-danger-500'>{errors.password}</p>
        )}
      </div>
      <Button
        type='submit'
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
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='reg-name'>{t('client.auth.fields.callsign')}</Label>
        <Input
          id='reg-name'
          type='text'
          placeholder={t('client.auth.placeholders.callsign')}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        {errors.name && (
          <p className='text-xs text-danger-500'>{errors.name}</p>
        )}
      </div>
      <div className='space-y-2'>
        <Label htmlFor='reg-email'>{t('client.auth.fields.email')}</Label>
        <Input
          id='reg-email'
          type='email'
          placeholder={t('client.auth.placeholders.email')}
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        {errors.email && (
          <p className='text-xs text-danger-500'>{errors.email}</p>
        )}
      </div>
      <div className='space-y-2'>
        <Label htmlFor='reg-password'>
          {t('client.auth.fields.access_code')}
        </Label>
        <Input
          id='reg-password'
          type='password'
          placeholder='••••••••'
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />
        {errors.password && (
          <p className='text-xs text-danger-500'>{errors.password}</p>
        )}
      </div>
      <Button
        type='submit'
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
        'relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-8',
      )}
    >
      <div
        className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_10%_-20%,rgba(226,82,14,0.2),transparent_60%),radial-gradient(1200px_700px_at_90%_120%,rgba(34,211,238,0.1),transparent_55%)]'
        aria-hidden
      />
      <div className='pointer-events-none absolute left-1/4 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-accent-500/5 blur-3xl' />
      <div className='pointer-events-none absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-cyan-500/5 blur-3xl' />

      <Card
        className={cn(
          'relative w-full max-w-md overflow-hidden border-surface-700/80 bg-surface-900/90 shadow-panel backdrop-blur-sm',
          'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:shadow-[inset_0_1px_0_0_rgba(249,115,22,0.12)]',
        )}
      >
        <CardHeader className='relative text-center'>
          <div className='mb-2 font-mono text-xs uppercase tracking-[0.3em] text-accent-400'>
            {t('client.auth.hero.badge')}
          </div>
          <CardTitle className='text-2xl tracking-wide'>
            {t('client.auth.hero.title')}
          </CardTitle>
          <CardDescription className='text-text-500'>
            {t('client.auth.hero.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className='relative'>
          <Tabs defaultValue='login'>
            <TabsList className='w-full bg-surface-800/80'>
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
