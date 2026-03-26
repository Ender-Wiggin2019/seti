import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/authApi';
import type {
  ILoginRequest,
  IRegisterRequest,
  IUpdateProfileRequest,
} from '@/api/types';
import { useAuthStore } from '@/stores/authStore';

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: (data: ILoginRequest) => authApi.login(data),
    onSuccess: (res) => {
      login(res.token, {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
      });
    },
  });
}

export function useRegister() {
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: (data: IRegisterRequest) => authApi.register(data),
    onSuccess: (res) => {
      login(res.token, {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
      });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IUpdateProfileRequest) => authApi.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  return () => {
    logout();
    queryClient.clear();
  };
}
