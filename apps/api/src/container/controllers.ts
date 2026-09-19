import type { Router } from 'express';
import { createAuthGuard, createIamRouter } from '@workspace/iam';
import { createTenantRouter } from '@workspace/tenant';
import { createAuditRouter } from '@workspace/audit';
import { createNotificationRouter } from '@workspace/notification';
import { createAccessControlRouter } from '@workspace/access-control';
import type { IamContainer } from './iam-container.js';
import type { TenantContainer } from './tenant-container.js';
import type { AuditContainer } from './audit-container.js';
import type { NotificationContainer } from './notification-container.js';
import type { AccessControlContainer } from './access-control-container.js';

export function createIamRouterFromContainer(container: IamContainer): Router {
  return createIamRouter({
    auth: {
      registerUser: container.registerUser,
      loginUser: container.loginUser,
      logoutUser: container.logoutUser,
      changePassword: container.changePassword,
      setInitialPassword: container.setInitialPassword,
      authService: container.authService,
      authGuard: createAuthGuard(container.tokenService),
    },
    getUser: container.getUser,
    listUsers: container.listUsers,
    assignRole: container.assignRole,
    checkPermission: container.checkPermission,
    listRoles: container.listRoles,
    oauth: {
      initiateOAuth: container.initiateOAuth,
      registry: container.providerRegistry,
      stateRepository: container.oauthStates,
      login: container.oauthLogin,
      link: container.linkSocialAccount,
    },
    policy: {
      createPolicy: container.createPolicy,
      updatePolicy: container.updatePolicy,
      deletePolicy: container.deletePolicy,
      activatePolicy: container.activatePolicy,
      deactivatePolicy: container.deactivatePolicy,
      listPolicies: container.listPolicies,
      getPolicy: container.getPolicy,
      service: container.policyService,
    },
  });
}

export function createTenantRouterFromContainer(
  container: TenantContainer,
  authGuard: ReturnType<typeof createAuthGuard>
): Router {
  return createTenantRouter({
    createTenant: container.createTenant,
    getTenant: container.getTenant,
    listTenants: container.listTenants,
    listMembers: container.listMembers,
    authGuard,
  });
}

export function createAuditRouterFromContainer(
  container: AuditContainer,
  authGuard: ReturnType<typeof createAuthGuard>
): Router {
  return createAuditRouter({
    listAuditLogs: container.listAuditLogs,
    authGuard,
  });
}

export function createNotificationRouterFromContainer(
  container: NotificationContainer,
  authGuard: ReturnType<typeof createAuthGuard>
): Router {
  return createNotificationRouter({
    sendNotification: container.sendNotification,
    listNotifications: container.listNotifications,
    authGuard,
  });
}

/**
 * Router factory for the access-control module.
 *
 * `authGuard` is injected by the composition root so `access-control`
 * remains independent of `iam`: it only knows it needs *some* middleware
 * that authenticates the caller.
 */
export function createAccessControlRouterFromContainer(
  container: AccessControlContainer,
  authGuard: ReturnType<typeof createAuthGuard>
): Router {
  return createAccessControlRouter({
    createRole: container.createRole,
    updateRole: container.updateRole,
    deleteRole: container.deleteRole,
    addPermissionToRole: container.addPermissionToRole,
    removePermissionFromRole: container.removePermissionFromRole,
    assignRole: container.assignRole,
    revokeRole: container.revokeRole,
    createPolicy: container.createPolicy,
    updatePolicy: container.updatePolicy,
    deletePolicy: container.deletePolicy,
    activatePolicy: container.activatePolicy,
    deactivatePolicy: container.deactivatePolicy,
    getRole: container.getRole,
    listRoles: container.listRoles,
    listUserRoles: container.listUserRoles,
    listRoleAssignments: container.listRoleAssignments,
    getPolicy: container.getPolicy,
    listPolicies: container.listPolicies,
    checkPermission: container.checkPermission,
    authGuard,
  });
}