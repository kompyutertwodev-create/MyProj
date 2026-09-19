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
├── iam/                 # ✅ Identity & Access Management
├── tenant/              # ✅ Multi-tenancy
├── audit/               # ✅ Audit log (event-driven)
├── notification/        # ✅ Email + Telegram + Push
├── access-control/      # 🟡 RBAC/ABAC (iam dan ajratilgan)
├── billing/             # 🟡 To'lovlar
├── subscription/        # 🟡 SaaS obuna
├── catalog/             # 🟡 Biznes ma'lumotlar
├── content/             # 🟡 Kontent boshqaruvi
├── media/               # 🟡 Fayl yuklash (S3/MinIO)
├── search/              # 🟡 Qidiruv (Elasticsearch)
├── analytics/           # 🟡 Analitika
├── reports/             # 🟡 Hisobotlar
├── advertising/         # 🟡 Reklama
├── integrations/        # 🟡 Tashqi integratsiyalar
├── social/              # 🟡 Ijtimoiy tarmoqlar
├── devices/             # 🟡 Qurilmalar
├── features/            # 🟡 Feature flags
└── admin/               # 🟡 Admin

packages/                # Umumiy kutubxonalar
├── kernel/              # DDD asoslari
├── platform/            # Platforma servislari
├── contracts/           # Umumiy tiplar
├── ui/                  # UI komponentlar
└── tooling/             # ESLint, Prettier, tsconfig

lib/                     # Generatsiya qilinadigan API klientlar
├── api-spec/            # OpenAPI kontrakt
├── api-zod/             # Zod sxemalar (Orval)
└── api-client-react/    # React Query klient

tests/                   # Umumiy testlar
├── e2e/                 # Playwright
└── integration/         # Bo'sh

deployment/              # Docker, K8s, scripts
└── ...
```

## Modul tuzilishi (DDD)

Har bir modul **4 qatlamdan** iborat:

```
modules/<module>/src/
├── domain/                          # Sof biznes-logika
│   ├── <Aggregate>.ts               # Aggregate Root
│   ├── <Entity>.ts                  # Entity
│   ├── <VO>.ts                      # Value Object
│   ├── <Enum>.ts                    # Enum
│   ├── events/                      # Domain Events
│   │   ├── <Name>Event.ts
│   │   └── index.ts
│   ├── repositories/                # Repository interfeyslar
│   │   └── <Name>Repository.ts
│   └── index.ts
│
├── application/                     # Use case'lar
│   ├── ports/                       # Interfeyslar
│   │   ├── ApplicationError.ts
│   │   ├── EventBusPort.ts
│   │   ├── OutboxPort.ts
│   │   └── <Module>UnitOfWork.ts
│   ├── commands/                    # Yozish operatsiyalari
│   │   ├── <action>/
│   │   │   ├── <Action>Command.ts
│   │   │   ├── <Action>Handler.ts
│   │   │   ├── <Action>Result.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── queries/                     # O'qish operatsiyalari
│   │   ├── <Name>View.ts
│   │   ├── <action>/
│   │   │   ├── <Action>Query.ts
│   │   │   ├── <Action>Handler.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── event-handlers/              # Event subscriber'lar
│   │   ├── subscribed-events.ts
│   │   ├── <Module>EventSubscriber.ts
│   │   └── index.ts
│   └── index.ts
│
├── infrastructure/                  # Tashqi dunyo
│   ├── database/
│   │   ├── schema/                  # Drizzle sxemalar
│   │   │   ├── <table>.table.ts
│   │   │   └── index.ts
│   │   └── migrations/              # SQL migratsiyalar
│   │       └── 0001_create_<table>.sql
│   ├── mappers/                     # Domain ↔ Persistence
│   │   └── <Name>Mapper.ts
│   ├── repositories/                # Implementatsiyalar
│   │   ├── Drizzle<Name>Repository.ts
│   │   └── InMemory<Name>Repository.ts
│   ├── senders/                     # (notification uchun)
│   └── index.ts
│
├── presentation/                    # HTTP qatlami
│   ├── http/
│   │   ├── controllers/
│   │   │   └── <Name>Controller.ts
│   │   ├── middleware/
│   │   │   └── ValidateRequest.ts
│   │   └── validators/
│   │       ├── <Action>Validator.ts
│   │       └── index.ts
│   └── index.ts
│
└── index.ts                         # Public API (re-export)
```

## Event-driven arxitektura

### Domain Events

Har bir **aggregate** o'z **event'larini** chiqaradi:

```typescript
export class TenantCreatedEvent implements DomainEvent {
  readonly eventId = randomUUID();
  readonly eventName = 'tenant.created';
  readonly occurredAt = new Date();
  readonly aggregateType = 'Tenant';
  
  constructor(
    readonly aggregateId: string,
    readonly tenantId: string,
    readonly name: string,
    readonly slug: string,
  ) {}
}
```

### Outbox Pattern

Event'lar **transaction** ichida **outbox** jadvalga yoziladi:

```typescript
const tenant = Tenant.create({ ... }).getOrThrow();
await tenantRepository.save(tenant);

// Events in outbox (same transaction)
const events = tenant.pullDomainEvents();
await outbox.enqueueAll(events);
```

### Event Subscriber'lar

Boshqa modul **event'larini** **tinglaydi**:

```typescript
export class AuditEventSubscriber {
  async handle(event: DomainEvent): Promise<void> {
    if (event.eventName === 'tenant.created') {
      await this.recordAudit.execute({
        eventType: AuditEventType.TenantCreated,
        actorId: String(event.ownerUserId),
        ...
      });
    }
  }
}
```

**Muhim:** EventBus **wildcard qo'llab-quvvatlamaydi**. Har bir event **alohida** subscribe qilinadi:

```typescript
for (const eventName of AUDITED_EVENT_NAMES) {
  eventBus.subscribe(eventName, { handle: (e) => subscriber.handle(e) });
}
```

## Modul chegaralari

### `notification` va `iam` — **ContactResolver** port

`notification` **`iam`** dan **email** olishi kerak. Lekin **to'g'ridan-to'g'ri import** — **taqiqlangan**.

**Yechim:** `ContactResolver` port:

```typescript
// notification/application/ports/ContactResolver.ts
export interface ContactResolver {
  resolve(recipientId: string, channel: NotificationChannel): Promise<ResolvedContact | null>;
}
```

**Implementatsiya** — `apps/api` da:

```typescript
// apps/api/src/container/contact-resolver.ts
export class ApiContactResolver implements ContactResolver {
  constructor(private readonly getUser: GetUserHandler) {}
  
  async resolve(recipientId, channel) {
    if (channel !== NotificationChannel.Email) return null;
    const user = await this.getUser.execute({ userId: recipientId });
    if (!user) return null;
    return { channel, value: user.email };
  }
}
```

**Muhim:** `notification` `iam` **domain**ini **bilmaydi**. Faqat **`GetUserHandler`** (application) orqali.

## Xato boshqaruvi

### Domain

```typescript
export class DomainError extends Error {
  constructor(readonly code: string, message: string) { super(message); }
}

// Result pattern
const result = User.create({ ... });
if (result.isErr()) return err(result.error);
const user = result.value;
```

### Application

```typescript
export class ApplicationError extends Error {
  constructor(readonly code: string, message: string, readonly statusCode: number) {
    super(message);
  }
}

export class ValidationApplicationError extends ApplicationError {
  constructor(message: string) { super('VALIDATION_ERROR', message, 400); }
}
export class ConflictApplicationError extends ApplicationError {
  constructor(message: string) { super('CONFLICT', message, 409); }
}
export class NotFoundApplicationError extends ApplicationError {
  constructor(message: string) { super('NOT_FOUND', message, 404); }
}
export class InternalApplicationError extends ApplicationError {
  constructor(message: string) { super('INTERNAL_ERROR', message, 500); }
}
```

### HTTP

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Tenant slug \"acme\" is already taken"
  }
}
```

## Migratsiyalar

Har bir modul **o'z migratsiyalarini** saqlaydi:

```
modules/<module>/src/infrastructure/database/migrations/
├── 0001_create_<table>.sql
├── 0002_add_<column>.sql
└── ...
```

**`SqlMigrationRunner`** — barcha migratsiyalarni **tartib bilan** ishga tushiradi:

```typescript
await runSqlMigrations(db, 'modules/iam/src/infrastructure/database/migrations');
await runSqlMigrations(db, 'modules/tenant/src/infrastructure/database/migrations');
// ...
```

**Xususiyatlar:**
- **BOM** olib tashlanadi
- **Empty** fayllar o'tkazib yuboriladi
- **`BEGIN; ... COMMIT;`** — transaction
- **`CREATE TABLE IF NOT EXISTS`** — idempotent

## Testlar

### Unit testlar

**`node:test`** (Node.js built-in) ishlatiladi:

```typescript
import assert from 'node:assert/strict';
import { test } from 'node:test';

test('Tenant.create() builds an active tenant', () => {
  const result = Tenant.create({ ... });
  assert.equal(result.isOk(), true);
});
```

**In-memory repository'lar** ishlatiladi:

```typescript
const repository = new InMemoryTenantRepository();
const handler = new CreateTenantHandler(repository, memberRepository, eventBus);
```

**Fake sender'lar**:

```typescript
const emailSender = new FakeNotificationSender(NotificationChannel.Email);
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
  ...
});
```

## Fayl nomlash qoidalari

| Tur | Nom | Misol |
|---|---|---|
| **Aggregate Root** | PascalCase | `Tenant.ts`, `User.ts` |
| **Entity** | PascalCase | `Member.ts` |
| **Value Object** | PascalCase + `Id`/nom | `TenantId.ts`, `Email.ts` |
| **Enum** | PascalCase | `TenantStatus.ts` |
| **Domain Event** | PascalCase + `Event` | `TenantCreatedEvent.ts` |
| **Command** | PascalCase + `Command` | `CreateTenantCommand.ts` |
| **Handler** | PascalCase + `Handler` | `CreateTenantHandler.ts` |
| **Result** | PascalCase + `Result` | `CreateTenantResult.ts` |
| **Query** | PascalCase + `Query` | `GetTenantQuery.ts` |
| **View** | PascalCase + `View` | `TenantView.ts` |
| **Repository interface** | PascalCase + `Repository` | `TenantRepository.ts` |
| **Drizzle repo** | `Drizzle` + PascalCase | `DrizzleTenantRepository.ts` |
| **InMemory repo** | `InMemory` + PascalCase | `InMemoryTenantRepository.ts` |
| **Mapper** | PascalCase + `Mapper` | `TenantMapper.ts` |
| **Controller** | PascalCase + `Controller` | `TenantController.ts` |
| **Validator** | PascalCase + `Validator` | `CreateTenantValidator.ts` |
| **Table** | kebab-case + `.table.ts` | `tenants.table.ts` |
| **Migration** | `NNNN_<action>.sql` | `0001_create_tenants.sql` |

## Nomlash qoidalari

- **Aggregate/Entity/Value Object** — **PascalCase** (`Tenant`, `Member`, `TenantId`)
- **Method** — **camelCase** (`create`, `reconstruct`, `markAsSent`)
- **Private field** — **`_`** prefiks (`_name`, `_status`)
- **Getter** — **camelCase** (`name`, `status`, `createdAt`)
- **Enum** — **PascalCase** nom, **PascalCase** qiymat (`TenantStatus.Active = 'active'`)
- **Type/Interface** — **PascalCase** (`TenantRepository`, `CreateTenantCommand`)
- **Function** — **camelCase** (`createTenant`, `findById`)

## Kelajakdagi pattern'lar

- **CQRS** — Commands va Queries ajratilgan (hozir bor)
- **Outbox** — At-least-once delivery (hozir bor)
- **Saga/Process Manager** — Murakkab workflow'lar uchun (kelajakda)
- **Event Sourcing** — To'liq event tarixi (kelajakda, agar kerak bo'lsa)
- **Multi-tenancy** — Row-level isolation (hozir shared schema)