# IAM Module - Canonical Architecture

## Directory Structure

```
modules/iam/src/
├── domain/                          # Core business logic (no external dependencies)
│   ├── entities/                    # Aggregate roots
│   │   ├── User.ts
│   │   ├── Role.ts
│   │   └── Session.ts
│   ├── value-objects/               # Immutable value objects
│   │   ├── Email.ts
│   │   ├── PasswordHash.ts
│   │   ├── UserId.ts
│   │   ├── RoleId.ts
│   │   └── SessionId.ts
│   ├── events/                      # Domain events
│   │   ├── UserRegisteredEvent.ts
│   │   ├── UserLoggedInEvent.ts
│   │   └── ...
│   ├── domain-services/             # Domain service interfaces
│   │   ├── PasswordService.ts
│   │   └── TokenService.ts
│   ├── repositories/                # Repository interfaces (contracts)
│   │   ├── UserRepository.ts
│   │   ├── RoleRepository.ts
│   │   └── SessionRepository.ts
│   ├── specifications/             # Business rules
│   │   ├── ActiveUserSpec.ts
│   │   └── ...
│   ├── policy/                      # ABAC policy domain
│   │   ├── Policy.ts
│   │   ├── PolicyRepository.ts
│   │   └── ...
│   └── oauth/                       # OAuth domain
│       ├── OAuthProvider.ts
│       ├── SocialIdentity.ts
│       └── ...
│
├── application/                     # Use cases (orchestration)
│   ├── commands/                   # Write operations
│   │   ├── register-user/
│   │   │   ├── RegisterUserCommand.ts
│   │   │   ├── RegisterUserHandler.ts
│   │   │   └── RegisterUserResult.ts
│   │   ├── login-user/
│   │   ├── policy/
│   │   │   ├── create-policy/
│   │   │   ├── update-policy/
│   │   │   └── ...
│   │   └── ...
│   ├── queries/                     # Read operations
│   │   ├── check-permission/
│   │   ├── get-user/
│   │   ├── list-users/
│   │   └── ...
│   ├── services/                    # Application services
│   │   ├── AuthService.ts
│   │   ├── PolicyService.ts
│   │   └── ...
│   ├── strategies/                  # Strategy pattern implementations
│   │   ├── OAuthProviderRegistry.ts
│   │   └── ...
│   └── ports/                       # Application ports/interfaces
│       ├── ApplicationError.ts
│       ├── EventBusPort.ts
│       └── ...
│
├── infrastructure/                  # External concerns
│   ├── repositories/                # Repository implementations
│   │   ├── DrizzleUserRepository.ts
│   │   ├── DrizzleRoleRepository.ts
│   │   ├── InMemoryUserRepository.ts
│   │   └── ...
│   ├── database/                    # Database schema & migrations
│   │   ├── schema/
│   │   │   ├── identities.table.ts
│   │   │   ├── roles.table.ts
│   │   │   └── ...
│   │   ├── seed/
│   │   │   └── RbacSeeder.ts
│   │   └── DrizzleIamUnitOfWork.ts
│   ├── mappers/                     # Domain ↔ Persistence mapping
│   │   ├── UserMapper.ts
│   │   └── RoleMapper.ts
│   ├── security/                    # Security implementations
│   │   ├── BcryptPasswordHasher.ts
│   │   ├── JsonWebTokenService.ts
│   │   └── ...
│   ├── oauth/                       # OAuth provider implementations
│   │   ├── GoogleOAuthProvider.ts
│   │   ├── GitHubOAuthProvider.ts
│   │   └── ...
│   ├── cache/                       # Caching implementations
│   │   ├── MemorySessionCache.ts
│   │   └── ...
│   └── messaging/                   # Event bus implementations
│       └── InMemoryIamEventBus.ts
│
└── presentation/                    # HTTP/External interfaces
    └── http/
        ├── controllers/             # Request handlers
        │   ├── AuthController.ts
        │   ├── UserController.ts
        │   ├── RoleController.ts
        │   ├── PolicyController.ts
        │   ├── PermissionController.ts
        │   └── OAuthController.ts
        ├── middleware/              # Express middleware
        │   ├── AuthGuard.ts
        │   ├── RoleGuard.ts
        │   ├── PermissionGuard.ts
        │   └── ValidateRequest.ts
        ├── validators/              # Zod schemas
        │   ├── auth/
        │   ├── user/
        │   └── ...
        └── transformers/            # Response transformers
```

## Dependency Rules

### Strict Layer Dependencies

```
Presentation
    ↓
Application
    ↓
Domain
```

```
Infrastructure
    ↑
implements interfaces from Domain/Application
```

### Forbidden Patterns

❌ **Controller → Database**
❌ **Controller → Prisma/Drizzle**
❌ **Controller → Supabase**
❌ **Application Handler → HTTP**
❌ **Domain → External Libraries**

### Allowed Patterns

✅ **Controller → Application Handler/Service**
✅ **Application Handler → Domain Entity/Repository Interface**
✅ **Infrastructure → Domain Interface (implements)**
✅ **Domain → Domain (entities, VOs, events)**

## Module Exports

### Public API (`src/index.ts`)

Export only what consumers need:

- Router factories
- Middleware factories
- Application handlers (for testing)
- Repository implementations (for DI)
- In-memory repositories (for testing)
- Domain service interfaces (for mocking)

**Do NOT export:**

- Domain entities (unless explicitly needed)
- Internal infrastructure details
- Database schemas

## Composition Root

The app consuming this module (`apps/api`) is responsible for:

1. Creating repository instances (Drizzle/InMemory)
2. Creating infrastructure services (JWT, Password)
3. Registering OAuth providers
4. Wiring all dependencies in container
5. Starting background workers (event dispatcher)

Example:

```typescript
// apps/api/src/container/iam-container.ts
export async function createIamContainer(): Promise<IamContainer> {
  // 1. Repositories
  const users = new DrizzleUserRepository(db);
  const roles = new DrizzleRoleRepository(db);

  // 2. Infrastructure
  const passwordService = new BcryptPasswordHasher();
  const tokenService = new IamJwtService();

  // 3. Handlers
  const registerUser = new RegisterUserHandler(users, passwordService, roles, events, unitOfWork);

  // 4. Controllers
  const authRouter = createAuthRouter({ registerUser, loginUser, ... });

  return { users, roles, registerUser, authRouter, ... };
}
```

## Testing Strategy

### Unit Tests

- Test domain entities in isolation
- Test application handlers with in-memory repositories
- Mock domain services

### Integration Tests

- Use in-memory repositories for fast tests
- Test full use case flows
- Test event publishing

### E2E Tests

- Use real database (test instance)
- Test HTTP endpoints
- Test OAuth flows with mock providers

## Event-Driven Architecture

### Domain Events

- Raised by domain entities
- Collected by AggregateRoot
- Published via EventBusPort

### Outbox Pattern

- Events stored in outbox table
- Dispatcher reads and publishes
- Ensures at-least-once delivery
- Idempotent handlers required

## Security

### Authentication

- JWT access tokens (15 min TTL)
- Refresh tokens (30 days TTL)
- Bcrypt/Argon2 password hashing

### Authorization

- RBAC: Role-based access control
- ABAC: Attribute-based access control (policies)
- Guards: AuthGuard → RoleGuard → PermissionGuard

### OAuth

- State parameter for CSRF protection
- Cookie-bound state verification
- Provider-specific flows (Google, GitHub, Telegram)

## Error Handling

### Domain Errors

- `DomainError` - Business rule violations
- Returned as `Result<T, DomainError>`

### Application Errors

- `ApplicationError` - Use case failures
- Mapped to HTTP status codes
- Structured error responses

### Infrastructure Errors

- Logged and wrapped in ApplicationError
- Generic error messages to clients
- Detailed errors in logs
