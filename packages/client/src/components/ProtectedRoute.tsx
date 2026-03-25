import { Navigate } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/authStore';

interface IProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute(props: IProtectedRouteProps): React.JSX.Element {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to={props.redirectTo ?? '/auth'} />;
  }

  return <>{props.children}</>;
}
