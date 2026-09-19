# Bajarilgan ishlar

Bu fayl **xronologik** tartibda **barcha** bajarilgan ishlarni saqlaydi.

## Format

```markdown
## YYYY-MM-DD — <Modul nomi>

**Holat:** ✅ Tugallangan
**Commit:** <hash>
**Fayllar:** <soni>
**Testlar:** <soni>/<soni>
**Xususiyatlar:**
- ...
```

---

## 2026-09-18 — `modules/iam` (v1)

**Holat:** ✅ Tugallangan (keyinchalik rewrite qilindi)
**Fayllar:** ~150 ta
**Testlar:** 4/4 (integration)
**Xususiyatlar:**
- User aggregate, Role, Session, Permission, Policy (ABAC)
- OAuth: Google, GitHub, Telegram
- JWT (access 15min + refresh 30days)
- Multi-session, outbox pattern
- 6 ta SQL migratsiya

---

## 2026-09-19 (1-qism) — `modules/tenant`

**Holat:** ✅ Tugallangan
**Commit:** `4f63964`
**Fayllar:** ~50 ta
**Yangi qatorlar:** ~2600
**Testlar:** 12/12 unit
**Xususiyatlar:**
- **Domain:** Tenant aggregate, Member entity, TenantSlug/TenantName/TenantSettings VOs, 4 ta event
- **Application:** CreateTenantHandler, Get/List queries, TenantUnitOfWork port
- **Infrastructure:** `tenant_tenants` + `tenant_members` jadvallar, Drizzle + InMemory repository
- **Presentation:** HTTP router, Zod validators
- **Multi-tenancy:** Shared DB, shared schema
- **Member roles:** owner / admin / manager / member
- **Owner protection:** owner o'chirib bo'lmaydi

---

## 2026-09-19 (2-qism) — `modules/audit`

**Holat:** ✅ Tugallangan
**Commit:** `e9cbff7`
**Fayllar:** ~48 ta
**Yangi qatorlar:** ~1400
**Testlar:** 12/12 unit
**Xususiyatlar:**
- **Domain:** AuditLog aggregate, ActorId/TenantRef VOs, AuditEventType enum, 2 ta event
- **Application:** RecordAuditHandler, ListAuditLogsHandler, AuditEventSubscriber
- **Infrastructure:** `audit_logs` jadval, Drizzle + InMemory repository
- **Presentation:** HTTP router, Zod validators
- **Event-driven:** `iam` va `tenant` event'larini tinglaydi

---

## 2026-09-19 (3-qism) — `modules/notification`

**Holat:** ✅ Tugallangan
**Commit:** `3671e6c`
**Fayllar:** ~60 ta
**Yangi qatorlar:** ~2500
**Testlar:** 13/13 unit
**Xususiyatlar:**
- **Domain:** Notification aggregate, RecipientId/RecipientContact VOs, Channel/Status enum, 2 ta event
- **Application:** SendNotificationHandler, ListNotificationsHandler, NotificationDispatcher, ContactResolver port, DefaultTemplateCatalog
- **Infrastructure:**
  - `notifications` jadval
  - **PlatformEmailSender** (SendGrid/SES)
  - **TelegramBotSender** (enterprise): TelegramApiClient, TelegramRateLimiter, TelegramRetryPolicy, TelegramError, TelegramLogger
  - FakeNotificationSender
- **Event-driven:** `iam.UserRegistered` → welcome email, `tenant.created` → tenant welcome

**Muhim qarorlar:**
- **Adapter pattern** — `notification` tashqi servislarni bilmaydi
- **ContactResolver port** — `notification` `iam` domain'ini bilmaydi

---

## 2026-09-19 (4-qism) — `docs/` — handoff dokumentatsiya

**Holat:** ✅ Tugallangan
**Commit:** `93ce109`
**Fayllar:** 5 ta (`README.md`, `docs/architecture.md`, `docs/PROGRESS.md`, `docs/CONVENTIONS.md`, `docs/HANDOFF.md`)

---

## 2026-09-19 (5-qism) — `@workspace/access-control` — RBAC + ABAC moduli

**Holat:** ✅ Tugallangan
**Commit:** `13a58f3`
**Fayllar:** ~100 ta
**Xususiyatlar:**

### Domain
- `Role` — AggregateRoot, `system` role'lar immutable (rename, permission mutation, delete taqiqlangan)
- `RoleId`, `RoleName` — VOs (ADMIN/USER/MODERATOR/GUEST statik)
- `Permission` — VO (`resource:action` format)
- `Policy` — AggregateRoot, ABAC, glob matching (`*`, `**`), deny-overrides
- `PolicyId`, `PolicyEffect`, `AttributeCondition`, `PolicyEvaluationContext`
- `RoleAssignment` — AggregateRoot, audit trail (assignedBy, assignedAt, expiresAt, revokedAt, revokedBy, revokedReason, isExpired)
- 13 ta domain event

### Application
- **12 commands**: create/update/delete-role, add/remove-permission-to-role, assign/revoke-role, create/update/delete/activate/deactivate-policy
- **7 queries**: get/list-roles, get/list-policies, list-user-roles, list-role-assignments, check-permission
- **PolicyEvaluator** — deny-overrides RBAC + ABAC
- **Ports**: ApplicationError, EventBusPort, OutboxPort, AccessControlUnitOfWork

### Infrastructure
- **Schema** — UUID, TIMESTAMPTZ, JSONB, GIN, partial unique indexes, `version`, `tenant_id`
- **Repositories** — Drizzle + InMemory (Role, Policy, RoleAssignment, Outbox)
- **Mappers** — Role, Policy, RoleAssignment
- **`RbacSeeder`** — idempotent (admin, user, moderator, guest)
- **Migration** — `0001_create_access_control.sql`, `0002_add_event_metadata.sql`
- **`DrizzleAccessControlUnitOfWork`** — transaction context

### Presentation
- **19 endpoint** under `/api/v1/access-control/*`
- Role: 7 (CRUD + permissions)
- Policy: 7 (CRUD + activate/deactivate)
- Assignment: 4 (assign/revoke/list)
- Permission: 1 (check)
- **Validators** — 27 Zod schema
- **Middleware** — `ValidateRequest`
- **`sendResult`** helper — `Result<T, ApplicationError>` → HTTP

### Adapter
- `AccessControlAuthorizationAdapter` — `AuthorizationPort` implement

**Muhim qarorlar:**
- Modul **`iam`**dan to'liq ajratilgan
- **`iam`** → **`access-control`** — **`AuthorizationPort`** orqali
- **`apps/api`** — composition root da wire

---

## 2026-09-19 (6-qism) — `@workspace/kernel` — EventMetadata + sha256Hex

**Holat:** ✅ Tugallangan
**Commit:** `c78c9c5`
**Fayllar:** ~10 ta

**Xususiyatlar:**
- **`EventMetadata`** — 8 field (correlationId, causationId, actorId, tenantId, recordedAt, aggregateVersion, schemaVersion, extras)
- **`EventEnvelope<TEvent>`** — `{ event, metadata }`
- **`EventContext`** — request scoped
- **Helpers**: `envelopeOf`, `mergeContext`, `metadataFromContext`, `EMPTY_EVENT_CONTEXT`
- **`sha256Hex`** — SHA-256 utility (refresh token hashing)

**Muhim qarorlar:**
- `DomainEvent` — **minimal** (5 field, o'zgarmagan)
- Metadata — **infrastructure** **layer**da qo'shiladi
- **`EventEnvelope`** — outbox va event bus uchun

---

## 2026-09-19 (7-qism) — `@workspace/iam` — RBAC olib tashlandi, enterprise schema

**Holat:** ✅ Tugallangan
**Commit:** `00f1f24`
**Fayllar:** ~200 ta o'zgargan

**Xususiyatlar:**

### Schema rewrite (`0001_iam_v2_schema.sql`)
- `identities` — UUID, CITEXT email, soft delete, tenant_id, version, MFA, partial unique email
- `iam_sessions` — UUID, `refresh_token_hash` (SHA-256), revoked_at, version
- `social_identities` — UUID, CITEXT provider_email
- `iam_devices` — UUID, updated_at
- `iam_oauth_states` — TIMESTAMPTZ
- `iam_outbox_events` — platform `OutboxStore` pattern (status/availableAt/lockedAt/lockToken)

### Domain
- `User` — softDelete(), tenantId, version, changeDisplayName()
- `Session` — `refreshTokenHash` (SHA-256), AggregateRoot emas
- `UserDeletedEvent` — yangi

### Application
- `LoginUserHandler`, `OAuthLoginHandler`, `AuthService` — `authorization?: AuthorizationPort` qabul qiladi
- `RegisterUserHandler` — RBAC yo'q (keyin event orqali)
- `GetUserHandler`, `GetUserByEmailHandler`, `ListUsersHandler` — soddalashtirildi
- `UserView` — RBAC fields olib tashlandi

### Olib tashlangan
- ❌ `Role`, `Permission`, `Policy`, `RoleRepository`, `PolicyRepository`
- ❌ `AssignRoleHandler`, `CheckPermissionHandler`
- ❌ `PolicyService`, `PermissionService`
- ❌ `RoleController`, `PermissionController`, `PolicyController`
- ❌ `RoleGuard`, `PermissionGuard`
- ❌ Barcha RBAC validators, mappers, seeders

### `iam/index.ts`
- RBAC export'lar olib tashlandi
- `AuthorizationPort` export qo'shildi

**Muhim qarorlar:**
- `iam` — **faqat** auth + users + oauth
- **`access-control`** — RBAC + ABAC
- **`AuthorizationPort`** — port orqali bog'lanish

---

## 2026-09-19 (8-qism) — `iam` ↔ `access-control` AuthorizationPort

**Holat:** ✅ Tugallangan
**Commit:** `db3128d`
**Fayllar:** 16 ta o'zgargan

**Xususiyatlar:**
- **`iam/application/ports/AuthorizationPort.ts`** — interface
- **`access-control/application/adapters/AccessControlAuthorizationAdapter.ts`** — implement
- **`LoginUserHandler`, `OAuthLoginHandler`, `AuthService`** — `authorization?: AuthorizationPort` qabul qiladi
- **`apps/api/src/container.ts`** — composition root:
  1. `access-control` avval (authorization adapter uchun)
  2. `iam` keyin (authorization bilan)
  3. `access-control` router qayta mount (real authGuard bilan)

**Muhim qarorlar:**
- **`iam`** va **`access-control`** — **bir-birini import qilmaydi**
- **`AuthorizationPort`** — port orqali
- **`apps/api`** — wire qiladi

---

## 2026-09-19 (9-qism) — `access-control` domain testlari

**Holat:** ✅ Tugallangan
**Commit:** `fa124cf`
**Fayllar:** 6 ta test fayl
**Testlar:** 164/164 ✅
**Xususiyatlar:**
- **Role** — 26 ta test (create, rename, updateDescription, addPermission, removePermission, replacePermissions, delete, hasPermission, permissionNames)
- **RoleName** — 11 ta test (create, normalize, constants, equals)
- **Permission** — 12 ta test (create, validate format, equals)
- **Policy** — 51 ta test (create, evaluate, activate, deactivate, delete, updateName, updateDescription, updateEffect, updateSubjects, updateResources, updateActions, updateConditions, updatePriority)
- **AttributeCondition** — 34 ta test (resolvePath, evaluateCondition with all operators)
- **RoleAssignment** — 30 ta test (create, revoke, markExpired, isExpiredAt, isActive)

---

## 2026-09-19 (10-qism) — `access-control` application testlari (boshlangan)

**Holat:** 🟡 Boshlangan
**Fayllar:** 1 ta test fayl
**Testlar:** 10/174 (application)
**Xususiyatlar:**
- **CreateRoleHandler** — 10 ta test (create, validations, normalizations)

---

## 2026-09-19 (11-qism) -- `apps/api` Phase-0 middleware

**Holat:** ✅ Tugallangan
**Commit'lar:** `e2aa769`, `94566a3`, `4a647c2`, `6702818`
**Fayllar:** 5 ta yangi + 3 ta yangilangan
**Testlar:** 68/68 (49 -> 68, +19 yangi)

**Xususiyatlar:**

### `apps/api/src/context/`
- `RequestContext.ts` -- `requestId` + `eventContext` interfeysi
- `store.ts` -- `AsyncLocalStorage` + `runWithRequestContext`, `getRequestContext`, `getEventContext`, `withEventContext`
- `index.ts` -- re-export

### `apps/api/src/middleware/`
- `request-id.ts` -- `X-Request-ID` header; validatsiya (128 belgi, `[A-Za-z0-9._-]`); UUID fallback
- `request-context.ts` -- AsyncLocalStorage'ga `RequestContext` o'rnatish
- `security.ts` -- helmet (strict CSP, HSTS production'da) + CORS whitelist (`CORS_ORIGINS` / `CORS_ORIGIN`)
- `rate-limit.ts` -- global 300/min, auth 5/min, slow-down; test muhitida auth limit 10,000
- `index.ts` -- `applyMiddleware` + `applyAuthMiddleware`
- `middleware.ts` -> `middleware/` papkaga o'tkazildi

### `apps/api/src/container/`
- `outbox-context.ts` -- `withAmbientContext()` adapter; outbox event'lariga avtomatik `correlationId`, `actorId`, `tenantId` qo'shadi

### `apps/api/`
- `.env.test` -- test muhiti uchun `NODE_ENV=test`
- `package.json` -- test script `--env-file=.env.test` qo'shildi
- `server.ts` -- `applyAuthMiddleware(app)` mount (routes'dan oldin)

**Yangi testlar (19 ta):**
- `request-id.unit.test.ts` (5) -- valid, missing, over-long, unsafe, whitespace
- `request-context.unit.test.ts` (5) -- outside/inside, correlation, merge, nested async
- `security.unit.test.ts` (9) -- CORS whitelist, preflight, helmet headers

**Muhim qarorlar:**
- `AsyncLocalStorage` -- `apps/api` da (kernel'da emas, chunki HTTP-specific)
- `RequestContext` -- `EventContext` ni **o'raydi** (inheritance emas, composition)
- Test muhitida auth limit **10,000** (production 5)
- Outbox adapter -- **faqat `access-control`** uchun hozircha; `iam` Phase-2 da
- `trust proxy` -- 1 (Replit/nginx orqasida)

**Xavfsizlik:**
- CSP: `default-src 'none'`, `frame-ancestors 'none'`, `base-uri 'none'`
- HSTS: 180 kun, `includeSubDomains` (faqat production)
- CORS: whitelist (production'da bo'sh default)
- Rate limit: IP + email (auth uchun)
- Header injection himoyasi (`X-Request-ID`)

---
## 2026-09-19 (12-qism) -- `iam` OutboxPort + Faza 1 testlari

**Holat:** ✅ Tugallangan
**Commit'lar:** `93606a9`, `2934817`, `8010332`, `5bf3a07`, `168cdd2`
**Fayllar:** 15 ta o'zgargan
**Testlar:** 280/280 (68 apps/api + 212 access-control)

**Xususiyatlar:**

### `@workspace/kernel`
- `withAmbientContext.ts` -- **Proxy-based** helper; enqueue/enqueueAll/publish/publishAll metodlarini ambient `EventContext` bilan o'raydi; qolgan metodlarni (subscribe, claimBatch, ...) saqlaydi
- `index.ts` -- `withAmbientContext`, `AmbientContextProvider`, `ContextAwareTarget` export

### `@workspace/platform`
- `OutboxStore` -- `enqueue(event, context?)`, `enqueueAll(events, context?)` (optional EventContext)
- `OutboxEventBus` -- `publish(event, context?)`, `publishAll(events, context?)` (optional EventContext)

### `@workspace/iam`
- `DrizzleOutboxRepository` -- `context` qabul qiladi; metadata column'larga (`correlationId`, `causationId`, `actorId`, `tenantId`, `schemaVersion`, `aggregateVersion`, `metadata`) yozadi
- `claimBatch` tuzatildi -- `tx.update().set()` + parameterized `IN` clause

### `apps/api`
- `iam-container.ts` -- `OutboxEventBus` `withAmbientContext` bilan o'ralgan
- `getEventContext()` -- `@workspace/kernel` dan `withAmbientContext` ga provider sifatida uzatiladi

### `modules/access-control`
- `tsconfig.json` -- `exclude` dan `__tests__` olib tashlandi (testlar endi typecheck qilinadi)
- **Handler** testlari (6 fayl) -- import path tuzatildi (`../../` -> `../../../`)
- `Permission.test.ts` -- `getOrThrow()` + `isErr()` type narrowing
- `Policy.test.ts` -- `getOrThrow()` + `isErr()` type narrowing

### Root
- `vitest.config.ts` -- yangi config; faqat `modules/**/src/**/__tests__/**/*.test.ts` ni oladi; `apps/**` ni chiqarib tashlaydi

**Muhim qarorlar:**
- **`withAmbientContext`** -- `kernel` da, **Proxy** pattern (barcha metodlar saqlanadi)
- **Provider** -- `getContext` **parametr** sifatida (kernel `AsyncLocalStorage` ni bilmaydi)
- **`OutboxStore`** va **`OutboxEventBus`** -- **context?** optional (backward-compatible)
- **Testlar** -- 2 xil runner: `apps/api` (`node:test`) + `modules` (`vitest`)
- **`exclude`** -- `access-control` da **olib tashlandi** (testlar to'g'ri)

**Testlar:**
- `apps/api/tests/` -- 68 (node:test)
- `modules/access-control/src/**/__tests__/` -- 212 (vitest)
- **Jami:** 280/280 ✅

---
## Umumiy statistika (2026-09-19)

| Ko'rsatkich | Qiymat |
|---|---|
| **Tugallangan modullar** | 8 ta (`kernel`, `platform`, `contracts`, `iam`, `access-control`, `tenant`, `audit`, `notification`) |
| **Yozilgan fayllar** | ~700 ta |
| **Testlar** | 280/280 ✅ |
| **Typecheck** | 39/39 ✅ |
| **Commit'lar** | 18 ta |

---

## Keyingi qadamlar

### Faza 1 — `access-control` testlari
- Unit testlar (domain, application)
- Integration testlar (`/api/v1/access-control/*`)
- `iam`dan ko'chirilgan testlar (`authorization`, `permission`)

### Faza 2 — `iam` OutboxEventBus → EventEnvelope pattern
- `iam`ning `OutboxEventBus` — `EventEnvelope` pattern'ga
- `platform` `OutboxStore` abstrakt qilish
- Metadata columns (correlationId, causationId, actorId)

### Faza 3 — Middleware va xavfsizlik (Phase-0)
- `requestId` middleware (`X-Request-ID`, `crypto.randomUUID`)
- `AsyncLocalStorage` — `correlationId`, `actorId`, `tenantId`
- `rateLimit` — auth endpoint'lar uchun (5 req/min)
- `slowDown` — brute-force himoyasi
- `helmet` sozlash (CSP, HSTS)
- `CORS` whitelist

### Faza 4 — `AuthorizationPort` to'liq wire
- `iam`dan `roleNames` — `access-control`dan
- JWT **role claim**lar to'ldirilishi

### Faza 5 — Data migration
- Eski `identities`dan yangi jadvalga (`iam_v2`)

### Faza 6 — Documentation yangilash ✅
- `docs/PROGRESS.md`, `docs/architecture.md` (davomiy)
- `docs/HANDOFF.md`
- ✅ Tugallandi (commit: `db3128d`)

### Faza 7 — Boshqa modullar
- `billing`, `subscription`, `catalog`, `media`, `search`, `analytics`, `reports`

### Faza 8 — Frontend
- `apps/web`, `apps/admin`, `apps/mobile`, `apps/telegram`

### Faza 9 — CI/CD
- GitHub Actions, Docker, Kubernetes

---

## Ishlash tartibi (tarixiy)

Har bir modul quyidagi **faza-faza** tartibda yoziladi:

1. **Faza 1:** Domain (aggregate, entity, VO, event, repository interface)
2. **Faza 2:** Domain events
3. **Faza 3:** Application ports
4. **Faza 4:** Application (commands, queries, handlers)
5. **Faza 5:** Infrastructure (schema, migrations, mapper, repositories)
6. **Faza 6:** Adapters
7. **Faza 7:** Presentation (controller, validators, middleware)
8. **Faza 8:** Integration (`apps/api` ga ulash)
9. **Faza 9:** Event handlers
10. **Faza 10:** Testlar (unit)

**Har bir fazadan keyin:**
- `pnpm typecheck` ishga tushiriladi
- Xato bo'lsa — to'liq matn yuboriladi
- Modul tugagach — commit qilinadi

**Muhim:** PowerShell'da **BOM** muammosi bor. `package.json` va `.sql` uchun **`[System.IO.File]::WriteAllText`** + `UTF8Encoding($false)` ishlatiladi.

---

## Muhim eslatmalar

1. **Network muammosi** — GitHub push ishlamaydi (`Failed to connect to github.com:443`). Local commit saqlanadi.
2. **`.js` kengaytmasi** — ESM uchun majburiy.
3. **`super(id, version)`** — AggregateRoot'da `version` majburiy.
4. **Event name formati** — `<module>.<aggregate>.<action>` (masalan, `access-control.role.created`).
5. **Modul chegaralari** — `iam` va `access-control` bir-birini import qilmaydi.