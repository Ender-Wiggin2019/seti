ALTER TABLE IF EXISTS "games"
  ADD COLUMN IF NOT EXISTS "visible_in_lobby" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "games_lobby_visible_status_created_idx"
  ON "games" USING btree ("visible_in_lobby", "status", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "game_players_user_created_idx"
  ON "game_players" USING btree ("user_id", "created_at");
