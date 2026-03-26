import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const games = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom(),
  status: text('status').notNull(),
  playerCount: integer('player_count').notNull(),
  currentRound: integer('current_round').notNull(),
  seed: text('seed').notNull(),
  options: jsonb('options').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TGameRow = typeof games.$inferSelect;
export type TGameInsert = typeof games.$inferInsert;
