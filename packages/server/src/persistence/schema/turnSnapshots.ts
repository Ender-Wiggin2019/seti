import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import type { IGameStateDto } from '../dto/GameStateDto.js';
import { games } from './games.js';

export const turnSnapshots = pgTable(
  'turn_snapshots',
  {
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    turnIndex: integer('turn_index').notNull(),
    seq: integer('seq').notNull(),
    playerId: text('player_id').notNull(),
    round: integer('round').notNull(),
    state: jsonb('state').$type<IGameStateDto>().notNull(),
    interactedPlayerIds: jsonb('interacted_player_ids')
      .$type<string[]>()
      .notNull()
      .default([]),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.gameId, table.turnIndex] }),
  }),
);

export type TTurnSnapshotRow = typeof turnSnapshots.$inferSelect;
export type TTurnSnapshotInsert = typeof turnSnapshots.$inferInsert;
