import { Global, Module } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export const DRIZZLE_DB = Symbol('DRIZZLE_DB');
const DRIZZLE_POOL = Symbol('DRIZZLE_POOL');

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_POOL,
      useFactory: () =>
        new Pool({
          connectionString: process.env.DATABASE_URL,
        }),
    },
    {
      provide: DRIZZLE_DB,
      inject: [DRIZZLE_POOL],
      useFactory: (pool: Pool): NodePgDatabase => drizzle(pool),
    },
  ],
  exports: [DRIZZLE_DB],
})
export class DrizzleModule {}
