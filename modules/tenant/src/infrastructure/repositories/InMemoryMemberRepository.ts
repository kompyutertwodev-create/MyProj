import type { MemberRepository } from '../../domain/repositories/MemberRepository.js';
import type { Member } from '../../domain/Member.js';

export class InMemoryMemberRepository implements MemberRepository {
  private readonly store = new Map<string, Member>();
  private readonly tenantIndex = new Map<string, string>();

  async findById(id: string): Promise<Member | null> {
    return this.store.get(id) ?? null;
  }

  async findByTenantAndUser(tenantId: string, userId: string): Promise<Member | null> {
    for (const [id, member] of this.store) {
      if (this.tenantIndex.get(id) === tenantId && member.userId === userId) {
        return member;
      }
    }
    return null;
  }

  async findByTenantId(tenantId: string): Promise<Member[]> {
    return [...this.store.entries()]
      .filter(([id]) => this.tenantIndex.get(id) === tenantId)
      .map(([, member]) => member);
  }

  async findByUserId(userId: string): Promise<Member[]> {
    return [...this.store.values()].filter((m) => m.userId === userId);
  }

  async existsByTenantAndUser(tenantId: string, userId: string): Promise<boolean> {
    return (await this.findByTenantAndUser(tenantId, userId)) !== null;
  }

  async save(member: Member): Promise<void> {
    this.store.set(member.id.value, member);
  }

  async saveMany(membersToSave: Member[], tenantId?: string): Promise<void> {
    for (const member of membersToSave) {
      this.store.set(member.id.value, member);
      if (tenantId) {
        this.tenantIndex.set(member.id.value, tenantId);
      }
    }
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
    this.tenantIndex.delete(id);
  }

  setTenantId(memberId: string, tenantId: string): void {
    this.tenantIndex.set(memberId, tenantId);
  }

  clear(): void {
    this.store.clear();
    this.tenantIndex.clear();
  }
}
