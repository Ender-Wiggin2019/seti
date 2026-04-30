import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { games } from './games.js';

/**
 * Snapshot taken at the boundary of a player's turn (i.e. whenever
 * the engine transitions into `AWAIT_MAIN_ACTION` from a turn-boundary
 * phase). Used by the undo subsystem to roll the game back to the
 * start of the current turn.
 *
 * Writes are not done on every turn (to avoid DB churn): a checkpoint
 * is only persisted every N turns (see `GameManager.DB_PERSIST_EVERY`).
 * Day-to-day undo operations are served from the in-memory mirror.
 */
export const turnCheckpoints = pgTable(
  'turn_checkpoints',
  {
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    turnIndex: integer('turn_index').notNull(),
    playerId: text('player_id').notNull(),
    round: integer('round').notNull(),
    state: jsonb('state').notNull(),
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

export type TTurnCheckpointRow = typeof turnCheckpoints.$inferSelect;
export type TTurnCheckpointInsert = typeof turnCheckpoints.$inferInsert;
