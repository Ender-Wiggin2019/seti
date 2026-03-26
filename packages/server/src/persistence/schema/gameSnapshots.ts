import {
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { games } from './games.js';

export const gameSnapshots = pgTable(
  'game_snapshots',
  {
    id: serial('id').primaryKey(),
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    state: jsonb('state').notNull(),
    event: jsonb('event'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    gameVersionUnique: unique('game_snapshots_game_id_version_unique').on(
      table.gameId,
      table.version,
    ),
  }),
);

export type TGameSnapshotRow = typeof gameSnapshots.$inferSelect;
export type TGameSnapshotInsert = typeof gameSnapshots.$inferInsert;
