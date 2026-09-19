import { Member, MemberRole, MemberStatus } from '../../domain/index.js';

export interface MemberPersistence {
  id: string;
  tenantId: string;
  userId: string;
  role: MemberRole;
  status: MemberStatus;
  invitedBy: string | null;
  joinedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class MemberMapper {
  static toDomain(row: MemberPersistence): Member {
    return Member.reconstruct({
      id: row.id,
      userId: row.userId,
      role: row.role,
      status: row.status,
      invitedBy: row.invitedBy,
      joinedAt: row.joinedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(member: Member, tenantId: string): MemberPersistence {
    return {
      id: member.id.value,
      tenantId,
      userId: member.userId,
      role: member.role,
      status: member.status,
      invitedBy: member.invitedBy,
      joinedAt: member.joinedAt,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };
  }
}