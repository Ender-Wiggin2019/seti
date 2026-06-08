import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { useLogin, useRegister } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';

const AUTH_SCENE_IMAGE = '/assets/seti/sprites/objects_00_00.webp';

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
    <p className='font-mono text-[0.6875rem] uppercase tracking-microlabel text-[var(--signal-red-hi)]'>
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
      {loginMutation.isPending && (
        <LoadingSpinner
          variant='scanline'
          label={t('client.auth.actions.authenticating')}
        />
      )}
      <Button
        type='submit'
        size='lg'
        className='w-full'
        disabled={loginMutation.isPending}
        data-testid='auth-login-submit'
      >
        {loginMutation.isPending
          ? t('client.auth.actions.authenticating')
          : t('client.auth.actions.sign_in')}
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
      {registerMutation.isPending && (
        <LoadingSpinner
          variant='scanline'
          label={t('client.auth.actions.initializing')}
        />
      )}
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
        'relative min-h-[calc(100vh-4rem)] overflow-hidden px-4 py-6 sm:px-6 lg:px-8',
      )}
    >
      <div
        className='pointer-events-none absolute inset-0 -z-10 bg-[image:var(--bg-atmosphere)] bg-cover bg-center'
        aria-hidden
      />

      <section
        className={cn(
          'mission-scene relative mx-auto min-h-[calc(100vh-7rem)] w-full max-w-6xl overflow-hidden rounded-[8px]',
          'border border-[color:var(--metal-edge)] shadow-instrument',
        )}
        data-scene='auth'
        data-scene-treatment='single-image'
      >
        <img
          src={AUTH_SCENE_IMAGE}
          alt=''
          aria-hidden
          data-testid='auth-scene-image'
          className='pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-[42%_center] opacity-[0.72]'
        />
        <span
          aria-hidden
          className='pointer-events-none absolute inset-0 bg-[oklch(0.04_0.018_260/0.62)]'
        />
        <span
          aria-hidden
          className='pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-[oklch(0.04_0.012_260/0.58)]'
        />

        <div className='relative z-10 grid min-h-[calc(100vh-7rem)] items-center gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(390px,440px)] lg:p-10'>
          <div className='hidden min-h-[520px] flex-col justify-between lg:flex'>
            <div className='max-w-[520px] space-y-5'>
              <span className='micro-label inline-flex items-center gap-3 text-[oklch(0.82_0.09_235)]'>
                <span className='h-px w-8 bg-[var(--signal-blue)]' />
                {t('client.auth.hero.badge')}
              </span>
              <div className='space-y-3'>
                <h1 className='font-display text-[clamp(3rem,5vw,5.6rem)] font-black leading-[0.95] tracking-[0.04em] text-text-100'>
                  {t('client.auth.hero.title')}
                </h1>
                <p className='max-w-md text-base leading-relaxed text-text-300'>
                  {t('client.auth.hero.subtitle')}
                </p>
              </div>
            </div>

            <div className='grid max-w-lg grid-cols-3 gap-3'>
              <AuthReadout label='MISSIONS' value='01' tone='blue' />
              <AuthReadout label='AGENCY' value='ID' tone='green' />
              <AuthReadout label='CONTACT' value='SETI' tone='violet' />
            </div>
          </div>

          <section className='mission-panel mx-auto w-full max-w-md self-center px-5 py-5 sm:px-6 sm:py-6'>
            <div className='relative z-10'>
              <header className='border-b border-[color:var(--metal-edge-soft)] pb-5 text-center'>
                <span className='micro-label mx-auto inline-flex items-center justify-center gap-2 text-[oklch(0.78_0.10_240)]'>
                  <span className='h-px w-4 bg-[var(--signal-blue)]' />
                  {t('client.auth.hero.badge')}
                  <span className='h-px w-4 bg-[var(--signal-blue)]' />
                </span>
                <h2 className='mt-3 font-display text-2xl font-semibold tracking-[0.08em] text-text-100'>
                  {t('client.auth.hero.title')}
                </h2>
                <p className='mx-auto mt-2 max-w-sm text-sm leading-relaxed text-text-500'>
                  {t('client.auth.hero.subtitle')}
                </p>
              </header>

              <div className='pt-5'>
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
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function AuthReadout({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'blue' | 'green' | 'violet';
}): React.JSX.Element {
  const color =
    tone === 'blue'
      ? 'text-[var(--signal-blue-hi)]'
      : tone === 'green'
        ? 'text-[var(--signal-green-hi)]'
        : 'text-[var(--signal-violet-hi)]';

  return (
    <div className='metal-hairline-rounded bg-[oklch(0.09_0.02_260/0.74)] px-3 py-3'>
      <p className='micro-label text-[0.625rem] text-text-500'>{label}</p>
      <p className={cn('readout mt-2 text-lg font-semibold', color)}>{value}</p>
    </div>
  );
}
