import { Pool, type QueryResultRow } from 'pg';

const REQUIRED_PLAYER_STATE_TABLES = [
  { table: 'game_events', flag: 'game_events' },
  { table: 'turn_snapshots', flag: 'turn_snapshots' },
] as const;

type TPlayerStateTableFlag =
  (typeof REQUIRED_PLAYER_STATE_TABLES)[number]['flag'];

const REQUIRED_PLAYER_STATE_COLUMNS = [
  { table: 'game_events', column: 'id', flag: 'game_events_id' },
  { table: 'game_events', column: 'game_id', flag: 'game_events_game_id' },
  { table: 'game_events', column: 'seq', flag: 'game_events_seq' },
  {
    table: 'game_events',
    column: 'turn_index',
    flag: 'game_events_turn_index',
  },
  { table: 'game_events', column: 'round', flag: 'game_events_round' },
  { table: 'game_events', column: 'actor_id', flag: 'game_events_actor_id' },
  { table: 'game_events', column: 'type', flag: 'game_events_type' },
  { table: 'game_events', column: 'payload', flag: 'game_events_payload' },
  { table: 'game_events', column: 'created_at', flag: 'game_events_created_at' },
  {
    table: 'turn_snapshots',
    column: 'game_id',
    flag: 'turn_snapshots_game_id',
  },
  {
    table: 'turn_snapshots',
    column: 'turn_index',
    flag: 'turn_snapshots_turn_index',
  },
  { table: 'turn_snapshots', column: 'seq', flag: 'turn_snapshots_seq' },
  {
    table: 'turn_snapshots',
    column: 'player_id',
    flag: 'turn_snapshots_player_id',
  },
  { table: 'turn_snapshots', column: 'round', flag: 'turn_snapshots_round' },
  { table: 'turn_snapshots', column: 'state', flag: 'turn_snapshots_state' },
  {
    table: 'turn_snapshots',
    column: 'interacted_player_ids',
    flag: 'turn_snapshots_interacted_player_ids',
  },
  {
    table: 'turn_snapshots',
    column: 'created_at',
    flag: 'turn_snapshots_created_at',
  },
] as const;

type TPlayerStateColumnFlag =
  (typeof REQUIRED_PLAYER_STATE_COLUMNS)[number]['flag'];

export interface ISchemaReadinessClient {
  query(
    text: string,
    values?: unknown[],
  ): Promise<{ rows: QueryResultRow[] }>;
}

export interface ISchemaReadinessPool extends ISchemaReadinessClient {
  end(): Promise<void>;
}

const PLAYER_STATE_SCHEMA_QUERY = `
SELECT
  to_regclass('public.game_events') IS NOT NULL AS game_events,
  to_regclass('public.turn_snapshots') IS NOT NULL AS turn_snapshots,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'game_events' AND column_name = 'id') AS game_events_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'game_events' AND column_name = 'game_id') AS game_events_game_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'game_events' AND column_name = 'seq') AS game_events_seq,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'game_events' AND column_name = 'turn_index') AS game_events_turn_index,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'game_events' AND column_name = 'round') AS game_events_round,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'game_events' AND column_name = 'actor_id') AS game_events_actor_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'game_events' AND column_name = 'type') AS game_events_type,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'game_events' AND column_name = 'payload') AS game_events_payload,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'game_events' AND column_name = 'created_at') AS game_events_created_at,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'turn_snapshots' AND column_name = 'game_id') AS turn_snapshots_game_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'turn_snapshots' AND column_name = 'turn_index') AS turn_snapshots_turn_index,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'turn_snapshots' AND column_name = 'seq') AS turn_snapshots_seq,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'turn_snapshots' AND column_name = 'player_id') AS turn_snapshots_player_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'turn_snapshots' AND column_name = 'round') AS turn_snapshots_round,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'turn_snapshots' AND column_name = 'state') AS turn_snapshots_state,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'turn_snapshots' AND column_name = 'interacted_player_ids') AS turn_snapshots_interacted_player_ids,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'turn_snapshots' AND column_name = 'created_at') AS turn_snapshots_created_at
`;

function formatMissingTables(missingTables: string[]): string {
  return missingTables.map((table) => `public.${table}`).join(', ');
}

function formatMissingColumns(
  missingColumns: Array<{ table: string; column: string }>,
): string {
  return missingColumns
    .map(({ table, column }) => `public.${table}.${column}`)
    .join(', ');
}

export async function assertPlayerStateSchemaReady(
  client: ISchemaReadinessClient,
): Promise<void> {
  const result = await client.query(PLAYER_STATE_SCHEMA_QUERY);
  const row = result.rows[0] as
    | Partial<Record<TPlayerStateTableFlag, boolean>>
    | undefined;
  const missingTables = REQUIRED_PLAYER_STATE_TABLES.filter(
    ({ flag }) => row?.[flag] !== true,
  ).map(({ table }) => table);

  if (missingTables.length > 0) {
    throw new Error(
      `Database schema is not ready: missing required table(s) ${formatMissingTables(
        missingTables,
      )}. Run \`pnpm --filter @seti/server db:migrate\` before starting the server.`,
    );
  }

  const columnRow = row as
    | Partial<Record<TPlayerStateColumnFlag, boolean>>
    | undefined;
  const missingColumns = REQUIRED_PLAYER_STATE_COLUMNS.filter(
    ({ flag }) => columnRow?.[flag] !== true,
  ).map(({ table, column }) => ({ table, column }));

  if (missingColumns.length > 0) {
    throw new Error(
      `Database schema is not ready: missing required column(s) ${formatMissingColumns(
        missingColumns,
      )}. Run \`pnpm --filter @seti/server db:migrate\` before starting the server.`,
    );
  }
}

export function createReadyPool(): Promise<Pool>;
export function createReadyPool<TPool extends ISchemaReadinessPool>(
  poolFactory: () => TPool,
): Promise<TPool>;
export async function createReadyPool<TPool extends ISchemaReadinessPool>(
  poolFactory?: () => TPool,
): Promise<Pool | TPool> {
  const pool = poolFactory
    ? poolFactory()
    : new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await assertPlayerStateSchemaReady(pool);
    return pool;
  } catch (error) {
    await pool.end();
    throw error;
  }
}
