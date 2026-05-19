import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from './public.decorator.js';

export interface IJwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    let payload: IJwtPayload;
    try {
      payload = this.jwtService.verify(token);
      if (
        typeof payload.sub !== 'string' ||
        typeof payload.email !== 'string'
      ) {
        throw new Error('Invalid token payload');
      }
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // The JWT is cryptographically signed and short-lived; trust its
    // claims for the duration of the request and skip the per-request
    // `SELECT * FROM users` round-trip the guard previously did. User
    // existence is re-verified on the user-write paths (`PUT /auth/me`
    // and similar) where the FK actually matters; an authenticated read
    // doesn't need to re-prove the user exists on every request.
    request.user = payload;

    return true;
  }

  private extractTokenFromHeader(
    request: Record<string, unknown>,
  ): string | undefined {
    const headers = request.headers as Record<string, string> | undefined;
    const authorization = headers?.authorization;
    if (!authorization) {
      return undefined;
    }
    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
