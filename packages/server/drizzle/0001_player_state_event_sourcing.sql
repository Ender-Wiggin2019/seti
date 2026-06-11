CREATE TABLE IF NOT EXISTS "game_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"game_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"turn_index" integer NOT NULL,
	"round" integer NOT NULL,
	"actor_id" text,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_events_game_seq_unique" UNIQUE("game_id","seq")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "turn_snapshots" (
	"game_id" uuid NOT NULL,
	"turn_index" integer NOT NULL,
	"seq" integer DEFAULT 0 NOT NULL,
	"player_id" text NOT NULL,
	"round" integer NOT NULL,
	"state" jsonb NOT NULL,
	"interacted_player_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "turn_snapshots_game_id_turn_index_pk" PRIMARY KEY("game_id","turn_index")
);
--> statement-breakpoint
ALTER TABLE IF EXISTS "turn_snapshots" ADD COLUMN IF NOT EXISTS "seq" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'game_events_game_id_games_id_fk'
	) THEN
		ALTER TABLE "game_events" ADD CONSTRAINT "game_events_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'turn_snapshots_game_id_games_id_fk'
	) THEN
		ALTER TABLE "turn_snapshots" ADD CONSTRAINT "turn_snapshots_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "game_events_game_turn_idx" ON "game_events" USING btree ("game_id","turn_index");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "game_events_game_type_idx" ON "game_events" USING btree ("game_id","type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "game_events_game_actor_idx" ON "game_events" USING btree ("game_id","actor_id");
