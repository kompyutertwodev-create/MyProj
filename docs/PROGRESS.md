# Bajarilgan ishlar

Bu fayl **xronologik** tartibda **barcha** bajarilgan ishlarni saqlaydi. Har bir modul **tugagach** yangilanadi.

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

## 2026-09-18 — `modules/iam`

**Holat:** ✅ Tugallangan (allaqachon mavjud edi)
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

**Muhim qarorlar:**
- `Member` — join entity (User ↔ Tenant)
- Bir user bir nechta tenant'da bo'lishi mumkin
- `Organization` — keyinroq (hozircha yo'q)

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
- **Event-driven:** `iam` va `tenant` event'larini **tinglaydi**
- **Index'lar:** actor_id, tenant_id, event_type, target, occurred_at

**Muhim qarorlar:**
- `AuditEventSubscriber` — `EventHandler` interfeysini **implement qiladi**
- `EventBus.subscribe` — **wildcard yo'q**, har bir event **alohida**
- `AUDITED_EVENT_NAMES` — **o'zgarmas** ro'yxat

---

## 2026-09-19 (3-qism) — `modules/notification`

**Holat:** ✅ Tugallangan
**Commit:** `3671e6c`
**Fayllar:** ~60 ta
**Yangi qatorlar:** ~2500
**Testlar:** 13/13 unit
**Xususiyatlar:**
- **Domain:** Notification aggregate, RecipientId/RecipientContact VOs, Channel/Status enum, 2 ta event
- **Application:**
  - SendNotificationHandler
  - ListNotificationsHandler
  - NotificationDispatcher (event-driven)
  - ContactResolver port
  - DefaultTemplateCatalog
- **Infrastructure:**
  - `notifications` jadval
  - **PlatformEmailSender** (SendGrid/SES)
  - **TelegramBotSender** (enterprise-grade):
    - TelegramApiClient (fetch + AbortController)
    - TelegramRateLimiter (token bucket, 30 msg/s)
    - TelegramRetryPolicy (exponential backoff + jitter)
    - TelegramError (retryable vs non-retryable)
    - TelegramLogger (structured JSON)
  - FakeNotificationSender
- **Presentation:** HTTP router, Zod validators
- **Event-driven:** `iam.UserRegistered` → welcome email, `tenant.created` → tenant welcome

**Muhim qarorlar:**
- **Adapter pattern** — `notification` tashqi servislarni **bilmaydi**
- **ContactResolver port** — `notification` `iam` **domain**ini **bilmaydi**
- **Enterprise Telegram** — rate limit, retry, timeout, logging, idempotency

---

## Umumiy statistika (2026-09-19)

| Ko'rsatkich | Qiymat |
|---|---|
| **Tugallangan modullar** | 4 ta (`iam`, `tenant`, `audit`, `notification`) |
| **Yozilgan fayllar** | ~310 ta |
| **Yangi qatorlar** | ~6500 |
| **Testlar** | 58/58 ✅ |
| **Typecheck** | 39/39 ✅ |
| **Commit'lar** | 3 ta |

---

## Keyingi qadamlar

### Bosqich 2 (reja)

- [ ] `modules/access-control` — RBAC/ABAC ni `iam` dan **ajratish**
- [ ] `modules/subscription` — SaaS obuna
- [ ] `modules/billing` — to'lovlar (Stripe/Payme)
- [ ] `modules/catalog` — biznes ma'lumotlar
- [ ] `modules/media` — fayl yuklash (S3/MinIO)
- [ ] `modules/search` — qidiruv (Elasticsearch/Meilisearch)
- [ ] `modules/analytics` — analitika
- [ ] `modules/reports` — hisobotlar

### Bosqich 3

- [ ] `apps/web` — Next.js frontend
- [ ] `apps/admin` — admin panel
- [ ] `apps/mobile` — mobil ilova
- [ ] `apps/telegram` — Telegram bot

### Bosqich 4

- [ ] CI/CD — GitHub Actions
- [ ] Docker — image'lar
- [ ] Kubernetes — deployment
- [ ] Monitoring — OpenTelemetry, Sentry

---

## Ishlash tartibi (tarixiy)

Har bir modul quyidagi **faza-faza** tartibda yoziladi:

1. **Faza 1:** Domain (aggregate, entity, VO, event, repository interface)
2. **Faza 2:** Domain events
3. **Faza 3:** Application ports (ApplicationError, EventBusPort, OutboxPort, UnitOfWork)
4. **Faza 4:** Application (commands, queries, handlers)
5. **Faza 5:** Infrastructure (schema, migrations, mapper, repositories)
6. **Faza 6:** Adapters (email, telegram, va h.k.)
7. **Faza 7:** Presentation (controller, validators, middleware)
8. **Faza 8:** Integration (`apps/api` ga ulash)
9. **Faza 9:** Event handlers (boshqa modul event'larini tinglash)
10. **Faza 10:** Testlar (unit)

**Har bir fazadan keyin:**
- `pnpm typecheck` ishga tushiriladi
- Xato bo'lsa — to'liq matn yuboriladi
- Modul tugagach — commit qilinadi

**Muhim:** PowerShell'da **`BOM`** muammosi bor. `package.json` va `.sql` uchun **`[System.IO.File]::WriteAllText`** ishlatiladi.