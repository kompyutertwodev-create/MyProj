# Arxitektura

## Umumiy tamoyillar

Loyiha **Domain-Driven Design (DDD)**, **Clean Architecture** va **Hexagonal Architecture** tamoyillari asosida qurilgan.

Asosiy g'oyalar:
1. **Domain** — biznes-logika **markazda**. Hech qanday **tashqi** bog'liqlik yo'q.
2. **Application** — use case'lar. **Faqat** domain va port'larga tayanadi.
3. **Infrastructure** — implementatsiya. Domain interfeyslarini **bajaradi**.
4. **Presentation** — HTTP/GraphQL/gRPC qatlami. **Faqat** application handler'larni **chaqiradi**.

## Qatlamlar

```
┌──────────────────────────────────────────────────┐
│  Presentation (HTTP, GraphQL, gRPC)              │
│  - Controllers, Validators, Middleware           │
└──────────────────┬───────────────────────────────┘
                   │  calls
                   ▼
┌──────────────────────────────────────────────────┐
│  Application (Use Cases)                         │
│  - Commands, Queries, Handlers                   │
│  - Ports (interfaces)                            │
└──────────────────┬───────────────────────────────┘
                   │  uses
                   ▼
┌──────────────────────────────────────────────────┐
│  Domain (Business Logic)                         │
│  - Aggregates, Entities, Value Objects           │
│  - Domain Events, Repositories (interfaces)      │
└──────────────────┬───────────────────────────────┘
                   ▲
                   │  implements
┌──────────────────┴───────────────────────────────┐
│  Infrastructure                                  │
│  - Repositories (Drizzle, InMemory)              │
│  - Mappers, Database Schemas, Migrations         │
│  - External Adapters (Email, Telegram, OAuth)    │
└──────────────────────────────────────────────────┘
```

### Bog'liqlik qoidalari

**Ruxsat etilgan:**
- ✅ Controller → Application Handler
- ✅ Application Handler → Domain Entity/Repository Interface
- ✅ Infrastructure → Domain Interface (implements)
- ✅ Domain → Domain (entity, VO, event)
- ✅ Modul A → Modul B **event** orqali (event bus)
- ✅ Modul A → Modul B **port** orqali (interface + adapter)

**Taqiqlangan:**
- ❌ Controller → Database
- ❌ Controller → Drizzle/Prisma
- ❌ Application Handler → HTTP
- ❌ Domain → External Libraries
- ❌ Modul A → Modul B **domain** (to'g'ridan-to'g'ri import)

## Monorepo tuzilishi

```
apps/                    # Deploy qilinadigan ilovalar
├── api/                 # Express HTTP server
├── web/                 # Next.js web
├── admin/               # Next.js admin panel
├── mobile/              # Expo mobile
└── telegram/            # grammY bot

modules/                 # Domen modullari
├── iam/                 # ✅ Auth + Users + OAuth
├── access-control/      # ✅ RBAC + ABAC
├── tenant/              # ✅ Multi-tenancy
├── audit/               # ✅ Event-driven audit log
├── notification/        # ✅ Email + Telegram
├── billing/             # 🟡 To'lovlar
├── subscription/        # 🟡 SaaS obuna
├── catalog/             # 🟡 Biznes ma'lumotlar
├── content/             # 🟡 Kontent boshqaruvi
├── media/               # 🟡 Fayl yuklash
├── search/              # 🟡 Qidiruv
├── analytics/           # 🟡 Analitika
├── reports/             # 🟡 Hisobotlar
├── advertising/         # 🟡 Reklama
├── integrations/        # 🟡 Tashqi integratsiyalar
├── social/              # 🟡 Ijtimoiy tarmoqlar
├── devices/             # 🟡 Qurilmalar
├── features/            # 🟡 Feature flags
└── admin/               # 🟡 Admin

packages/                # Umumiy kutubxonalar
├── kernel/              # DDD asoslari + EventMetadata
├── platform/            # Platforma servislari
├── contracts/           # Umumiy tiplar
├── ui/                  # UI komponentlar
└── tooling/             # ESLint, Prettier, tsconfig

lib/                     # API klientlar
tests/                   # Umumiy testlar
deployment/              # Docker, K8s
```

## Modul tuzilishi (DDD)

Har bir modul **4 qatlamdan** iborat:

```
modules/<module>/src/
├── domain/
│   ├── <Aggregate>.ts
│   ├── <Entity>.ts
│   ├── <VO>.ts
│   ├── <Enum>.ts
│   ├── events/
│   │   ├── <Name>Event.ts
│   │   └── index.ts
│   ├── repositories/
│   │   └── <Name>Repository.ts
│   └── index.ts
├── application/
│   ├── ports/
│   │   ├── ApplicationError.ts
│   │   ├── EventBusPort.ts
│   │   ├── OutboxPort.ts
│   │   ├── <Module>UnitOfWork.ts
│   │   └── index.ts
│   ├── commands/
│   │   ├── <action>/
│   │   │   ├── <Action>Command.ts
│   │   │   ├── <Action>Handler.ts
│   │   │   ├── <Action>Result.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── queries/
│   │   ├── <Name>View.ts
│   │   ├── <action>/
│   │   │   ├── <Action>Query.ts
│   │   │   ├── <Action>Handler.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── event-handlers/
│   ├── services/
│   └── index.ts
├── infrastructure/
│   ├── database/
│   │   ├── schema/
│   │   │   ├── <table>.table.ts
│   │   │   └── index.ts
│   │   ├── migrations/
│   │   │   └── 0001_create_<table>.sql
│   │   └── <Module>UnitOfWork.ts
│   ├── mappers/
│   ├── repositories/
│   │   ├── Drizzle<Name>Repository.ts
│   │   └── InMemory<Name>Repository.ts
│   └── index.ts
├── presentation/
│   ├── http/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── validators/
│   └── index.ts
└── index.ts
```

## Event-driven arxitektura

### Domain Events (minimal)

Har bir **aggregate** o'z **event'larini** chiqaradi:

```typescript
export class RoleCreatedEvent implements DomainEvent {
  readonly eventId = randomUUID();
  readonly eventName = 'access-control.role.created';
  readonly occurredAt = new Date();
  readonly aggregateType = 'Role';

  constructor(
    readonly aggregateId: string,
    readonly tenantId: string | null,
    readonly name: string,
    readonly isSystem: boolean,
  ) {}
}
```

### Event Metadata (cross-cutting)

**`@workspace/kernel`** — event metadata envelope:

```typescript
export interface EventMetadata {
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly actorId?: string;
  readonly tenantId?: string | null;
  readonly recordedAt?: Date;
  readonly aggregateVersion?: number;
  readonly schemaVersion?: number;
  readonly extras?: Readonly<Record<string, unknown>>;
}

export interface EventEnvelope<TEvent extends DomainEvent = DomainEvent> {
  readonly event: TEvent;
  readonly metadata: EventMetadata;
}

export interface EventContext {
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly actorId?: string;
  readonly tenantId?: string | null;
  readonly extras?: Readonly<Record<string, unknown>>;
}
```

**Helpers:** `envelopeOf`, `mergeContext`, `metadataFromContext`, `EMPTY_EVENT_CONTEXT`.

### Outbox Pattern

Event'lar **transaction** ichida **outbox** jadvalga yoziladi:

```typescript
await this.uow.withTransaction(async (tx) => {
  await tx.roles.save(role);
  await tx.outbox.enqueueAll(role.pullDomainEvents());
});
```

**OutboxPort** (access-control):
- `enqueue(event, context?)`
- `enqueueAll(events, context?)`
- `enqueueEnvelopes(envelopes)`

### Event Subscriber'lar

Boshqa modul **event'larini** **tinglaydi**:

```typescript
export class AuditEventSubscriber {
  async handle(event: DomainEvent): Promise<void> {
    if (event.eventName === 'access-control.role.created') {
      await this.recordAudit.execute({ /* ... */ });
    }
  }
}
```

**Muhim:** EventBus **wildcard qo'llab-quvvatlamaydi** — har bir event **alohida** subscribe qilinadi.

## Modul chegaralari

### `iam` ↔ `access-control` — AuthorizationPort

`iam` **`access-control`**ni **to'g'ridan-to'g'ri import qilmaydi**.

**Yechim:** `AuthorizationPort`:

```typescript
// iam/application/ports/AuthorizationPort.ts
export interface AuthorizationPort {
  getRoleNames(userId: string): Promise<string[]>;
  checkPermission(input: {
    userId: string;
    resource: string;
    action: string;
    resourceAttributes?: Record<string, unknown>;
    environmentAttributes?: Record<string, unknown>;
  }): Promise<{ allowed: boolean; reason: string }>;
}
```

**Implementatsiya** — `access-control`da:

```typescript
// access-control/application/adapters/AccessControlAuthorizationAdapter.ts
export class AccessControlAuthorizationAdapter implements AuthorizationPort {
  constructor(
    private readonly checkPermissionHandler: CheckPermissionHandler,
    private readonly listUserRolesHandler: ListUserRolesHandler,
  ) {}

  async getRoleNames(userId: string): Promise<string[]> { /* ... */ }
  async checkPermission(input): Promise<{ allowed: boolean; reason: string }> { /* ... */ }
}
```

**Wire** — `apps/api`:

```typescript
const authorization = new AccessControlAuthorizationAdapter(
  accessControlContainer.checkPermission,
  accessControlContainer.listUserRoles,
);
const iamContainer = await createIamContainer({ database, authorization });
```

### `notification` ↔ `iam` — ContactResolver

Xuddi shunday `ContactResolver` port orqali.

## Xato boshqaruvi

### Domain

```typescript
export class DomainError extends Error {
  constructor(readonly code: string, message: string) { super(message); }
}
```

### Application

```typescript
export class ApplicationError extends Error {
  constructor(readonly code: string, message: string, readonly statusCode: number) {
    super(message);
  }
}

export class ValidationApplicationError extends ApplicationError { /* 400 */ }
export class ConflictApplicationError extends ApplicationError { /* 409 */ }
export class NotFoundApplicationError extends ApplicationError { /* 404 */ }
export class ForbiddenApplicationError extends ApplicationError { /* 403 */ }
export class InternalApplicationError extends ApplicationError { /* 500 */ }
```

### HTTP

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Role \"admin\" is already taken"
  }
}
```

## Migratsiyalar

Har bir modul **o'z migratsiyalarini** saqlaydi:

```
modules/<module>/src/infrastructure/database/migrations/
├── 0001_<action>.sql
├── 0002_<action>.sql
└── ...
```

**`SqlMigrationRunner`** (`@workspace/platform`) — barcha migratsiyalarni tartib bilan ishga tushiradi.

**Xususiyatlar:**
- BOM olib tashlanadi
- Empty fayllar o'tkazib yuboriladi
- `BEGIN; ... COMMIT;` — transaction
- `CREATE TABLE IF NOT EXISTS` — idempotent

### Enterprise schema pattern

- **UUID** primary keys — `uuid('id').primaryKey().defaultRandom()`
- **TIMESTAMPTZ** — `timestamp('created_at', { withTimezone: true })`
- **Partial unique indexes** — `WHERE deleted_at IS NULL`
- **`version` column** — optimistic concurrency
- **`tenant_id` nullable** — multi-tenancy
- **CITEXT email** — case-insensitive
- **JSONB** — `subjects`, `resources`, `actions`, `conditions`
- **GIN index** — JSONB overlap (`?|`)
- **`updated_at` triggers**

## Testlar

### Unit testlar

**`node:test`** + **InMemory repository**'lar:

```typescript
import assert from 'node:assert/strict';
import { test } from 'node:test';

test('Role.create() builds an active role', () => {
  const name = RoleName.create('admin').getOrThrow();
  const result = Role.create({ name, description: '', permissions: [] });
  assert.equal(result.isOk(), true);
});
```

### Integration testlar

**Real DB** (Supabase) bilan:

```typescript
before(async () => {
  const app = createServer(await createContainer({
    databaseUrl,
    startBackgroundWorkers: false,
    runMigrations: true,
  }));
  server = await new Promise<Server>((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
});
```

## Fayl nomlash qoidalari

| Tur | Nom | Misol |
|---|---|---|
| Aggregate Root | `PascalCase.ts` | `Role.ts`, `User.ts`, `Policy.ts` |
| Entity | `PascalCase.ts` | `Member.ts` |
| Value Object | `PascalCase.ts` | `RoleId.ts`, `Email.ts` |
| Enum | `PascalCase.ts` | `UserStatus.ts` |
| Domain Event | `PascalCaseEvent.ts` | `RoleCreatedEvent.ts` |
| Command | `PascalCaseCommand.ts` | `CreateRoleCommand.ts` |
| Handler | `PascalCaseHandler.ts` | `CreateRoleHandler.ts` |
| Result | `PascalCaseResult.ts` | `CreateRoleResult.ts` |
| Query | `PascalCaseQuery.ts` | `GetRoleQuery.ts` |
| View | `PascalCaseView.ts` | `RoleView.ts` |
| Port | `PascalCasePort.ts` | `AuthorizationPort.ts` |
| Repository interface | `PascalCaseRepository.ts` | `RoleRepository.ts` |
| Drizzle repo | `DrizzlePascalCaseRepository.ts` | `DrizzleRoleRepository.ts` |
| InMemory repo | `InMemoryPascalCaseRepository.ts` | `InMemoryRoleRepository.ts` |
| Mapper | `PascalCaseMapper.ts` | `RoleMapper.ts` |
| Controller | `PascalCaseController.ts` | `RoleController.ts` |
| Validator | `PascalCaseValidator.ts` | `CreateRoleValidator.ts` |
| Table | `kebab-case.table.ts` | `roles.table.ts`, `outbox-events.table.ts` |
| Migration | `NNNN_<action>.sql` | `0001_create_access_control.sql` |

## Nomlash qoidalari

- **Aggregate/Entity/Value Object** — **PascalCase** (`Role`, `Member`, `RoleId`)
- **Method** — **camelCase** (`create`, `reconstruct`, `markAsSent`)
- **Private field** — **`_`** prefiks (`_name`, `_status`)
- **Getter** — **camelCase** (`name`, `status`, `createdAt`)
- **Enum** — **PascalCase** nom, **PascalCase** qiymat
- **Type/Interface** — **PascalCase** (`RoleRepository`, `CreateRoleCommand`)
- **Event name** — **`<module>.<aggregate>.<action>`** (masalan, `access-control.role.created`)

## Kelajakdagi pattern'lar

- **CQRS** — Commands va Queries ajratilgan (hozir bor)
- **Outbox** — At-least-once delivery (hozir bor)
- **Saga/Process Manager** — Murakkab workflow'lar uchun (kelajakda)
- **Event Sourcing** — To'liq event tarixi (kelajakda, agar kerak bo'lsa)
- **Multi-tenancy** — Row-level isolation (hozir shared schema)

## Middleware va xavfsizlik (Phase-0)

**`apps/api/src/middleware.ts`**:
- `trust proxy` — proxy hop
- `pino-http` — request logging
- `helmet` — security headers
- `cors` — whitelist
- `compression` — gzip
- `cookie-parser` — OAuth
- `express.json` / `urlencoded` — body parse
- `express-rate-limit` — global (300 req/min)
- `express-slow-down` — brute-force himoyasi

**Rejalashtirilgan:**
- `requestId` middleware — `X-Request-ID`, `crypto.randomUUID()`
- `AsyncLocalStorage` — `correlationId`, `actorId`, `tenantId`
- `correlationId` — outbox'ga avtomatik
- Auth endpoint'lar uchun alohida rate limit (5 req/min)