import type { TGameEvent } from '@seti/common/types/protocol/events';
import {
  bigserial,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { games } from './games.js';

export const gameEvents = pgTable(
  'game_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    seq: integer('seq').notNull(),
    turnIndex: integer('turn_index').notNull(),
    round: integer('round').notNull(),
    actorId: text('actor_id'),
    type: text('type').notNull(),
    payload: jsonb('payload').$type<TGameEvent>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    gameSeqUnique: unique('game_events_game_seq_unique').on(
      table.gameId,
      table.seq,
    ),
    gameTurnIdx: index('game_events_game_turn_idx').on(
      table.gameId,
      table.turnIndex,
    ),
    gameTypeIdx: index('game_events_game_type_idx').on(
      table.gameId,
      table.type,
    ),
    gameActorIdx: index('game_events_game_actor_idx').on(
      table.gameId,
      table.actorId,
    ),
  }),
);

export type TGameEventRow = typeof gameEvents.$inferSelect;
export type TGameEventInsert = typeof gameEvents.$inferInsert;
