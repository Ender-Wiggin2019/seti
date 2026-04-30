import { CanActivate, ForbiddenException, Injectable } from '@nestjs/common';

type TDebugAccessEnv = Record<string, string | undefined>;

export function isDebugApiEnabled(env: TDebugAccessEnv = process.env): boolean {
  if (env.SETI_ENABLE_DEBUG_API === 'true') {
    return true;
  }

  return env.NODE_ENV !== 'production';
}

@Injectable()
export class DebugAccessGuard implements CanActivate {
  canActivate(): boolean {
    if (isDebugApiEnabled()) {
      return true;
    }

    throw new ForbiddenException('Debug API is disabled');
  }
}
