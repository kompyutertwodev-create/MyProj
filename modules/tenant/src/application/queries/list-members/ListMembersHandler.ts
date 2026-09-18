import type { MemberRepository } from '../../../domain/repositories/MemberRepository.js';
import type { ListMembersQuery } from './ListMembersQuery.js';
import type { MemberView } from '../MemberView.js';

export class ListMembersHandler {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(query: ListMembersQuery): Promise<MemberView[]> {
    let members = await this.memberRepository.findByTenantId(query.tenantId);

    if (query.role) {
      members = members.filter((m) => m.role === query.role);
    }
    if (query.status) {
      members = members.filter((m) => m.status === query.status);
    }

    return members.map((member) => ({
      id: member.id.value,
      tenantId: query.tenantId,
      userId: member.userId,
      role: member.role,
      status: member.status,
      invitedBy: member.invitedBy,
      joinedAt: member.joinedAt ? member.joinedAt.toISOString() : null,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    }));
  }
}
