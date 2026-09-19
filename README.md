# Identity Platform

Enterprise-grade SaaS platform built as a pnpm monorepo with Domain-Driven Design and Clean Architecture.

## Status

### Modullar

| Modul | Holat | Tavsif |
|---|---|---|
| `@workspace/kernel` | ✅ | DDD asoslari + EventMetadata, EventEnvelope, EventContext, sha256Hex |
| `@workspace/platform` | ✅ | Logger, PostgreSQL, email, messaging, cache, migrations |
| `@workspace/contracts` | ✅ | Umumiy tiplar va interfeyslar |
| `@workspace/iam` | ✅ | Auth + Users + OAuth (RBAC `access-control`ga ko'chirilgan) |
| `@workspace/access-control` | ✅ | RBAC + ABAC (Role, Permission, Policy, RoleAssignment) |
| `@workspace/tenant` | ✅ | Multi-tenancy, membership, tenant settings |
| `@workspace/audit` | ✅ | Event-driven audit log |
| `@workspace/notification` | ✅ | Email (SendGrid/SES), Telegram (enterprise) |
| `@workspace/billing` | 🟡 | Skelet |
| `@workspace/subscription` | 🟡 | Skelet |
| Boshqa 9 modul | 🟡 | Skelet |

### Ilovalar

| Ilova | Holat |
|---|---|
| `apps/api` | ✅ (iam + access-control + tenant + audit + notification) |
| `apps/web` | 🟡 Skelet |
| `apps/admin` | 🟡 Skelet |
| `apps/mobile` | 🟡 Skelet |
| `apps/telegram` | 🟡 Skelet |

**Testlar:** 49/49 ✅ | **Typecheck:** 39/39 ✅

## Texnologiyalar

- **Til:** TypeScript 5.9
- **Package manager:** pnpm (workspace)
- **API:** Express 5, Pino, Helmet
- **Mobile:** Expo / React Native 0.79
- **Telegram:** grammY
- **DB:** PostgreSQL + Drizzle ORM (Supabase)
- **Cache/Queue:** Redis, BullMQ
- **Auth:** JWT (jose), Bcrypt
- **Test:** `node:test`, Playwright
- **CI/CD:** GitHub Actions, Docker, Kubernetes

## Tez boshlash

```bash
# O'rnatish
pnpm install

# Typecheck (39/39 workspace)
pnpm typecheck

# Testlar (49/49)
cd apps/api && pnpm test

# Dev server
cd apps/api && pnpm dev
```

## Muhit o'zgaruvchilari

`apps/api/.env`:

```
DATABASE_URL="postgresql://user:password@host:6543/postgres"
JWT_SECRET="<64-belgi-random>"
PORT=3000
NODE_ENV=development
```

Ixtiyoriy (notification uchun):

```
SENDGRID_API_KEY=...
EMAIL_FROM=noreply@example.com
TELEGRAM_BOT_TOKEN=...
```

Ixtiyoriy (OAuth uchun):

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_REDIRECT_URI=...
```

## Arxitektura

Har bir modul **DDD + Clean Architecture** bo'yicha 4 qatlamdan iborat:

```
Presentation → Application → Domain
                    ↑
              Infrastructure
```

**Muhim:** modullar **bir-birini to'g'ridan-to'g'ri import qilmaydi** — **port** yoki **event** orqali.

Batafsil: [`docs/architecture.md`](./docs/architecture.md)

## Modul chegaralari

### `iam` ↔ `access-control`

- `iam` — **`AuthorizationPort`** (interface)
- `access-control` — **`AccessControlAuthorizationAdapter`** (implement)
- `apps/api` — **composition root** da wire qiladi

### `notification` ↔ `iam`

- `notification` — **`ContactResolver`** port
- `apps/api` — `ApiContactResolver` adapter

## HTTP API

### `/api/v1/auth` — IAM auth
### `/api/v1/identity` — IAM users
### `/api/v1/tenants` — tenant
### `/api/v1/audit-logs` — audit
### `/api/v1/notifications` — notification
### `/api/v1/access-control` — RBAC + ABAC

## Hujjatlar

- [Arxitektura](./docs/architecture.md)
- [Bajarilgan ishlar](./docs/PROGRESS.md)
- [Kod uslubi](./docs/CONVENTIONS.md)
- [Yangi oyna uchun handoff](./docs/HANDOFF.md)

## Litsenziya

Private — barcha huquqlar himoyalangan.