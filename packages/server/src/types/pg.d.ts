declare module 'pg' {
  export interface ClientConfig {
    connectionString?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    ssl?: boolean | { rejectUnauthorized?: boolean };
  }

  export interface PoolConfig extends ClientConfig {}

  export interface QueryResultRow {
    [column: string]: unknown;
  }

  export interface QueryResult<R extends QueryResultRow = QueryResultRow> {
    rows: R[];
    rowCount: number | null;
  }

  export class Pool {
    public constructor(config?: PoolConfig);
    public query<R extends QueryResultRow = QueryResultRow>(
      text: string,
      values?: unknown[],
    ): Promise<QueryResult<R>>;
    public end(): Promise<void>;
  }

  export class Client {
    public constructor(config?: ClientConfig);
    public connect(): Promise<void>;
    public query<R extends QueryResultRow = QueryResultRow>(
      text: string,
      values?: unknown[],
    ): Promise<QueryResult<R>>;
    public end(): Promise<void>;
  }
}
