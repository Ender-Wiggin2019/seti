import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
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
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type TLoginForm = z.infer<typeof loginSchema>;
type TRegisterForm = z.infer<typeof registerSchema>;

function LoginForm(): React.JSX.Element {
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
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    loginMutation.mutate(result.data, {
      onSuccess: () => navigate({ to: '/lobby' }),
      onError: (err) =>
        toast({
          title: 'Login failed',
          description: err.message,
          variant: 'error',
        }),
    });
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='login-email'>Email</Label>
        <Input
          id='login-email'
          type='email'
          placeholder='commander@mars.gov'
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        {errors.email && (
          <p className='text-xs text-danger-500'>{errors.email}</p>
        )}
      </div>
      <div className='space-y-2'>
        <Label htmlFor='login-password'>Password</Label>
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
      >
        {loginMutation.isPending ? 'Authenticating...' : 'Access Terminal'}
      </Button>
    </form>
  );
}

function RegisterForm(): React.JSX.Element {
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
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    registerMutation.mutate(result.data, {
      onSuccess: () => navigate({ to: '/lobby' }),
      onError: (err) =>
        toast({
          title: 'Registration failed',
          description: err.message,
          variant: 'error',
        }),
    });
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='reg-name'>Callsign</Label>
        <Input
          id='reg-name'
          type='text'
          placeholder='Commander Shepard'
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        {errors.name && (
          <p className='text-xs text-danger-500'>{errors.name}</p>
        )}
      </div>
      <div className='space-y-2'>
        <Label htmlFor='reg-email'>Email</Label>
        <Input
          id='reg-email'
          type='email'
          placeholder='commander@mars.gov'
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        {errors.email && (
          <p className='text-xs text-danger-500'>{errors.email}</p>
        )}
      </div>
      <div className='space-y-2'>
        <Label htmlFor='reg-password'>Access Code</Label>
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
      >
        {registerMutation.isPending
          ? 'Initializing...'
          : 'Register New Operative'}
      </Button>
    </form>
  );
}

export function AuthPage(): React.JSX.Element {
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
            Mission Control
          </div>
          <CardTitle className='text-2xl tracking-wide'>
            SETI Terminal Access
          </CardTitle>
          <CardDescription className='text-text-500'>
            Authenticate to access the command interface
          </CardDescription>
        </CardHeader>
        <CardContent className='relative'>
          <Tabs defaultValue='login'>
            <TabsList className='w-full bg-surface-800/80'>
              <TabsTrigger value='login' className='flex-1'>
                Login
              </TabsTrigger>
              <TabsTrigger value='register' className='flex-1'>
                Register
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
