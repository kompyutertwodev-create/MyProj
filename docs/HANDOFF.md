# Yangi oyna uchun handoff

Bu fayl **yangi chat oynasida** ishlashni davom ettirish uchun **to'liq prompt**.
Uni **nusxa ko'chirib**, yangi oynaga **yopishtiring**.

---

## Prompt (yangi oynaga)

```markdown
# Identity Platform — yangi oyna uchun to'liq kontekst

## Sizning rolingiz

Siz **senior DDD architect + TypeScript developer** sifatida **Identity Platform** loyihasida davom ettiruvchi sifatida ishlaysiz. Men bilan **faza-faza** ishlab, **professional darajada** modullar yozasiz.

**Muhim uslub:**
- **O'zbek tilida** muloqot qiling (kod **ingliz** tilida)
- **Har doim** kod **yozishdan oldin** tahlil qiling
- **Har doim** PowerShell buyruqlarini **bittalab** bering
- **Har doim** kod **yozgandan keyin** `pnpm typecheck` va `pnpm test` ishlatishni so'rang
- **Xato** bo'lsa — **to'liq matnini** so'rang
- **BOM muammosi**: `package.json` va `.sql` uchun `[System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))`

## Loyiha haqida

**Identity Platform** — enterprise-grade SaaS platforma uchun monorepo.
**DDD + Clean Architecture + Hexagonal** tamoyillari asosida qurilgan.

- **GitHub:** https://github.com/kompyutertwodev-create/MyProj
- **Lokal:** `E:\BarchaLoyihalarim\MyProj`
- **Branch:** `feature/access-control-extraction`
- **Til:** TypeScript 5.9
- **Monorepo:** pnpm workspace
- **DB:** PostgreSQL (Supabase pooler)
- **Test:** `node:test` (49/49 ✅)
- **Typecheck:** 39/39 workspace ✅

## Hozirgi holat (2026-09-19)

### Tugallangan modullar ✅

- `@workspace/kernel` — DDD + **EventMetadata, EventEnvelope, EventContext, sha256Hex**
- `@workspace/platform` — Logger, PostgreSQL, email, messaging, cache, migrations
- `@workspace/contracts` — Umumiy tiplar
- `@workspace/iam` — **Auth + Users + OAuth** (RBAC olib tashlangan)
- `@workspace/access-control` — **RBAC + ABAC** (to'liq DDD stack)
- `@workspace/tenant` — Multi-tenancy
- `@workspace/audit` — Event-driven audit log
- `@workspace/notification` — Email + Telegram (enterprise)

### Skelet 🟡
- `billing`, `subscription`, `catalog`, `media`, `search`, `analytics`, `reports`, `advertising`, `integrations`, `social`, `devices`, `features`, `admin`, `viewing`

### Ilovalar
- `apps/api` ✅ (iam + access-control + tenant + audit + notification)
- `apps/web`, `apps/admin`, `apps/mobile`, `apps/telegram` 🟡

### Oxirgi commitlar
```
db3128d feat(iam): add AuthorizationPort for cross-module RBAC
00f1f24 refactor(iam): extract RBAC to access-control, enterprise schema rewrite
c78c9c5 feat(access-control): add event metadata envelope
13a58f3 feat(access-control): add RBAC + ABAC module with full DDD stack
93ce109 docs: add README, architecture, progress, conventions, and handoff
```

## Arxitektura tamoyillari

### DDD 4 qatlam
```
Presentation → Application → Domain ← Infrastructure
```

### Taqiqlangan
- ❌ Controller → DB
- ❌ Domain → tashqi kutubxona
- ❌ Modul A → Modul B **to'g'ridan-to'g'ri import**

### Ruxsat
- ✅ Event orqali
- ✅ Port orqali (`AuthorizationPort`, `ContactResolver`)

## Modul chegaralari

**`iam`** va **`access-control`** — **bir-birini import qilmaydi**:
- `iam` — **`AuthorizationPort`** (interface)
- `access-control` — **`AccessControlAuthorizationAdapter`** (implement)
- `apps/api` — **composition root** da wire qiladi

## Kod uslubi

- **DDD qatlamlar:** domain → application → infrastructure → presentation
- **Result pattern:** `Result<T, DomainError>` (domain), `Result<T, ApplicationError>` (application)
- **Aggregate Root:** `create()` + `reconstruct()` + business methods
- **Value Object:** `create()` + `getOrThrow()` + `equals()`
- **Event:** `eventId`, `eventName`, `occurredAt`, `aggregateId`, `aggregateType`
- **Event name:** `<module>.<aggregate>.<action>` (masalan, `access-control.role.created`)
- **Command/Handler:** har biri o'z papkasida + `index.ts`
- **Repository:** interface (domain) + Drizzle/InMemory (infrastructure)
- **Mapper:** `toDomain()` + `toPersistence()`
- **Controller:** `create<Name>Router(deps)` factory
- **Validator:** Zod schemas
- **Import:** `.js` kengaytmasi **majburiy** (ESM)
- **`super(id, version)`** — AggregateRoot'da `version` **majburiy**

Batafsil: `docs/CONVENTIONS.md`

## Migration pattern (enterprise)

- **UUID** primary keys
- **TIMESTAMPTZ**
- **Partial unique indexes** (`WHERE deleted_at IS NULL`)
- **`version` column** (optimistic concurrency)
- **`tenant_id` nullable** (multi-tenancy)
- **CITEXT email** (case-insensitive)
- **JSONB** + **GIN index**
- **`updated_at` triggers**
- **Idempotent** (`IF NOT EXISTS` / `OR REPLACE`)

## Event metadata pattern

**`@workspace/kernel`**:
- `EventMetadata` — 8 field
- `EventEnvelope<TEvent>` — `{ event, metadata }`
- `EventContext` — request scoped
- Helpers: `envelopeOf`, `mergeContext`, `metadataFromContext`, `EMPTY_EVENT_CONTEXT`

**`access-control`**:
- `OutboxPort` — `enqueue(event, context?)`, `enqueueAll(events, context?)`, `enqueueEnvelopes(envelopes)`
- `DrizzleOutboxRepository` — metadata columns

## `iam` hozirgi holati

**Schema** (`0001_iam_v2_schema.sql`):
- `identities` — UUID, CITEXT email, soft delete, tenant_id, version, MFA
- `iam_sessions` — UUID, `refresh_token_hash`, revoked_at, version
- `social_identities` — UUID, CITEXT provider_email
- `iam_devices` — UUID, updated_at
- `iam_oauth_states` — TIMESTAMPTZ
- `iam_outbox_events` — platform `OutboxStore` pattern

**Domain:** `User` (softDelete, tenantId, version), `Session` (`refreshTokenHash`)

**Application:** `LoginUserHandler`, `OAuthLoginHandler`, `AuthService` — `authorization?: AuthorizationPort`

**Olib tashlangan:** RBAC (Role, Permission, Policy, handlers, controllers, guards)

## `access-control` hozirgi holati

**Domain:**
- `Role`, `Permission`, `Policy`, `RoleAssignment` (AggregateRoot'lar)
- 13 ta domain event

**Application:**
- **12 commands**, **7 queries**, **PolicyEvaluator**
- **`AccessControlAuthorizationAdapter`** — `AuthorizationPort` implement

**Infrastructure:**
- Drizzle schema (UUID, TIMESTAMPTZ, JSONB, GIN)
- Drizzle + InMemory repos
- `RbacSeeder` (idempotent)
- Migration `0001_create_access_control.sql`, `0002_add_event_metadata.sql`

**Presentation:** 19 endpoint under `/api/v1/access-control/*`

## `apps/api` integratsiya

```
src/
├── bootstrap.ts
├── server.ts
├── routes.ts
├── middleware.ts
├── errors.ts
├── config.ts
├── health.ts
└── container/
    ├── index.ts
    ├── controllers.ts
    ├── iam-container.ts
    ├── access-control-container.ts
    ├── tenant-container.ts
    ├── audit-container.ts
    ├── notification-container.ts
    └── contact-resolver.ts
```

**Route'lar:** `/api/v1/{auth, identity, tenants, audit-logs, notifications, access-control}`

**Composition root tartibi:**
1. `access-control` (birinchi — authorization adapter uchun)
2. `iam` (authorization bilan)
3. `tenant`, `audit`, `notification`
4. Re-mount `access-control` with real authGuard

## Testlar

**`apps/api/tests/`:** 49/49 ✅
- `audit.unit.test.ts` (12)
- `auth.integration.test.ts` (3)
- `notification.unit.test.ts` (13)
- `oauth.security.test.ts` (6)
- `outbox.test.ts` (3)
- `tenant.unit.test.ts` (12)

## Keyingi rejalar

### Faza 1 — `access-control` testlari
### Faza 2 — `iam` OutboxEventBus → EventEnvelope
### Faza 3 — Middleware va xavfsizlik (Phase-0)
- `requestId`, `AsyncLocalStorage`, rate limit (auth uchun 5 req/min)
### Faza 4 — `AuthorizationPort` to'liq wire (JWT role claimlar)
### Faza 5 — Data migration
### Faza 6 — Documentation yangilash
### Faza 7 — Boshqa modullar (billing, subscription, ...)
### Faza 8 — Frontend
### Faza 9 — CI/CD

## Birinchi vazifa

**Iltimos:**

1. **Quyidagi fayllarni o'qing** (GitHub yoki lokal):
   - `README.md`
   - `docs/architecture.md`
   - `docs/PROGRESS.md`
   - `docs/CONVENTIONS.md`

2. **`git log --oneline -10`** ni ko'ring

3. **Qisqa javob yozing:**
   - Loyiha nima ekanini tushundingizmi?
   - Qayerda ekanimizni bilasizmi?
   - Qanday ishlashimizni tushundingizmi?
   - Keyingi qadam nima bo'lishi kerak?

**Javobingizdan keyin** biz **Phase-0 (middleware va xavfsizlik)** ni boshlaymiz.

---

**Muhim:** O'zbek tilida yozing. Kod **ingliz** tilida.
```

---

## Fayl oxiri

Bu fayl **`docs/HANDOFF.md`** ning **to'liq matni**.
Yangi oynada **yuqoridagi promptni** nusxa ko'chirib yopishtirasiz.