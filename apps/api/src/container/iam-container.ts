import {
  BcryptPasswordHasher,
  AuthService,
  ChangePasswordHandler,
  GitHubOAuthProvider,
  GoogleOAuthProvider,
  DrizzleOAuthStateRepository,
  DrizzleOutboxRepository,
  DrizzleSessionRepository,
  DrizzleSocialIdentityRepository,
  DrizzleUserRepository,
  LinkSocialAccountHandler,
  LoginUserHandler,
  LogoutUserHandler,
  OAuthLoginHandler,
  OAuthProviderRegistry,
  RegisterUserHandler,
  SetInitialPasswordHandler,
  DrizzleIamUnitOfWork,
  TelegramOAuthProvider,
  IamJwtService,
  GetUserHandler,
  GetUserByEmailHandler,
  ListUsersHandler,
  SuspendUserHandler,
  InitiateOAuthHandler,
} from '@workspace/iam';
import {
  createPlatformEventBus,
  JsonWebTokenService as PlatformJwtService,
  OutboxEventBus,
  OutboxEventDispatcher,
  type PostgresDatabase,
  runSqlMigrations,
} from '@workspace/platform';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Composition root for the IAM module.
 *
 * Owns identity data only РІР‚вЂќ sessions, users, OAuth. RBAC (roles,
 * permissions, ABAC policies) lives in @workspace/access-control and is
 * wired in a separate container (see access-control-container.ts).
 */
export interface IamContainer {
  users: DrizzleUserRepository;
  sessions: DrizzleSessionRepository;
  socialIdentities: DrizzleSocialIdentityRepository;
  oauthStates: DrizzleOAuthStateRepository;
  outbox: DrizzleOutboxRepository;
  unitOfWork: DrizzleIamUnitOfWork;
  passwordService: BcryptPasswordHasher;
  tokenService: IamJwtService;
  providerRegistry: OAuthProviderRegistry;
  authService: AuthService;
  registerUser: RegisterUserHandler;
  loginUser: LoginUserHandler;
  logoutUser: LogoutUserHandler;
  changePassword: ChangePasswordHandler;
  setInitialPassword: SetInitialPasswordHandler;
  suspendUser: SuspendUserHandler;
  oauthLogin: OAuthLoginHandler;
  linkSocialAccount: LinkSocialAccountHandler;
  initiateOAuth: InitiateOAuthHandler;
  getUser: GetUserHandler;
  getUserByEmail: GetUserByEmailHandler;
  listUsers: ListUsersHandler;
  events: OutboxEventBus;
  outboxDispatcher: OutboxEventDispatcher;
}

export interface IamContainerOptions {
  database: PostgresDatabase;
  startBackgroundWorkers?: boolean;
  runMigrations?: boolean;
}

export async function createIamContainer(options: IamContainerOptions): Promise<IamContainer> {
  const { db } = options.database;

  if (options.runMigrations !== false) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const migrationsDir = join(
      __dirname,
      '../../../../modules/iam/src/infrastructure/database/migrations',
    );
    await runSqlMigrations(options.database, migrationsDir);
  }

  const users = new DrizzleUserRepository(db);
  const sessions = new DrizzleSessionRepository(db);
  const socialIdentities = new DrizzleSocialIdentityRepository(db);
  const oauthStates = new DrizzleOAuthStateRepository(db);
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
    new PlatformJwtService({ secret: process.env['JWT_SECRET'] }),
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
    if (!googleRedirectUri) {
      throw new Error('GOOGLE_REDIRECT_URI is required when Google OAuth is configured');
    }
    providerRegistry.register(
      new GoogleOAuthProvider({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        redirectUri: googleRedirectUri,
      }),
    );
  }
  if (githubClientId && githubClientSecret) {
    if (!githubRedirectUri) {
      throw new Error('GITHUB_REDIRECT_URI is required when GitHub OAuth is configured');
    }
    providerRegistry.register(
      new GitHubOAuthProvider({
        clientId: githubClientId,
        clientSecret: githubClientSecret,
        redirectUri: githubRedirectUri,
      }),
    );
  }
  if (telegramBotToken && process.env['TELEGRAM_BOT_USERNAME']) {
    providerRegistry.register(
      new TelegramOAuthProvider({
        botToken: telegramBotToken,
        botUsername: process.env['TELEGRAM_BOT_USERNAME'],
      }),
    );
  }

  const registerUser = new RegisterUserHandler(users, passwordService, events, unitOfWork);
  const loginUser = new LoginUserHandler(
    users,
    sessions,
    passwordService,
    tokenService,
    events,
    unitOfWork,
  );
  const logoutUser = new LogoutUserHandler(sessions, events);
  const changePassword = new ChangePasswordHandler(users, passwordService, events);
  const setInitialPassword = new SetInitialPasswordHandler(
    users,
    passwordService,
    events,
    unitOfWork,
  );
  const suspendUser = new SuspendUserHandler(users, events);
  const oauthLogin = new OAuthLoginHandler(
    providerRegistry,
    socialIdentities,
    users,
    sessions,
    tokenService,
    passwordService,
    unitOfWork,
    events,
  );
  const linkSocialAccount = new LinkSocialAccountHandler(providerRegistry, socialIdentities);
  const initiateOAuth = new InitiateOAuthHandler(providerRegistry, oauthStates);

  const authService = new AuthService(loginUser, logoutUser, sessions, users, tokenService);

  const getUser = new GetUserHandler(users);
  const getUserByEmail = new GetUserByEmailHandler(users);
  const listUsers = new ListUsersHandler(users);

  return {
    users,
    sessions,
    socialIdentities,
    oauthStates,
    outbox,
    unitOfWork,
    passwordService,
    tokenService,
    providerRegistry,
    authService,
    registerUser,
    loginUser,
    logoutUser,
    changePassword,
    setInitialPassword,
    suspendUser,
    oauthLogin,
    linkSocialAccount,
    initiateOAuth,
    getUser,
    getUserByEmail,
    listUsers,
    events,
    outboxDispatcher,
  };
}