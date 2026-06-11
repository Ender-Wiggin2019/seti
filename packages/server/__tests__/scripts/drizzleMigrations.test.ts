import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const drizzleDir = resolve(__dirname, '../../drizzle');

interface IDrizzleJournal {
  entries: Array<{ idx: number; tag: string }>;
}

function readJournal(): IDrizzleJournal {
  return JSON.parse(
    readFileSync(resolve(drizzleDir, 'meta/_journal.json'), 'utf8'),
  ) as IDrizzleJournal;
}

function readMigration(tag: string): string {
  return readFileSync(resolve(drizzleDir, `${tag}.sql`), 'utf8');
}

describe('drizzle migrations', () => {
  it('keeps a post-baseline event-sourcing migration for databases that already applied 0000', () => {
    const postBaselineMigrations = readJournal().entries.filter(
      (entry) => entry.idx > 0,
    );
    const eventSourcingMigration = postBaselineMigrations.find((entry) => {
      const sql = readMigration(entry.tag);
      return (
        sql.includes('CREATE TABLE IF NOT EXISTS "game_events"') &&
        sql.includes('CREATE TABLE IF NOT EXISTS "turn_snapshots"')
      );
    });

    expect(eventSourcingMigration?.tag).toBeDefined();
  });
});
