import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { games } from './games.js';
import { users } from './users.js';

export const gamePlayers = pgTable(
  'game_players',
  {
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    seatIndex: integer('seat_index').notNull(),
    color: text('color').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.gameId, table.userId] }),
  }),
);

export type TGamePlayerRow = typeof gamePlayers.$inferSelect;
export type TGamePlayerInsert = typeof gamePlayers.$inferInsert;
