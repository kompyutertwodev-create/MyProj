import { RoleAssignment } from '../../domain/assignment/RoleAssignment.js';
import { RoleAssignmentId } from '../../domain/assignment/RoleAssignmentId.js';
import type { AcRoleAssignmentRow } from '../database/schema/index.js';

/**
 * RoleAssignmentMapper вЂ” converts between the RoleAssignment aggregate and
 * `ac_role_assignments`.
 *
 * All fields are scalars: no JSONB columns and no companion join rows, so
 * the mapping is a straightforward 1:1 projection.
 */
export class RoleAssignmentMapper {
  static toDomain(row: AcRoleAssignmentRow): RoleAssignment {
    return RoleAssignment.reconstruct({
      id: new RoleAssignmentId(row.id),
      userId: row.userId,
      roleId: row.roleId,
      roleName: row.roleName,
      tenantId: row.tenantId,
      assignedBy: row.assignedBy,
      assignedAt: row.assignedAt,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      revokedBy: row.revokedBy,
      revokedReason: row.revokedReason,
      isExpired: row.isExpired,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
    });
  }

  static toPersistence(assignment: RoleAssignment): AcRoleAssignmentRow {
    return {
      id: assignment.id.value,
      userId: assignment.userId,
      roleId: assignment.roleId,
      roleName: assignment.roleName,
      tenantId: assignment.tenantId,
      assignedBy: assignment.assignedBy,
      assignedAt: assignment.assignedAt,
      expiresAt: assignment.expiresAt,
      revokedAt: assignment.revokedAt,
      revokedBy: assignment.revokedBy,
      revokedReason: assignment.revokedReason,
      isExpired: assignment.isExpired,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      version: assignment.version,
    };
  }
}