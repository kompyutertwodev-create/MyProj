# Kod uslubi

## Umumiy tamoyillar

1. **Type-safe** — barcha kod **TypeScript** da, `any` **taqiqlangan** (faqat `as never` testlarda)
2. **DDD** — biznes-logika **domain**da
3. **Immutability** — Value Object'lar **o'zgarmas**
4. **Result pattern** — xatolar **`Result<T, E>`** orqali
5. **Test-driven** — har bir modul **testlar** bilan

## Fayl nomlash

### Domain

| Tur | Nom | Misol |
|---|---|---|
| Aggregate Root | `PascalCase.ts` | `Tenant.ts`, `User.ts`, `Notification.ts` |
| Entity | `PascalCase.ts` | `Member.ts` |
| Value Object | `PascalCase.ts` | `TenantId.ts`, `Email.ts`, `RecipientId.ts` |
| Enum | `PascalCase.ts` | `TenantStatus.ts`, `NotificationChannel.ts` |
| Domain Event | `PascalCaseEvent.ts` | `TenantCreatedEvent.ts` |
| Repository interface | `PascalCaseRepository.ts` | `TenantRepository.ts` |

### Application

| Tur | Nom | Misol |
|---|---|---|
| Command | `PascalCaseCommand.ts` | `CreateTenantCommand.ts` |
| Handler | `PascalCaseHandler.ts` | `CreateTenantHandler.ts` |
| Result | `PascalCaseResult.ts` | `CreateTenantResult.ts` |
| Query | `PascalCaseQuery.ts` | `GetTenantQuery.ts` |
| View | `PascalCaseView.ts` | `TenantView.ts` |
| Port | `PascalCasePort.ts` | `EventBusPort.ts`, `ContactResolver.ts` |

### Infrastructure

| Tur | Nom | Misol |
|---|---|---|
| Table | `kebab-case.table.ts` | `tenants.table.ts` |
| Migration | `NNNN_<action>.sql` | `0001_create_tenants.sql` |
| Mapper | `PascalCaseMapper.ts` | `TenantMapper.ts` |
| Drizzle repo | `DrizzlePascalCaseRepository.ts` | `DrizzleTenantRepository.ts` |
| InMemory repo | `InMemoryPascalCaseRepository.ts` | `InMemoryTenantRepository.ts` |
| Adapter | `PlatformPascalCase.ts` / `PascalCaseSender.ts` | `PlatformEmailSender.ts` |

### Presentation

| Tur | Nom | Misol |
|---|---|---|
| Controller | `PascalCaseController.ts` | `TenantController.ts` |
| Validator | `PascalCaseValidator.ts` | `CreateTenantValidator.ts` |
| Middleware | `PascalCase.ts` | `ValidateRequest.ts` |

## Papka tuzilishi

### Har bir command o'z papkasida

```
commands/
├── create-tenant/
│   ├── CreateTenantCommand.ts
│   ├── CreateTenantHandler.ts
│   ├── CreateTenantResult.ts
│   └── index.ts
├── update-tenant/
│   └── ...
└── index.ts
```

### Har bir query o'z papkasida

```
queries/
├── get-tenant/
│   ├── GetTenantQuery.ts
│   ├── GetTenantHandler.ts
│   └── index.ts
├── list-tenants/
│   └── ...
└── index.ts
```

### `index.ts` — re-export

Har bir papkada **`index.ts`** bo'lishi shart. U **hamma** narsani **re-export** qiladi:

```typescript
// commands/create-tenant/index.ts
export * from './CreateTenantCommand.js';
export * from './CreateTenantHandler.js';
export * from './CreateTenantResult.js';
```

```typescript
// commands/index.ts
export * from './create-tenant/index.js';
export * from './update-tenant/index.js';
```

```typescript
// application/index.ts
export * from './ports/index.js';
export * from './commands/index.js';
export * from './queries/index.js';
```

**Muhim:** **`.js`** kengaytmasi **majburiy** (ESM).

## Kod yozish qoidalari

### Aggregate Root

```typescript
export class Tenant extends AggregateRoot<TenantId> {
  private _name: TenantName;
  private _slug: TenantSlug;
  // ...

  private constructor(id: TenantId, /* ... */) {
    super(id);
    // ...
  }

  // Getters
  get name(): TenantName { return this._name; }
  get slug(): TenantSlug { return this._slug; }

  // Factory
  static create(props: TenantCreateProps): Result<Tenant, DomainError> {
    // Validation
    if (!props.name) return err(new DomainError('TENANT_NAME_EMPTY', '...'));
    
    const tenant = new Tenant(/* ... */);
    tenant.apply(new TenantCreatedEvent(/* ... */));
    return ok(tenant);
  }

  static reconstruct(props: TenantReconstructProps): Tenant {
    return new Tenant(/* ... */);
  }

  // Business methods
  rename(newName: TenantName): Result<void, DomainError> {
    if (this._name.equals(newName)) {
      return err(new DomainError('TENANT_NAME_SAME', '...'));
    }
    this._name = newName;
    this._updatedAt = new Date();
    this.apply(new TenantUpdatedEvent(this.id.value, this.id.value));
    return ok(undefined);
  }
}
```

### Value Object

```typescript
export class TenantSlug extends ValueObject<TenantSlugProps> {
  private static readonly PATTERN = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){1,61}[a-z0-9]$/;

  private constructor(props: TenantSlugProps) {
    super(props);
  }

  get value(): string { return this.props.value; }

  static create(value: string): Result<TenantSlug, DomainError> {
    const normalized = value.trim().toLowerCase();
    if (normalized.length < 3) {
      return err(new DomainError('TENANT_SLUG_TOO_SHORT', '...'));
    }
    if (!TenantSlug.PATTERN.test(normalized)) {
      return err(new DomainError('TENANT_SLUG_INVALID_FORMAT', '...'));
    }
    return ok(new TenantSlug({ value: normalized }));
  }

  toString(): string { return this.props.value; }
}
```

### Domain Event

```typescript
import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

export class TenantCreatedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'tenant.created';
  readonly occurredAt: Date;
  readonly aggregateType = 'Tenant';

  constructor(
    readonly aggregateId: string,
    readonly tenantId: string,
    readonly name: string,
    readonly slug: string,
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}
```

### Command + Handler

```typescript
// Command
export interface CreateTenantCommand {
  name: string;
  slug: string;
  ownerUserId: string;
}

// Result
export interface CreateTenantResult {
  tenantId: string;
  name: string;
  slug: string;
  ownerUserId: string;
}

// Handler
export class CreateTenantHandler {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly memberRepository: MemberRepository,
    private readonly eventBus: EventBusPort,
    private readonly unitOfWork?: TenantUnitOfWork
  ) {}

  async execute(command: CreateTenantCommand): Promise<Result<CreateTenantResult, ApplicationError>> {
    // Validation
    const slugResult = TenantSlug.create(command.slug);
    if (slugResult.isErr()) {
      return err(new ValidationApplicationError(slugResult.error.message));
    }
    
    // Business logic
    const tenant = Tenant.create({ /* ... */ }).getOrThrow();
    
    // Persist
    await this.tenantRepository.save(tenant);
    
    // Return
    return ok({ /* ... */ });
  }
}
```

### Repository

```typescript
// Interface (domain)
export interface TenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  save(tenant: Tenant): Promise<void>;
  delete(id: string): Promise<void>;
}

// Drizzle implementation (infrastructure)
export class DrizzleTenantRepository implements TenantRepository {
  constructor(private readonly db: NodePgDatabase<any>) {}

  async findById(id: string): Promise<Tenant | null> {
    const rows = await this.db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.toDomain(row);
  }

  async save(tenant: Tenant): Promise<void> {
    const row = TenantMapper.toPersistence(tenant);
    await this.db.insert(tenants).values(row).onConflictDoUpdate({ /* ... */ });
  }

  private toDomain(row: typeof tenants.$inferSelect): Tenant {
    return TenantMapper.toDomain({ /* ... */ });
  }
}
```

### Mapper

```typescript
export class TenantMapper {
  static toDomain(row: TenantPersistence, members: Member[]): Tenant {
    const name = TenantName.create(row.name);
    if (name.isErr()) throw name.error;
    const slug = TenantSlug.create(row.slug);
    if (slug.isErr()) throw slug.error;
    const settings = TenantSettings.create(row.settings);
    
    return Tenant.reconstruct({
      id: row.id,
      name: name.value,
      slug: slug.value,
      // ...
    });
  }

  static toPersistence(tenant: Tenant): TenantPersistence {
    return {
      id: tenant.id.value,
      name: tenant.name.value,
      slug: tenant.slug.value,
      // ...
    };
  }
}
```

### Controller

```typescript
export function createTenantRouter(deps: TenantRouterDependencies): Router {
  const router = Router();

  router.post(
    '/',
    deps.authGuard,
    validateRequest(CreateTenantRequestSchema),
    async (req, res, next) => {
      try {
        const body = req.validated?.body as CreateTenantCommand;
        sendResult(res, await deps.createTenant.execute(body));
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
```

### Validator (Zod)

```typescript
export const CreateTenantRequestSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    slug: z.string().min(3).max(63),
    ownerUserId: z.string().min(1),
  }),
});
```

## Xatolar

### Domain Error

```typescript
if (this._status === TenantStatus.Suspended) {
  return err(new DomainError('TENANT_ALREADY_SUSPENDED', 'Tenant is already suspended'));
}
```

### Application Error

```typescript
return err(new ValidationApplicationError('Invalid slug'));
return err(new ConflictApplicationError('Slug already taken'));
return err(new NotFoundApplicationError('Tenant not found'));
return err(new InternalApplicationError('Database error'));
```

## Testlar

```typescript
import assert from 'node:assert/strict';
import { test } from 'node:test';

test('Tenant.create() builds an active tenant', () => {
  const name = TenantName.create('Acme').getOrThrow();
  const slug = TenantSlug.create('acme').getOrThrow();
  
  const result = Tenant.create({ name, slug, ownerUserId: 'user-1' });
  
  assert.equal(result.isOk(), true);
  assert.equal(result.value.name.value, 'Acme');
});
```

## Import qoidalari

```typescript
// ✅ To'g'ri
import { DomainError, Result } from '@workspace/kernel';
import { Tenant } from '../domain/Tenant.js';
import type { TenantRepository } from '../domain/repositories/TenantRepository.js';

// ❌ Noto'g'ri
import { Tenant } from '../../domain/Tenant';        // .js yo'q
import type { Tenant } from '../domain';             // papkadan import
import { Express } from 'express';                   // domain'da express
```

## PowerShell'da fayl yaratish

### BOM'siz (tavsiya)

```powershell
$content = @'
...matn...
'@

[System.IO.File]::WriteAllText("$PWD\path\to\file.ts", $content, [System.Text.UTF8Encoding]::new($false))
```

### BOM bilan (Set-Content)

```powershell
Set-Content -Path "path\to\file.ts" -Encoding utf8 -Value @'
...matn...
'@
```

**Muhim:** `package.json` va `.sql` uchun **BOM'siz** versiya ishlatiladi. `.ts` uchun **ikkalasi ham** ishlaydi.

## Git commit

**Conventional Commits:**

```
feat(<module>): <short description>

<longer description>

- Bullet 1
- Bullet 2

<footer>
```

**Misollar:**

```
feat(tenant): add tenant module with full DDD stack
fix(iam): align OAuth tests with new createOAuthRouter API
chore: remove temporary iam-tree.txt
docs: add architecture documentation
```

**Muhim:** Commit xabari **o'zbek** yoki **ingliz** tilida. **Kod** esa **ingliz** tilida.