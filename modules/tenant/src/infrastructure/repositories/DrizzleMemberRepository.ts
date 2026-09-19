import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { MemberRepository } from '../../domain/repositories/MemberRepository.js';
import type { Member } from '../../domain/Member.js';
import { MemberMapper } from '../mappers/MemberMapper.js';
import { members } from '../database/schema/members.table.js';
import type { MemberRole, MemberStatus } from '../../domain/index.js';

export class DrizzleMemberRepository implements MemberRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly db: NodePgDatabase<any>) {}

  async findById(id: string): Promise<Member | null> {
    const rows = await this.db.select().from(members).where(eq(members.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByTenantAndUser(tenantId: string, userId: string): Promise<Member | null> {
    const rows = await this.db
      .select()
      .from(members)
      .where(and(eq(members.tenantId, tenantId), eq(members.userId, userId)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByTenantId(tenantId: string): Promise<Member[]> {
    const rows = await this.db.select().from(members).where(eq(members.tenantId, tenantId));
    return rows.map((row) => this.toDomain(row));
  }

  async findByUserId(userId: string): Promise<Member[]> {
    const rows = await this.db.select().from(members).where(eq(members.userId, userId));
    return rows.map((row) => this.toDomain(row));
  }

  async existsByTenantAndUser(tenantId: string, userId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: members.id })
      .from(members)
      .where(and(eq(members.tenantId, tenantId), eq(members.userId, userId)))
      .limit(1);
    return rows.length > 0;
  }

  async save(_member: Member): Promise<void> {
    throw new Error(
      'DrizzleMemberRepository.save(member) requires a tenant id; use saveMany via TenantRepository',
    );
  }

  async saveMany(membersToSave: Member[], tenantId?: string): Promise<void> {
    if (membersToSave.length === 0) return;
    if (!tenantId) {
      throw new Error('DrizzleMemberRepository.saveMany requires tenantId');
    }
    for (const member of membersToSave) {
      const row = MemberMapper.toPersistence(member, tenantId);
      await this.db
        .insert(members)
        .values({
          id: row.id,
          tenantId: row.tenantId,
          userId: row.userId,
          role: row.role,
          status: row.status,
          invitedBy: row.invitedBy,
          joinedAt: row.joinedAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        })
        .onConflictDoUpdate({
          target: members.id,
          set: {
            role: row.role,
            status: row.status,
            invitedBy: row.invitedBy,
            joinedAt: row.joinedAt,
            updatedAt: row.updatedAt,
          },
        });
    }
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(members).where(eq(members.id, id));
  }

  private toDomain(row: typeof members.$inferSelect): Member {
    return MemberMapper.toDomain({
      id: row.id,
      tenantId: row.tenantId,
      userId: row.userId,
      role: row.role as MemberRole,
      status: row.status as MemberStatus,
      invitedBy: row.invitedBy,
      joinedAt: row.joinedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}