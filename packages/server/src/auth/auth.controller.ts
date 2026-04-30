import { Body, Controller, Get, Inject, Post, Put, Req } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/LoginDto.js';
import { RegisterDto } from './dto/RegisterDto.js';
import { UpdateProfileDto } from './dto/UpdateProfileDto.js';
import type { IJwtPayload } from './jwt-auth.guard.js';
import { Public } from './public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.name, dto.email, dto.password);
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('me')
  async me(@Req() req: { user: IJwtPayload }) {
    return this.authService.getProfile(req.user.sub);
  }

  @Put('me')
  async updateMe(
    @Req() req: { user: IJwtPayload },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.sub, {
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });
  }
}
