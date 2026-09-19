# Session State

**Oxirgi yangilanish:** 2026-09-20
**Oxirgi commit:** `3b9fa8b`

## Faol faza

**Faza 5** — Boshqa modullar (boshlanmagan)

## Tugallangan fazalar

- ✅ Faza 0 — `apps/api` middleware (Phase-0)
- ✅ Faza 1 — `access-control` testlari (212/212)
- ✅ Faza 2 — `iam` OutboxPort → EventContext
- ✅ Faza 3 — `AuthorizationPort` (kod)
- ✅ Faza 3.5 — Test runner migratsiyasi (node:test → vitest)
- ✅ Faza 3.6 — Authorization testlar (+20)
- ✅ Faza 4 — Data migration **KERAK EMAS** (real data yo'q)

## Keyingi qadam

**Faza 5** — yangi modul yozish:

- `billing` — to'lov, invoice, subscription
- `subscription` — rejalar, tariflar
- `catalog` — mahsulot, kategoriya
- `media` — fayl saqlash
- `search` — qidiruv
- `analytics` — statistika
- `reports` — hisobotlar

## Test holati

- **Vitest:** 300/300 (24 files)
  - `modules/access-control` — 221/221 (13 files)
  - `modules/iam` — 7/7 (1 file)
  - `apps/api/tests` — 72/72 (10 files)
- **Typecheck:** 39/39
- **Runner:** Vitest (bitta, hamma joyda)

## DB holati (2026-09-20)

| Jadval | Qatorlar |
|---|---|
| identities | 4 (test data) |
| iam_sessions | 4 |
| iam_devices | 0 |
| iam_oauth_states | 0 |
| iam_outbox_events | 8 |
| social_identities | 0 |
| ac_roles | 4 |
| ac_role_permissions | 13 |
| ac_role_assignments | 6 |
| ac_policies | 0 |
| ac_outbox_events | 10 |
| tenant_tenants | 0 |
| tenant_members | 0 |

## Muhim eslatmalar

1. **Network muammosi:** GitHub push ishlamaydi (`Failed to connect to github.com:443`). Local commit saqlanadi.
2. **BOM muammosi:** `package.json`, `.sql` uchun `[System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))`.
3. **PowerShell bloklar:** Uzoq bloklarda fayllar tushib qolishi mumkin — bittalab yozilsin.
4. **`.js` kengaytmasi:** ESM uchun majburiy.
5. **Test runners:** **Vitest** (bitta). `node:test` butunlay olib tashlandi.
6. **`vitest.config.ts`:** `loadEnv` bilan env yuklanadi.
7. **`psql` o'rnatilmagan:** DB tekshirish uchun `apps/api/check-db.mjs`.
8. **`assignedBy`:** UUID bo'lishi kerak (`'system'` emas).
9. **Import path:** `__tests__/` dan `../../../` va `../../../../`.
10. **`withAmbientContext`:** Proxy-based (barcha metodlar saqlanadi).
