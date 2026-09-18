import type { Member } from '../Member.js';

export interface MemberRepository {
  findById(id: string): Promise<Member | null>;
  findByTenantAndUser(tenantId: string, userId: string): Promise<Member | null>;
  findByTenantId(tenantId: string): Promise<Member[]>;
  findByUserId(userId: string): Promise<Member[]>;
  existsByTenantAndUser(tenantId: string, userId: string): Promise<boolean>;
  save(member: Member): Promise<void>;
  saveMany(members: Member[], tenantId?: string): Promise<void>;
  delete(id: string): Promise<void>;
}
