import { Controller, Inject, Post } from '@nestjs/common';
import { Public } from '@/auth/public.decorator.js';
import {
  DebugService,
  type IDebugServerSessionResponse,
} from './debug.service.js';

@Controller('debug')
export class DebugController {
  constructor(@Inject(DebugService) private readonly debugService: DebugService) {}

  @Public()
  @Post('server/session')
  async createServerSession(): Promise<IDebugServerSessionResponse> {
    return this.debugService.createServerSession();
  }
}
