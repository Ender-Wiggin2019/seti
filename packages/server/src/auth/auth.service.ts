import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_DB } from '@/persistence/drizzle.module.js';
import { UserRepository } from '@/persistence/repository/UserRepository.js';
import type { IJwtPayload } from './jwt-auth.guard.js';

const BCRYPT_SALT_ROUNDS = 10;

export interface IAuthTokenResponse {
  accessToken: string;
  user: { id: string; name: string; email: string };
}

export interface IUserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

@Injectable()
export class AuthService {
  private readonly userRepo: UserRepository;

  constructor(
    @Inject(DRIZZLE_DB) private readonly db: NodePgDatabase,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {
    this.userRepo = new UserRepository(db);
  }

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<IAuthTokenResponse> {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await hash(password, BCRYPT_SALT_ROUNDS);
    const user = await this.userRepo.create({ name, email, passwordHash });

    const payload: IJwtPayload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }

  async login(email: string, password: string): Promise<IAuthTokenResponse> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: IJwtPayload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }

  async getProfile(userId: string): Promise<IUserProfile> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(
    userId: string,
    data: { name?: string; email?: string; password?: string },
  ): Promise<IUserProfile> {
    if (data.email) {
      const existing = await this.userRepo.findByEmail(data.email);
      if (existing && existing.id !== userId) {
        throw new ConflictException('Email already in use');
      }
    }

    const updateData: { name?: string; email?: string; passwordHash?: string } =
      {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.password) {
      updateData.passwordHash = await hash(data.password, BCRYPT_SALT_ROUNDS);
    }

    const user = await this.userRepo.update(userId, updateData);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
