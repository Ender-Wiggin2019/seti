import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { type TUserInsert, type TUserRow, users } from '../schema/users.js';

export class UserRepository {
  public constructor(private readonly db: NodePgDatabase) {}

  public async create(
    input: Omit<TUserInsert, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<TUserRow> {
    const [row] = await this.db.insert(users).values(input).returning();
    return row;
  }

  public async findByEmail(email: string): Promise<TUserRow | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return row ?? null;
  }

  public async findById(id: string): Promise<TUserRow | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return row ?? null;
  }

  public async update(
    id: string,
    data: Partial<Pick<TUserInsert, 'name' | 'email' | 'passwordHash'>>,
  ): Promise<TUserRow | null> {
    const [row] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return row ?? null;
  }
}
