# Flaro — Rules

## Hər sessiyanın əvvəlində oxu

1. `TODO.md` → "Cari Vəziyyət" blokunu oxu, növbəti tapşırığı tap
2. Tapşırığa aid sənədi oxu:

| Tapşırıq | Sənəd |
|---|---|
| DB, migration, RLS | `docs/02_DATABASE_SCHEMA.md` |
| Auth, JWT, security | `docs/03_AUTH_AND_SECURITY.md` |
| Canvas, Rough.js | `docs/04_CANVAS_ENGINE.md` |
| Realtime, collab | `docs/05_COLLABORATION.md` |
| Stripe, billing | `docs/06_SUBSCRIPTION_BILLING.md` |
| Edge Functions, API | `docs/07_API_AND_EDGE_FUNCTIONS.md` |
| React components | `docs/08_FRONTEND_COMPONENTS.md` |
| Deploy, CI/CD | `docs/09_DEPLOYMENT.md` |
| Env variables | `docs/10_ENV_AND_CONFIG.md` |

## İş qaydaları

- Hər tapşırıqdan sonra `TODO.md`-də `[ ]` → `[x]` et
- Layihə adı həmişə `Flaro` olmalıdır; `SketchFlow/sketchflow` istifadə etmə
- Branch adları və commit mesajları ingiliscə olmalıdır
- PR birləşməmiş növbəti tapşırığa başlama
- Heç vaxt birbaşa `main`-ə push etmə
