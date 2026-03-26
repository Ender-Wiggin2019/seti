import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/persistence/drizzle.module.js';

@Module({
  imports: [DrizzleModule],
})
export class AppModule {}
