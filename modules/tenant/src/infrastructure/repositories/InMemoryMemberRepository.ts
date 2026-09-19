import type { MemberRepository } from '../../domain/repositories/MemberRepository.js';
import type { Member } from '../../domain/Member.js';

export class InMemoryMemberRepository implements MemberRepository {
  private readonly members = new Map<string, Member>();

  async findById(id: string): Promise<Member | null> {
    return this.members.get(id) ?? null;
  }

  async findByTenantAndUser(tenantId: string, userId: string): Promise<Member | null> {
    for (const member of this.members.values()) {
      if (member.userId === userId && this.tenantIdOf(member) === tenantId) {
        return member;
      }
    }
    return null;
  }

  async findByTenantId(tenantId: string): Promise<Member[]> {
    return [...this.members.values()].filter((m) => this.tenantIdOf(m) === tenantId);
  }

  async findByUserId(userId: string): Promise<Member[]> {
    return [...this.members.values()].filter((m) => m.userId === userId);
  }

  async existsByTenantAndUser(tenantId: string, userId: string): Promise<boolean> {
    return (await this.findByTenantAndUser(tenantId, userId)) !== null;
  }

  async save(member: Member): Promise<void> {
    this.members.set(member.id.value, member);
  }

  async saveMany(membersToSave: Member[], tenantId?: string): Promise<void> {
    if (!tenantId) throw new Error('InMemoryMemberRepository.saveMany requires tenantId');
    for (const member of membersToSave) {
      this.members.set(member.id.value, member);
      this.tenantIds.set(member.id.value, tenantId);
    }
  }

  async delete(id: string): Promise<void> {
    this.members.delete(id);
    this.tenantIds.delete(id);
  }

  /** Test helper вЂ” wipes the store between test cases. */
  clear(): void {
    this.members.clear();
    this.tenantIds.clear();
  }

  private readonly tenantIds = new Map<string, string>();

  private tenantIdOf(member: Member): string | undefined {
    return this.tenantIds.get(member.id.value);
  }
}