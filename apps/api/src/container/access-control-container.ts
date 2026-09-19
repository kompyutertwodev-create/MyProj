import {
  // Repositories
  DrizzleRoleRepository,
  DrizzlePolicyRepository,
  DrizzleRoleAssignmentRepository,
  DrizzleOutboxRepository,
  DrizzleAccessControlUnitOfWork,
  // Seeder
  RbacSeeder,
  // Handlers - Commands
  CreateRoleHandler,
  UpdateRoleHandler,
  DeleteRoleHandler,
  AddPermissionToRoleHandler,
  RemovePermissionFromRoleHandler,
  AssignRoleHandler,
  RevokeRoleHandler,
  CreatePolicyHandler,
  UpdatePolicyHandler,
  DeletePolicyHandler,
  ActivatePolicyHandler,
  DeactivatePolicyHandler,
  // Handlers - Queries
  GetRoleHandler,
  ListRolesHandler,
  ListUserRolesHandler,
  ListRoleAssignmentsHandler,
  GetPolicyHandler,
  ListPoliciesHandler,
  CheckPermissionHandler,
  // Services
  PolicyEvaluator,
} from '@workspace/access-control';
import {
  type PostgresDatabase,
  runSqlMigrations,
} from '@workspace/platform';
import { withAmbientContext } from './outbox-context.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export interface AccessControlContainer {
  // Repositories
  roles: DrizzleRoleRepository;
  policies: DrizzlePolicyRepository;
  roleAssignments: DrizzleRoleAssignmentRepository;
  outbox: DrizzleOutboxRepository;
  unitOfWork: DrizzleAccessControlUnitOfWork;

  // Services
  policyEvaluator: PolicyEvaluator;

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
}

export interface AccessControlContainerOptions {
  database: PostgresDatabase;
  runMigrations?: boolean;
  /** Run the RBAC seed (idempotent). Default: true. */
  runSeed?: boolean;
}

/**
 * Composition root for the access-control module.
 *
 * Note on the outbox: the module owns its own `ac_outbox_events` table and
 * writes to it inside each handler's transaction. A dispatcher that drains
 * this table is intentionally *not* started here — the platform owns the
 * runtime concern of publishing. When the platform ships an abstraction
 * that accepts any `OutboxPort`, wire it up here.
 */
export async function createAccessControlContainer(
  options: AccessControlContainerOptions,
): Promise<AccessControlContainer> {
  const { db } = options.database;

  // 1. Migrations
  if (options.runMigrations !== false) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const migrationsDir = join(
      __dirname,
      '../../../../modules/access-control/src/infrastructure/database/migrations',
    );
    await runSqlMigrations(options.database, migrationsDir);
  }

  // 2. Repositories
  const roles = new DrizzleRoleRepository(db);
  const policies = new DrizzlePolicyRepository(db);
  const roleAssignments = new DrizzleRoleAssignmentRepository(db);
  const outbox = withAmbientContext(new DrizzleOutboxRepository(db));
  const unitOfWork = new DrizzleAccessControlUnitOfWork(db);

  // 3. Seed (idempotent)
  if (options.runSeed !== false) {
    const seeder = new RbacSeeder(unitOfWork);
    await seeder.run();
  }

  // 4. Services
  const policyEvaluator = new PolicyEvaluator(policies, roles);

  // 5. Commands
  const createRole = new CreateRoleHandler(unitOfWork);
  const updateRole = new UpdateRoleHandler(unitOfWork);
  const deleteRole = new DeleteRoleHandler(unitOfWork);
  const addPermissionToRole = new AddPermissionToRoleHandler(unitOfWork);
  const removePermissionFromRole = new RemovePermissionFromRoleHandler(unitOfWork);
  const assignRole = new AssignRoleHandler(unitOfWork);
  const revokeRole = new RevokeRoleHandler(unitOfWork);
  const createPolicy = new CreatePolicyHandler(unitOfWork);
  const updatePolicy = new UpdatePolicyHandler(unitOfWork);
  const deletePolicy = new DeletePolicyHandler(unitOfWork);
  const activatePolicy = new ActivatePolicyHandler(unitOfWork);
  const deactivatePolicy = new DeactivatePolicyHandler(unitOfWork);

  // 6. Queries
  const getRole = new GetRoleHandler(unitOfWork);
  const listRoles = new ListRolesHandler(unitOfWork);
  const listUserRoles = new ListUserRolesHandler(unitOfWork);
  const listRoleAssignments = new ListRoleAssignmentsHandler(unitOfWork);
  const getPolicy = new GetPolicyHandler(unitOfWork);
  const listPolicies = new ListPoliciesHandler(unitOfWork);
  const checkPermission = new CheckPermissionHandler(roleAssignments, policyEvaluator);

  return {
    roles,
    policies,
    roleAssignments,
    outbox,
    unitOfWork,
    policyEvaluator,
    createRole,
    updateRole,
    deleteRole,
    addPermissionToRole,
    removePermissionFromRole,
    assignRole,
    revokeRole,
    createPolicy,
    updatePolicy,
    deletePolicy,
    activatePolicy,
    deactivatePolicy,
    getRole,
    listRoles,
    listUserRoles,
    listRoleAssignments,
    getPolicy,
    listPolicies,
    checkPermission,
  };
}