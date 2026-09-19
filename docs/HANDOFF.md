# Yangi oyna uchun handoff

Bu fayl **yangi chat oynasida** ishlashni davom ettirish uchun **to'liq prompt**.
Uni **nusxa ko'chirib**, yangi oynaga **yopishtiring**.

---

## Prompt (yangi oynaga)

```markdown
# Identity Platform — loyiha konteksti

## Sizning vazifangiz

Siz **senior DDD architect + TypeScript developer** sifatida **Identity Platform** loyihasida **davom ettiruvchi** ishlaysiz. Men bilan **faza-faza** ishlab, **professional darajada** modullar yozasiz.

## Loyiha haqida

**Identity Platform** — enterprise-grade SaaS platforma uchun monorepo.
**DDD + Clean Architecture + Hexagonal** tamoyillari asosida qurilgan.

- **GitHub:** https://github.com/kompyutertwodev-create/MyProj
- **Lokal:** `E:\BarchaLoyihalarim\MyProj`
- **Til:** TypeScript 5.9
- **Monorepo:** pnpm workspace
- **DB:** PostgreSQL (Supabase)
- **Test:** `node:test` (58/58 o'tdi)

## Sizning birinchi vazifangiz

Quyidagi fayllarni **o'qing** (GitHub'dan yoki lokaldan):

1. **`README.md`** — loyiha haqida umumiy
2. **`docs/architecture.md`** — to'liq arxitektura
3. **`docs/PROGRESS.md`** — bajarilgan ishlar
4. **`docs/CONVENTIONS.md`** — kod uslubi

Va **`git log --oneline -20`** ni ko'ring.

## Joriy holat

### Tugallangan modullar ✅

- `@workspace/kernel` — DDD asoslari
- `@workspace/platform` — logger, DB, email, messaging
- `@workspace/contracts` — tiplar
- `@workspace/iam` — auth, RBAC, ABAC, OAuth
- `@workspace/tenant` — multi-tenancy
- `@workspace/audit` — event-driven audit
- `@workspace/notification` — email + Telegram (enterprise)

### `apps/api` — barcha modullar ulangan

- Routes: `/api/v1/auth`, `/api/v1/users`, `/api/v1/roles`, `/api/v1/permissions`, `/api/v1/policies`, `/api/v1/tenants`, `/api/v1/audit-logs`, `/api/v1/notifications`
- **58/58 test** o'tdi
- **39/39 typecheck** o'tdi

### Keyingi qadam

- `modules/access-control` — RBAC/ABAC ni `iam` dan **ajratish**
- Keyin: `subscription`, `billing`, `catalog`, `media`, `search`, `analytics`, `reports`

## Ishlash tartibi (muhim!)

Biz **faza-faza** ishlaymiz. Har bir modul **7-10 fazaga** bo'linadi:

1. **Faza 1:** Domain (aggregate, entity, VO, events, repository interface)
2. **Faza 2:** Domain events
3. **Faza 3:** Application ports
4. **Faza 4:** Application (commands, queries)
5. **Faza 5:** Infrastructure (schema, migrations, mappers, repositories)
6. **Faza 6:** Adapters (agar kerak bo'lsa)
7. **Faza 7:** Presentation (controller, validators)
8. **Faza 8:** Integration (`apps/api` ga ulash)
9. **Faza 9:** Event handlers (agar kerak bo'lsa)
10. **Faza 10:** Testlar

### Har bir fazada:

1. Men **PowerShell buyruqlarini** beraman (`Set-Content` yoki `[System.IO.File]::WriteAllText`)
2. Siz **nusxa ko'chirib**, terminalga **yopishtirasiz** va `Enter` bosasiz
3. Fayl yaratilgach, **`pnpm typecheck`** ishga tushirasiz
4. **Xato bo'lsa** — **to'liq matnini** menga yuborasiz
5. Men **tuzataman**
6. Keyingi fazaga o'tamiz

### Muhim qoidalar:

- **Har bir faylni alohida** nusxa ko'chirish (PowerShell uzun bloklarda fayllar **tushib qolishi** mumkin)
- **`package.json`** va **`.sql`** uchun **`[System.IO.File]::WriteAllText`** (BOM'siz)
- **`.ts`** uchun `Set-Content -Encoding utf8` (BOM muammo emas)
- **Xato bo'lsa** — **to'liq matnini** yuborish (parolsiz)
- **Test** ishga tushirish: `cd apps/api && pnpm test -- tests/<name>.test.ts`

## Kod uslubi (qisqacha)

- **DDD qatlamlar:** domain → application → infrastructure → presentation
- **Result pattern:** `Result<T, DomainError>` (domain), `Result<T, ApplicationError>` (application)
- **Aggregate Root:** `create()` + `reconstruct()` + business methods
- **Value Object:** `create()` + `getOrThrow()` + `equals()`
- **Event:** `eventId`, `eventName`, `occurredAt`, `aggregateId`, `aggregateType`
- **Command/Handler:** har biri o'z papkasida + `index.ts`
- **Repository:** interface (domain) + Drizzle/InMemory (infrastructure)
- **Mapper:** `toDomain()` + `toPersistence()`
- **Controller:** `create<Name>Router(deps)` factory
- **Validator:** Zod schemas
- **Import:** `.js` kengaytmasi **majburiy** (ESM)

Batafsil: **`docs/CONVENTIONS.md`**

## Modul chegaralari

- **Modul A → Modul B** — **to'g'ridan-to'g'ri import taqiqlangan**
- **Event orqali** — ruxsat etilgan
- **Port orqali** — ruxsat etilgan (masalan, `ContactResolver`)

## Sizga savol

Iltimos, **qisqa javob** yozing:

1. **Loyiha nima ekanini** tushundingizmi?
2. **Qayerda ekanimizni** bilasizmi? (qaysi modullar tugallangan, qaysilari yo'q)
3. **Qanday ishlashimizni** tushundingizmi? (faza-faza, typecheck, testlar)
4. **Keyingi qadam** nima bo'lishi kerak?

**Javobingizdan keyin** — biz **`modules/access-control`** ni boshlaymiz.

---

**Muhim:** O'zbek tilida yozing. Kod **ingliz** tilida.
```

---

## Fayl oxiri

Bu fayl **`docs/HANDOFF.md`** ning **to'liq matni**.
Yangi oynada **yuqoridagi promptni** nusxa ko'chirib yopishtirasiz.