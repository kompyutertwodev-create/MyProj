# Identity Platform

Enterprise-grade SaaS platform built as a pnpm monorepo with Domain-Driven Design and Clean Architecture.

## Status

| Modul | Holat | Tavsif |
|---|---|---|
| `@workspace/kernel` | ✅ | DDD asoslari (AggregateRoot, Result, ValueObject, DomainError) |
| `@workspace/platform` | ✅ | Logger, PostgreSQL, email, messaging, cache, migrations |
| `@workspace/contracts` | ✅ | Umumiy tiplar va interfeyslar |
| `@workspace/iam` | ✅ | Autentifikatsiya, RBAC, ABAC, OAuth (Google/GitHub/Telegram) |
| `@workspace/tenant` | ✅ | Multi-tenancy, membership, tenant settings |
| `@workspace/audit` | ✅ | Event-driven audit log |
| `@workspace/notification` | ✅ | Email (SendGrid/SES), Telegram (enterprise), event dispatcher |
| `@workspace/access-control` | 🟡 | Skelet |
| `@workspace/billing` | 🟡 | Skelet |
| `@workspace/subscription` | 🟡 | Skelet |
| Boshqa 9 modul | 🟡 | Skelet |

| Ilova | Holat |
|---|---|
| `apps/api` | ✅ (iam + tenant + audit + notification) |
| `apps/web` | 🟡 Skelet |
| `apps/admin` | 🟡 Skelet |
| `apps/mobile` | 🟡 Skelet |
| `apps/telegram` | 🟡 Skelet |

**Testlar:** 58/58 ✅ | **Typecheck:** 39/39 ✅

## Texnologiyalar

- **Til:** TypeScript 5.9
- **Package manager:** pnpm (workspace)
- **Web:** Next.js 15, React 19, Tailwind 4
- **API:** Express 5, Pino, Helmet
- **Mobile:** Expo / React Native 0.79
- **Telegram:** grammY
- **DB:** PostgreSQL + Drizzle ORM (Supabase)
- **Cache/Queue:** Redis, BullMQ
- **Auth:** JWT (jose), Argon2id
- **Test:** `node:test`, Playwright
- **CI/CD:** GitHub Actions, Docker, Kubernetes

## Tez boshlash

```bash
# O'rnatish
pnpm install

# Typecheck (39/39 workspace)
pnpm typecheck

# Testlar (58/58)
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

## Arxitektura

Har bir modul **DDD + Clean Architecture** bo'yicha 4 qatlamdan iborat:

```
Presentation → Application → Domain
                    ↑
              Infrastructure
```

Batafsil: [`docs/architecture.md`](./docs/architecture.md)

## Hujjatlar

- [Arxitektura](./docs/architecture.md)
- [Bajarilgan ishlar](./docs/PROGRESS.md)
- [Kod uslubi](./docs/CONVENTIONS.md)
- [Yangi oyna uchun handoff](./docs/HANDOFF.md)

## Litsenziya

Private — barcha huquqlar himoyalangan.