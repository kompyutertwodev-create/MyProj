import { Router, type RequestHandler } from 'express';
import type { CreateRoleHandler } from '../application/commands/create-role/index.js';
import type { UpdateRoleHandler } from '../application/commands/update-role/index.js';
import type { DeleteRoleHandler } from '../application/commands/delete-role/index.js';
import type { AddPermissionToRoleHandler } from '../application/commands/add-permission-to-role/index.js';
import type { RemovePermissionFromRoleHandler } from '../application/commands/remove-permission-from-role/index.js';
import type { AssignRoleHandler } from '../application/commands/assign-role/index.js';
import type { RevokeRoleHandler } from '../application/commands/revoke-role/index.js';
import type { CreatePolicyHandler } from '../application/commands/create-policy/index.js';
import type { UpdatePolicyHandler } from '../application/commands/update-policy/index.js';
import type { DeletePolicyHandler } from '../application/commands/delete-policy/index.js';
import type { ActivatePolicyHandler } from '../application/commands/activate-policy/index.js';
import type { DeactivatePolicyHandler } from '../application/commands/deactivate-policy/index.js';
import type { GetRoleHandler } from '../application/queries/get-role/index.js';
import type { ListRolesHandler } from '../application/queries/list-roles/index.js';
import type { ListUserRolesHandler } from '../application/queries/list-user-roles/index.js';
import type { ListRoleAssignmentsHandler } from '../application/queries/list-role-assignments/index.js';
import type { GetPolicyHandler } from '../application/queries/get-policy/index.js';
import type { ListPoliciesHandler } from '../application/queries/list-policies/index.js';
import type { CheckPermissionHandler } from '../application/queries/check-permission/index.js';
import { createRoleRouter } from './http/controllers/RoleController.js';
import { createPolicyRouter } from './http/controllers/PolicyController.js';
import { createAssignmentRouter } from './http/controllers/AssignmentController.js';
import { createPermissionRouter } from './http/controllers/PermissionController.js';

export interface AccessControlRouterDependencies {
  // Commands
  createRole: CreateRoleHandler;
  updateRole: UpdateRoleHandler;
  deleteRole: DeleteRoleHandler;
  addPermissionToRole: AddPermissionToRoleHandler;
  removePermissionFromRole: RemovePermissionFromRoleHandler;
  assignRole: AssignRoleHandler;
  revokeRole: RevokeRoleHandler;
  createPolicy: CreatePolicyHandler;
  updatePolicy: UpdatePolicyHandler;
  deletePolicy: DeletePolicyHandler;
  activatePolicy: ActivatePolicyHandler;
  deactivatePolicy: DeactivatePolicyHandler;

  // Queries
  getRole: GetRoleHandler;
  listRoles: ListRolesHandler;
  listUserRoles: ListUserRolesHandler;
  listRoleAssignments: ListRoleAssignmentsHandler;
  getPolicy: GetPolicyHandler;
  listPolicies: ListPoliciesHandler;
  checkPermission: CheckPermissionHandler;

  // Auth
  authGuard: RequestHandler;
}

export function createAccessControlRouter(deps: AccessControlRouterDependencies): Router {
  const router = Router();

  router.use(
    '/roles',
    createRoleRouter({
      createRole: deps.createRole,
      updateRole: deps.updateRole,
      deleteRole: deps.deleteRole,
      addPermissionToRole: deps.addPermissionToRole,
      removePermissionFromRole: deps.removePermissionFromRole,
      getRole: deps.getRole,
      listRoles: deps.listRoles,
      authGuard: deps.authGuard,
    }),
  );

  router.use(
    '/policies',
    createPolicyRouter({
      createPolicy: deps.createPolicy,
      updatePolicy: deps.updatePolicy,
      deletePolicy: deps.deletePolicy,
      activatePolicy: deps.activatePolicy,
      deactivatePolicy: deps.deactivatePolicy,
      getPolicy: deps.getPolicy,
      listPolicies: deps.listPolicies,
      authGuard: deps.authGuard,
    }),
  );

  router.use(
    '/assignments',
    createAssignmentRouter({
      assignRole: deps.assignRole,
      revokeRole: deps.revokeRole,
      listUserRoles: deps.listUserRoles,
      listRoleAssignments: deps.listRoleAssignments,
      authGuard: deps.authGuard,
    }),
  );

  router.use(
    '/permissions',
    createPermissionRouter({
      checkPermission: deps.checkPermission,
      authGuard: deps.authGuard,
    }),
  );

  return router;
}