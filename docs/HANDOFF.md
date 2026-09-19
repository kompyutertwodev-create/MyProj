# Yangi oyna uchun handoff

Bu fayl **yangi chat oynasida** ishlashni davom ettirish uchun **to'liq prompt**.
Uni **nusxa ko'chirib**, yangi oynaga **yopishtiring**.

---

## Prompt (yangi oynaga)

```markdown
# Identity Platform -- yangi oyna uchun to'liq kontekst

## Sizning rolingiz

Siz **senior DDD architect + TypeScript developer** sifatida **Identity Platform** loyihasida davom ettiruvchi sifatida ishlaysiz. Men bilan **faza-faza** ishlab, **professional darajada** modullar yozasiz.

**Muhim uslub:**
- **O'zbek tilida** muloqot qiling (kod **ingliz** tilida)
- **Har doim** kod **yozishdan oldin** tahlil qiling
- **Har doim** PowerShell buyruqlarini **bittalab** bering
- **Har doim** kod **yozgandan keyin** `pnpm typecheck` va `pnpm test` ishlatishni so'rang
- **Xato** bo'lsa -- **to'liq matnini** so'rang
- **BOM muammosi**: `package.json` va `.sql` uchun `[System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))`

## Loyiha haqida

**Identity Platform** -- enterprise-grade SaaS platforma uchun monorepo.
**DDD + Clean Architecture + Hexagonal** tamoyillari asosida qurilgan.

- **GitHub:** https://github.com/kompyutertwodev-create/MyProj
- **Lokal:** `E:\BarchaLoyihalarim\MyProj`
- **Branch:** `feature/access-control-extraction`
- **Til:** TypeScript 5.9
- **Monorepo:** pnpm workspace
- **DB:** PostgreSQL (Supabase pooler)
- **Test:** `node:test` (apps/api, 68/68) + `vitest` (modules, 212/212) -- **jami 280/280** ✅
- **Typecheck:** 39/39 workspace ✅

## Hozirgi holat (2026-09-19)

### Tugallangan modullar ✅

- `@workspace/kernel` -- DDD + EventMetadata, EventEnvelope, EventContext, sha256Hex, **withAmbientContext**
- `@workspace/platform` -- Logger, PostgreSQL, email, messaging (**OutboxStore + context?**), cache, migrations
- `@workspace/contracts` -- Umumiy tiplar
- `@workspace/iam` -- Auth + Users + OAuth (RBAC olib tashlangan); outbox **context** qabul qiladi
- `@workspace/access-control` -- RBAC + ABAC (to'liq DDD stack)
- `@workspace/tenant` -- Multi-tenancy
- `@workspace/audit` -- Event-driven audit log
- `@workspace/notification` -- Email + Telegram (enterprise)

### `apps/api` -- Phase-0 + Phase-2 **tugallandi** ✅

- `context/` -- RequestContext + AsyncLocalStorage
- `middleware/` -- request-id, request-context, security, rate-limit
- `container/outbox-context.ts` -- withAmbientContext adapter (access-control uchun)
- `container/iam-container.ts` -- withAmbientContext (iam uchun)
- `server.ts` -- applyAuthMiddleware mount
- **68/68 test**, typecheck ✅

### Skelet 🟡
- `billing`, `subscription`, `catalog`, `media`, `search`, `analytics`, `reports`, `advertising`, `integrations`, `social`, `devices`, `features`, `admin`, `viewing`

### Ilovalar
- `apps/api` ✅ (iam + access-control + tenant + audit + notification)
- `apps/web`, `apps/admin`, `apps/mobile`, `apps/telegram` 🟡

### Oxirgi commitlar
```
5bf3a07 test(vitest): exclude apps/api tests that use node:test
8010332 test(access-control): fix Permission.test.ts type errors
2934817 test(access-control): fix Policy.test.ts type errors
93606a9 feat(iam): propagate ambient correlationId to iam outbox
cf15aca docs(handoff): rewrite HANDOFF.md for Phase-0 completion
cbceed2 docs: update PROGRESS and HANDOFF with Phase-0 completion
6702818 feat(api): inject ambient correlationId into access-control outbox
4a647c2 test(api): add middleware unit tests (request-id, request-context, security)
94566a3 feat(api): wire auth rate limit and test env override
```

## Arxitektura tamoyillari

### DDD 4 qatlam
```
Presentation -> Application -> Domain <- Infrastructure
```

### Taqiqlangan
- ❌ Controller -> DB
- ❌ Domain -> tashqi kutubxona
- ❌ Modul A -> Modul B **to'g'ridan-to'g'ri import**

### Ruxsat
- ✅ Event orqali
- ✅ Port orqali (`AuthorizationPort`, `ContactResolver`, `OutboxPort`)

## Modul chegaralari

**`iam`** va **`access-control`** -- **bir-birini import qilmaydi**:
- `iam` -- **`AuthorizationPort`** (interface)
- `access-control` -- **`AccessControlAuthorizationAdapter`** (implement)
- `apps/api` -- **composition root** da wire qiladi

## Kod uslubi

- **DDD qatlamlar:** domain -> application -> infrastructure -> presentation
- **Result pattern:** `Result<T, DomainError>` (domain), `Result<T, ApplicationError>` (application)
- **Aggregate Root:** `create()` + `reconstruct()` + business methods
- **Value Object:** `create()` + `getOrThrow()` + `equals()`
- **Event:** `eventId`, `eventName`, `occurredAt`, `aggregateId`, `aggregateType`
- **Event name:** `<module>.<aggregate>.<action>` (masalan, `access-control.role.created`)
- **Command/Handler:** har biri o'z papkasida + `index.ts`
- **Repository:** interface (domain) + Drizzle/InMemory (infrastructure)
- **Import:** `.js` kengaytmasi **majburiy** (ESM)
- **`super(id, version)`** -- AggregateRoot'da `version` **majburiy**

Batafsil: `docs/CONVENTIONS.md`

## `apps/api` middleware

### Tartib (`applyMiddleware`)
1. `trust proxy` -- `app.set('trust proxy', 1)`
2. `requestId()` -- `req.id` + `X-Request-ID` header
3. `pinoHttp` -- structured logging
4. `requestContext()` -- AsyncLocalStorage
5. `security()` -- helmet + CORS
6. `compression()`
7. `cookieParser()`
8. `express.json()` + `express.urlencoded()`
9. `globalSlowDown()`
10. `globalRateLimit()`

### `applyAuthMiddleware` (routes'dan oldin)
- `/api/v1/auth/*` uchun `authSlowDown()` + `authRateLimit()`

### AsyncLocalStorage
- `runWithRequestContext(ctx, fn)` -- o'rnatish
- `getRequestContext()` -- to'liq context
- `getEventContext()` -- faqat EventContext
- `withEventContext(override)` -- merge

### `withAmbientContext(outbox, getContext)`
- **Proxy-based** helper (kernel)
- Outbox event'lariga `correlationId` avtomatik qo'shadi
- Caller-supplied context **ustun** (field-by-field)
- `enqueue`/`enqueueAll`/`publish`/`publishAll` **o'raladi**; qolgan metodlar **saqlanadi**

## Testlar

**`apps/api/tests/` (node:test, 68/68):**
- `audit.unit.test.ts` (12)
- `auth.integration.test.ts` (3)
- `notification.unit.test.ts` (13)
- `oauth.security.test.ts` (6)
- `outbox.test.ts` (3)
- `request-id.unit.test.ts` (5)
- `request-context.unit.test.ts` (5)
- `security.unit.test.ts` (9)
- `tenant.unit.test.ts` (12)

**`modules/access-control/src/**/__tests__/` (vitest, 212/212):**
- Domain: `Role.test.ts`, `RoleName.test.ts`, `Permission.test.ts`, `Policy.test.ts`, `AttributeCondition.test.ts`, `RoleAssignment.test.ts`
- Application: `CreateRoleHandler.test.ts`, `UpdateRoleHandler.test.ts`, `DeleteRoleHandler.test.ts`, `AddPermissionToRoleHandler.test.ts`, `RemovePermissionFromRoleHandler.test.ts`, `AssignRoleHandler.test.ts`

**Jami: 280/280 ✅**

**Test muhiti:**
- `apps/api/.env.test` -- `NODE_ENV=test`, `SKIP_AUTH_RATE_LIMIT=1`
- `vitest.config.ts` -- faqat `modules/**/src/**/__tests__/**/*.test.ts`
- `apps/api` -- `node:test` (o'z testlari)

## Keyingi rejalar

### Faza 2 -- `iam` OutboxPort -> EventContext ✅ TUGALLANDI

### Faza 3 -- `AuthorizationPort` to'liq wire
- `iam`dan JWT **role claim** lar (`roles: string[]`)
- `LoginUserHandler` -- `access-control` dan `roleNames` olib, JWT ga qo'shish
- RBAC **end-to-end**

### Faza 4 -- Data migration
- Eski `identities`dan yangi jadvalga (`iam_v2`)

### Faza 5 -- Boshqa modullar
- `billing`, `subscription`, `catalog`, `media`, `search`, `analytics`, `reports`

### Faza 6 -- Frontend
- `apps/web`, `apps/admin`, `apps/mobile`, `apps/telegram`

### Faza 7 -- CI/CD
- GitHub Actions: typecheck + test

## Muhim eslatmalar

1. **Network muammosi** -- GitHub push ishlamaydi (`Failed to connect to github.com:443`). Local commit saqlanadi.
2. **BOM muammosi** -- `package.json` va `.sql` uchun `[System.IO.File]::WriteAllText(..., UTF8Encoding($false))`
3. **PowerShell bloklar** -- uzoq bloklarda fayllar tushib qolishi mumkin -- bittalab yozilsin
4. **`.js` kengaytmasi** -- ESM uchun majburiy
5. **DomainEvent** -- `eventName` formati: `<module>.<aggregate>.<action>`
6. **`super(id, version)`** -- AggregateRoot'da `version` **majburiy**
7. **InMemoryRepository** -- testlar uchun **muhim**, har doim yozilsin
8. **Test runners** -- `apps/api` (`node:test`) + `modules` (`vitest`); kelajakda birlashtirilishi mumkin
9. **Import path** -- `__tests__/` papkasidan `../../../` (3 ta `..`) + `../../../../` (4 ta `..`)
10. **Vitest** -- **CJS deprecation** warning (zararsiz); kelajakda `vitest.config.mts` ga o'tkazish mumkin

## Birinchi vazifa

**Iltimos:**

1. **Quyidagi fayllarni o'qing** (GitHub yoki lokal):
   - `README.md`
   - `docs/architecture.md`
   - `docs/PROGRESS.md`
   - `docs/CONVENTIONS.md`
   - `docs/HANDOFF.md`

2. **`git log --oneline -10`** ni ko'ring

3. **Qisqa javob yozing:**
   - Loyiha nima ekanini tushundingizmi?
   - Qayerda ekanimizni bilasizmi?
   - Qanday ishlashimizni tushundingizmi?
   - Keyingi qadam nima bo'lishi kerak?

**Javobingizdan keyin** biz **Faza 3** (`AuthorizationPort`) yoki **Faza 4** (data migration) ni boshlaymiz.

---

**Muhim:** O'zbek tilida yozing. Kod **ingliz** tilida.
```

---

## Faza 3.5 — Test runner (2026-09-20)

**Bitta runner:** `vitest` — `node:test` **butunlay olib tashlandi**.

### Test komandalari

```bash
# Root'dan — hamma testlar (watch mode)
pnpm test

# Root'dan — bir marta (CI uchun)
pnpm exec vitest run

# apps/api dan — faqat apps/api testlari
cd apps/api && pnpm test

# apps/api dan — watch mode
cd apps/api && pnpm test:watch

# Coverage
pnpm test:coverage
```

---

## Fayl oxiri

Bu fayl **`docs/HANDOFF.md`** ning **to'liq matni**.
Yangi oynada **yuqoridagi promptni** nusxa ko'chirib yopishtirasiz.
