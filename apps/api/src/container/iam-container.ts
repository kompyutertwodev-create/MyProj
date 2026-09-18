import {
  BcryptPasswordHasher,
  AuthService,
  AssignRoleHandler,
  ChangePasswordHandler,
  CheckPermissionHandler,
  GitHubOAuthProvider,
  GoogleOAuthProvider,
  DrizzlePolicyRepository,
  DrizzleOAuthStateRepository,
  DrizzleOutboxRepository,
  DrizzleRoleRepository,
  DrizzleSessionRepository,
  DrizzleSocialIdentityRepository,
  DrizzleUserRepository,
  LinkSocialAccountHandler,
  LoginUserHandler,
  LogoutUserHandler,
  OAuthLoginHandler,
  OAuthProviderRegistry,
  PolicyService,
  RegisterUserHandler,
  SetInitialPasswordHandler,
  seedDefaultRbac,
  DrizzleIamUnitOfWork,
  TelegramOAuthProvider,
  IamJwtService,
  GetUserHandler,
  ListUsersHandler,
  CreatePolicyHandler,
  UpdatePolicyHandler,
  DeletePolicyHandler,
  ActivatePolicyHandler,
  DeactivatePolicyHandler,
  ListPoliciesHandler,
  GetPolicyHandler,
  ListRolesHandler,
  InitiateOAuthHandler,
} from '@workspace/iam';
import {
  createPlatformEventBus,
  JsonWebTokenService as PlatformJwtService,
  OutboxEventBus,
  OutboxEventDispatcher,
  type PostgresDatabase,
} from '@workspace/platform';

export interface IamContainer {
  users: DrizzleUserRepository;
  roles: DrizzleRoleRepository;
  sessions: DrizzleSessionRepository;
  socialIdentities: DrizzleSocialIdentityRepository;
  policies: DrizzlePolicyRepository;
  oauthStates: DrizzleOAuthStateRepository;
  outbox: DrizzleOutboxRepository;
  unitOfWork: DrizzleIamUnitOfWork;
  passwordService: BcryptPasswordHasher;
  tokenService: IamJwtService;
  providerRegistry: OAuthProviderRegistry;
  authService: AuthService;
  policyService: PolicyService;
  registerUser: RegisterUserHandler;
  loginUser: LoginUserHandler;
  logoutUser: LogoutUserHandler;
  changePassword: ChangePasswordHandler;
  setInitialPassword: SetInitialPasswordHandler;
  assignRole: AssignRoleHandler;
  oauthLogin: OAuthLoginHandler;
  linkSocialAccount: LinkSocialAccountHandler;
  initiateOAuth: InitiateOAuthHandler;
  createPolicy: CreatePolicyHandler;
  updatePolicy: UpdatePolicyHandler;
  deletePolicy: DeletePolicyHandler;
  activatePolicy: ActivatePolicyHandler;
  deactivatePolicy: DeactivatePolicyHandler;
  getUser: GetUserHandler;
  listUsers: ListUsersHandler;
  checkPermission: CheckPermissionHandler;
  listPolicies: ListPoliciesHandler;
  getPolicy: GetPolicyHandler;
  listRoles: ListRolesHandler;
  events: OutboxEventBus;
  outboxDispatcher: OutboxEventDispatcher;
}

export interface IamContainerOptions {
  database: PostgresDatabase;
  startBackgroundWorkers?: boolean;
}

export async function createIamContainer(options: IamContainerOptions): Promise<IamContainer> {
  const { db } = options.database;

  const users = new DrizzleUserRepository(db);
  const roles = new DrizzleRoleRepository(db);
  const sessions = new DrizzleSessionRepository(db);
  const socialIdentities = new DrizzleSocialIdentityRepository(db);
  const policies = new DrizzlePolicyRepository(db);
  const oauthStates = new DrizzleOAuthStateRepository(db);
  await seedDefaultRbac(db);
  const unitOfWork = new DrizzleIamUnitOfWork(db);

  const outbox = new DrizzleOutboxRepository(db);
  const transport = createPlatformEventBus();
  const events = new OutboxEventBus(outbox, transport);
  const outboxDispatcher = new OutboxEventDispatcher(outbox, transport);
  if (options.startBackgroundWorkers !== false) {
    outboxDispatcher.start();
  }

  const passwordService = new BcryptPasswordHasher();
  const tokenService = new IamJwtService(
    new PlatformJwtService({ secret: process.env['JWT_SECRET'] })
  );

  const providerRegistry = new OAuthProviderRegistry();
  const googleClientId = process.env['GOOGLE_CLIENT_ID'];
  const googleClientSecret = process.env['GOOGLE_CLIENT_SECRET'];
  const googleRedirectUri = process.env['GOOGLE_REDIRECT_URI'];
  const githubClientId = process.env['GITHUB_CLIENT_ID'];
  const githubClientSecret = process.env['GITHUB_CLIENT_SECRET'];
  const githubRedirectUri = process.env['GITHUB_REDIRECT_URI'];
  const telegramBotToken = process.env['TELEGRAM_BOT_TOKEN'];

  if (googleClientId && googleClientSecret) {
    if (!googleRedirectUri)
      throw new Error('GOOGLE_REDIRECT_URI is required when Google OAuth is configured');
    providerRegistry.register(
      new GoogleOAuthProvider({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        redirectUri: googleRedirectUri,
      })
    );
  }
  if (githubClientId && githubClientSecret) {
    if (!githubRedirectUri)
      throw new Error('GITHUB_REDIRECT_URI is required when GitHub OAuth is configured');
    providerRegistry.register(
      new GitHubOAuthProvider({
        clientId: githubClientId,
        clientSecret: githubClientSecret,
        redirectUri: githubRedirectUri,
      })
    );
  }
  if (telegramBotToken && process.env['TELEGRAM_BOT_USERNAME']) {
    providerRegistry.register(
      new TelegramOAuthProvider({
        botToken: telegramBotToken,
        botUsername: process.env['TELEGRAM_BOT_USERNAME'],
      })
    );
  }

  const registerUser = new RegisterUserHandler(users, passwordService, roles, events, unitOfWork);
  const loginUser = new LoginUserHandler(
    users,
    sessions,
    passwordService,
    tokenService,
    events,
    unitOfWork
  );
  const logoutUser = new LogoutUserHandler(sessions, events);
  const changePassword = new ChangePasswordHandler(users, passwordService, events);
  const setInitialPassword = new SetInitialPasswordHandler(
    users,
    passwordService,
    events,
    unitOfWork
  );
  const assignRole = new AssignRoleHandler(users, roles, events, unitOfWork);
  const oauthLogin = new OAuthLoginHandler(
    providerRegistry,
    socialIdentities,
    users,
    sessions,
    tokenService,
    passwordService,
    roles,
    unitOfWork,
    events
  );
  const linkSocialAccount = new LinkSocialAccountHandler(providerRegistry, socialIdentities);
  const initiateOAuth = new InitiateOAuthHandler(providerRegistry, oauthStates);

  const policyService = new PolicyService(policies, users);
  const authService = new AuthService(loginUser, logoutUser, sessions, users, tokenService);

  const createPolicy = new CreatePolicyHandler(policies);
  const updatePolicy = new UpdatePolicyHandler(policies);
  const deletePolicy = new DeletePolicyHandler(policies);
  const activatePolicy = new ActivatePolicyHandler(policies);
  const deactivatePolicy = new DeactivatePolicyHandler(policies);

  const getUser = new GetUserHandler(users);
  const listUsers = new ListUsersHandler(users);
  const checkPermission = new CheckPermissionHandler(users);
  const listPolicies = new ListPoliciesHandler(policies);
  const getPolicy = new GetPolicyHandler(policies);
  const listRoles = new ListRolesHandler(roles);

  return {
    users,
    roles,
    sessions,
    socialIdentities,
    policies,
    oauthStates,
    outbox,
    unitOfWork,
    passwordService,
    tokenService,
    providerRegistry,
    authService,
    policyService,
    registerUser,
    loginUser,
    logoutUser,
    changePassword,
    setInitialPassword,
    assignRole,
    oauthLogin,
    linkSocialAccount,
    initiateOAuth,
    createPolicy,
    updatePolicy,
    deletePolicy,
    activatePolicy,
    deactivatePolicy,
    getUser,
    listUsers,
    checkPermission,
    listPolicies,
    getPolicy,
    listRoles,
    events,
    outboxDispatcher,
  };
}
