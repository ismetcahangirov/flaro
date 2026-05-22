# TODO — Flaro

> Local AI ilə işləyərkən tamamlanan tapşırıqları `[ ]` → `[x]` et.
> **Format:** `[x]` = tamamlandı · `[ ]` = gözləyir · `[~]` = davam edir · `[!]` = bloklanıb

---

## ⚡ Cari Vəziyyət
> **Bu bloku hər PR birləşəndən sonra yenilə. Token bitib yeni hesabdan davam edirsənsə — yalnız bu bloku oxu.**

| Sahə | Dəyər |
|---|---|
| **Son tamamlanan tapşırıq** | Mərhələ 9 — Admin Panel (App.tsx routes) |
| **Aktiv branch** | `feature/m09-admin-panel` |
| **Növbəti branch** | Yoxdur |
| **Növbəti tapşırıq** | Lint + type-check yoxlanışları |
| **Bloklanmış tapşırıq** | Yoxdur |
| **Qeyd** | Admin Panel implementasiyası davam edir. DB migration (020_admin_system.sql), seed script, tip tərifləri, Zustand store, hooks, AdminRoute, AdminLayout, AdminLogin (brute-force), AdminDashboard (real stats), AdminUsers (CRUD), AdminSubscriptions, AdminSettings, i18n (4 dil), Edge Function (admin-user-delete), Session Timeout, App.tsx route-ları — hamısı yaradıldı. Son qalan: lint + type-check yoxlanışı. |

---

## Git İş Axını (Hər tapşırıq üçün)

```
1.  TODO.md-dəki ilk [ ] tapşırığı tap
2.  git checkout main
3.  git pull origin main
4.  git checkout -b feature/<branch-adı>
5.  Tapşırığı yerinə yetir
6.  Bu TODO.md-də [ ] → [x] et
7.  git add . && git commit -m "<növ>(<əhatə>): <açıqlama>"
8.  git push origin feature/<branch-adı>
9.  Sahibə xəbər ver: branch adı + tamamlanan tapşırıqlar
10. SAHİBİN PR açmasını və birləşdirməsini GÖZLƏ
11. Sahib "davam et" dedikdə → ADDIM 2-yə qayıt
```

> ⚠️ PR birləşməmiş növbəti tapşırığa BAŞLAMA
> ⚠️ Heç vaxt birbaşa main-ə push ETMƏ

---

## Mərhələ 0 — Hazırlıq & Layihə Qurulumu
**Branch:** `feature/m00-setup`
**Status:** `[x]` tamamlandı — 19/19 tamamlandı

### 0.1 Layihə İskelet
- [x] `npm create vite@latest flaro -- --template react-ts` ilə layihə yaradıldı
- [x] Qovluq strukturu yaradıldı (`src/components/`, `src/hooks/`, `src/lib/`, `src/pages/`, `src/store/`, `src/types/`, `src/styles/`)
- [x] `supabase/migrations/` və `supabase/functions/` qovluqları yaradıldı
- [x] `.gitignore` hazırlandı (`.env*`, `node_modules/`, `dist/` və s.)
- [x] `.env.example` şablon faylı hazırlandı

### 0.2 Asılılıqların Quraşdırılması
- [x] `@supabase/supabase-js` quraşdırıldı
- [x] `zustand` + `immer` + `zustand/middleware` quraşdırıldı
- [x] `react-router-dom` v6 quraşdırıldı
- [x] `lucide-react` quraşdırıldı
- [x] `roughjs` + `nanoid` quraşdırıldı
- [x] `@stripe/stripe-js` quraşdırıldı
- [x] `tailwindcss` + `postcss` + `autoprefixer` quraşdırıldı
- [x] `eslint` + `prettier` + TypeScript plugin-ləri quraşdırıldı

### 0.3 Konfiqurasiya Faylları
- [x] `tailwind.config.ts` — brand orange, font-hand (Caveat), animasiyalar konfiqurasiya edildi
- [x] `tsconfig.json` — strict mode, `@/*` alias, `noUncheckedIndexedAccess` aktiv edildi
- [x] `vite.config.ts` — `@/` alias, manual chunks (vendor-react, vendor-supabase, vendor-rough), build optionslar konfiqurasiya edildi
- [x] `vercel.json` — SPA rewrites, security headers (CSP, X-Frame-Options), asset caching konfiqurasiya edildi
- [x] `.eslintrc` + `.prettierrc` hazırlandı
- [x] `package.json` skriptləri əlavə edildi (`db:types`, `db:push`, `lint`, `type-check` və s.)

---

## Mərhələ 1 — Verilənlər Bazası (Supabase DB)
**Branch:** `feature/m01-database`
**Status:** `[x]` tamamlandı — 20/20 tamamlandı

### 1.1 Enum Tipləri
- [x] `001_create_enums.sql` — `subscription_plan`, `subscription_status`, `workspace_role`, `collab_permission`, `element_type` enum-ları yaradıldı

### 1.2 Cədvəllər
- [x] `002_create_profiles.sql` — `profiles` cədvəli yaradıldı (`id`, `email`, `full_name`, `avatar_url`, `plan`, `scenes_count`)
- [x] `profiles` üçün `handle_new_user` trigger-i yaradıldı (auth qeydiyyatda avtomatik profil)
- [x] `profiles` üçün `handle_updated_at` trigger-i yaradıldı
- [x] `003_create_scenes.sql` — `scenes` cədvəli yaradıldı (`elements` JSONB, `app_state` JSONB, `share_token`, `version`)
- [x] `scenes` üçün `check_scenes_limit` trigger-i yaradıldı (Free: max 3)
- [x] `scenes` üçün `update_scenes_count` trigger-i yaradıldı (sayac)
- [x] `004_create_scene_versions.sql` — `scene_versions` cədvəli yaradıldı (Pro versiya tarixi)
- [x] `005_create_workspaces.sql` — `workspaces` cədvəli yaradıldı + `check_workspace_plan` trigger-i (Pro only)
- [x] `006_create_workspace_members.sql` — `workspace_members` cədvəli yaradıldı
- [x] `007_create_scene_collaborators.sql` — `scene_collaborators` cədvəli yaradıldı
- [x] `008_create_subscriptions.sql` — `subscriptions` cədvəli + `sync_user_plan` trigger-i yaradıldı
- [x] `009_create_comments.sql` — `comments` cədvəli yaradıldı (Pro, canvas koordinatları ilə)

### 1.3 RLS Policies
- [x] `010_rls_profiles.sql` — Profiles RLS (öz profil + workspace üzvlük)
- [x] `011_rls_scenes.sql` — Scenes RLS (öz/public/collaborator/workspace)
- [x] `012_rls_workspaces.sql` — Workspaces RLS (owner/member/admin)
- [x] `013_rls_subscriptions.sql` — Subscriptions RLS (service_role write only)
- [x] `014_rls_comments.sql` — Comments RLS (Pro plan)

### 1.4 Storage & Rate Limit
- [x] Storage bucket-ləri yaradıldı: `thumbnails` (public), `avatars` (public), `scene-assets` (private) + RLS policies
- [x] `015_storage_and_rate_limit.sql` — `rate_limit_buckets` cədvəli + `check_rate_limit` PostgreSQL funksiyası yaradıldı

### 1.5 TypeScript Tipləri
- [x] `src/types/database.types.ts` əl ilə yazıldı (bütün cədvəl tipləri)
- [x] `src/types/canvas.types.ts` əl ilə yazıldı (`CanvasElement`, `AppState`, `SceneData`, `ToolType` və s.)

---

## Mərhələ 2 — Auth və Təhlükəsizlik
**Branch:** `feature/m02-auth`
**Status:** `[x]` tamamlandı — 16/16 tamamlandı

### 2.1 Supabase Konfiqurasiyası
- [x] `supabase/config.toml` — JWT expiry (3600), refresh token rotation, email confirmation, Google + GitHub OAuth konfiqurasiya edildi
- [x] Supabase Dashboard-da Google OAuth aktiv edildi (Client ID + Secret)
- [x] Supabase Dashboard-da GitHub OAuth aktiv edildi (Client ID + Secret)
- [x] Supabase Dashboard-da Auth redirect URL-ləri əlavə edildi (production + localhost)

### 2.2 Frontend Auth
- [x] `src/lib/supabase.ts` — typed Supabase client yaradıldı (`createClient<Database>`, autoRefreshToken, persistSession)
- [x] `src/store/authStore.ts` — Zustand auth store yaradıldı (`user`, `session`, `profile`, `isPro()`, `plan()`)
- [x] `src/hooks/useAuth.ts` — `useAuth` hook yaradıldı (signUp, signIn, signInWithOAuth, resetPassword, updatePassword, signOut, updateProfile, session init)
- [x] `src/components/auth/ProtectedRoute.tsx` — `ProtectedRoute` komponenti yaradıldı (`requirePlan` prop ilə)
- [x] `src/pages/AuthCallback.tsx` — OAuth callback səhifəsi yaradıldı

### 2.3 Plan Qaydaları (Feature Gates)
- [x] `src/hooks/useSubscription.ts` — `useSubscription` hook yaradıldı (`canUse`, `canCreateScene`, `upgradeToPro`, AI limit)
- [x] `src/lib/sanitize.ts` — `escapeHtml`, `sanitizeTitle`, `sanitizeComment`, `isValidEmail`, `checkPasswordStrength` yazıldı

### 2.4 Shared Utilities (Edge Functions)
- [x] `supabase/functions/_shared/cors.ts` — CORS headers, `handleCors`, allow-list origin-lər yaradıldı
- [x] `supabase/functions/_shared/rateLimiter.ts` — `checkRateLimit` funksiyası + `RATE_LIMITS` konfiqurasiyası yaradıldı
- [x] `supabase/functions/_shared/auth.ts` — `requireAuth`, `errorResponse`, `successResponse` helper-ləri yaradıldı

### 2.5 App Router
- [x] `src/App.tsx` — Route konfiqurasiyası yaradıldı (public routes, ProtectedRoute, Pro-only routes)

---

## Mərhələ 3 — Canvas Engine
**Branch:** `feature/m03-canvas`
**Status:** `[x]` tamamlandı — 14/14 tamamlandı

### 3.1 Rough.js Wrapper
- [x] `src/lib/roughCanvas.ts` — `drawRoughElement` funksiyası yazıldı (rectangle, ellipse, diamond, line, arrow, freedraw, text)
- [x] Ox başlığı (`drawArrowhead`), Freedraw (`drawFreedraw`), Text render (`drawText`) yazıldı
- [x] `drawSelectionBox` + `drawHandles` + `drawLasso` yazıldı (brand orange, dashed border)

### 3.2 Hit Test
- [x] `src/lib/hitTest.ts` — `getElementAtPoint`, `getElementsInRect`, `isPointInElement` yazıldı (ellipse-ə dəqiq hit test)

### 3.3 Canvas Store
- [x] `src/store/canvasStore.ts` — Zustand canvas store yaradıldı (elements, selectedIds, undoStack, redoStack, appState, tool state)
- [x] Element actions: `addElement`, `updateElement`, `updateElements`, `deleteElements`, `duplicateElements`, `bringToFront`, `sendToBack`
- [x] Selection actions: `selectElement`, `selectAll`, `clearSelection`, `setEditingId`
- [x] History actions: `saveHistory`, `undo`, `redo` (max 50 addım)
- [x] AppState actions: `setZoom`, `setScroll`, `resetView`, `zoomToFit`

### 3.4 useCanvas Hook
- [x] `src/hooks/useCanvas.ts` — mouse event handler-lər yazıldı (mouseDown, mouseMove, mouseUp)
- [x] Pan (orta düymə + Space), Drag, Lasso, Eraser davranışları tətbiq edildi
- [x] Zoom (Ctrl+scroll, mouse mərkəzinə görə) tətbiq edildi
- [x] Keyboard shortcuts tətbiq edildi (V/H/R/O/D/L/A/T/P/E tool keys, Ctrl+Z/Y/A/D, Delete, Escape)
- [x] `requestAnimationFrame` render loop yaradıldı (clearCanvas, grid, elements, selection, lasso)
- [x] Grid çizimi (`drawGrid`) yaradıldı

---

## Mərhələ 4 — Frontend Komponentlər
**Branch:** `feature/m04-frontend`
**Status:** `[x]` tamamlandı — 22/22 tamamlandı

### 4.1 UI Kit
- [x] `src/components/ui/Tooltip.tsx` — delay (500ms), 4 tərəf (top/right/bottom/left) yaradıldı
- [x] `src/components/ui/Button.tsx` — primary/secondary/ghost variant-lar yaradıldı
- [x] `src/components/ui/Modal.tsx` — backdrop blur, ESC bağlama, portal yaradıldı
- [x] `src/components/ui/Badge.tsx` + `src/components/ui/Avatar.tsx` yaradıldı
- [x] `src/components/ui/Toast.tsx` — bildiriş sistemi yaradıldı (success/error/info)

### 4.2 Landing Səhifəsi
- [x] `src/pages/Landing.tsx` — Hero bölməsi (gradient, animated heading, CTA buttons) yaradıldı
- [x] Navbar (logo, pricing link, giriş/signup buttons) yaradıldı
- [x] Feature kartları bölməsi (3 kart: el çizimi, realtime, autosync) yaradıldı

### 4.3 Dashboard Səhifəsi
- [x] `src/pages/Dashboard.tsx` — Sol sidebar (logo, nav, plan bar, user) yaradıldı
- [x] Scene axtarış + grid/list view toggle yaradıldı
- [x] Realtime scene siyahısı (Supabase postgres_changes) tətbiq edildi
- [x] `src/components/dashboard/SceneCard.tsx` — thumbnail, rename (inline input), duplicate, delete, context menu yaradıldı
- [x] `src/components/dashboard/SceneGrid.tsx` — grid və list view rejimləri yaradıldı
- [x] `src/components/dashboard/NewSceneModal.tsx` — yeni scene yaratma modalı yaradıldı

### 4.4 Editor Səhifəsi
- [x] `src/pages/Editor.tsx` — canvas, toolbar, topbar, propsPanel, collab layers, zoom controls birləşdirildi
- [x] `src/components/canvas/Toolbar.tsx` — 11 alət, separator-lar, keyboard shortcut tooltip-ləri yaradıldı
- [x] `src/components/canvas/TopBar.tsx` — scene adı (edit), save status, active users, share button yaradıldı
- [x] `src/components/canvas/PropsPanel.tsx` — stroke rəngi, fill rəngi, stroke width, roughness, opacity yaradıldı
- [x] `src/components/canvas/ZoomControls.tsx` — zoom in/out, reset, fit screen yaradıldı
- [x] `src/components/canvas/CanvasBoard.tsx` — canvas element wrapper, touch event dəstəyi yaradıldı

---

## Mərhələ 5 — Əməkdaşlıq (Realtime Collaboration)
**Branch:** `feature/m05-collaboration`
**Status:** `[x]` tamamlandı — 10/10 tamamlandı

- [x] `src/lib/collabColors.ts` — 10 rəng, `getUserColor` (deterministik), `colorWithAlpha` yaradıldı
- [x] `src/types/collaboration.types.ts` — `CollabUser`, `CollabEvent`, `CollabPayload` tipləri yaradıldı
- [x] `src/store/collabStore.ts` — Zustand collab store yaradıldı (`activeUsers` Map, `isConnected`, `isConnecting`)
- [x] `src/hooks/useCollaboration.ts` — Supabase Realtime channel qurulumu yaradıldı (presence + broadcast)
- [x] Cursor broadcast (50ms throttle) + element broadcast (300ms debounce) tətbiq edildi
- [x] LWW (Last-Write-Wins) conflict resolution — `version` counter ilə tətbiq edildi
- [x] `src/components/collaboration/CursorOverlay.tsx` — remote cursor-lar (SVG cursor + ad etiketi, 50ms smooth transition) yaradıldı
- [x] `src/components/collaboration/ActiveUsers.tsx` — avatar stack, online count, dropdown siyahı yaradıldı
- [x] `src/components/collaboration/Comments.tsx` — Pro plan, canvas pin, Realtime, resolve funksionallığı yaradıldı
- [x] `src/components/collaboration/ShareModal.tsx` — public toggle, link kopyala, embed kodu (Pro) yaradıldı

---

## Mərhələ 6 — Abunəlik və Ödəniş (Stripe)
**Branch:** `feature/m06-billing`
**Status:** `[x]` tamamlandı — 12/12 tamamlandı

### 6.1 Stripe Konfiqurasiyası
- [x] Stripe Dashboard-da "Flaro Pro" product yaradıldı ($6/ay aylıq + $57.60/il illik)
- [x] Stripe Dashboard-da webhook endpoint qeydiyyata alındı (checkout.session.completed, customer.subscription.*, invoice.payment_failed)
- [x] `src/lib/stripe.ts` — singleton `loadStripe` yaradıldı

### 6.2 Edge Functions
- [x] `supabase/functions/stripe-webhook/index.ts` — imza yoxlaması + event handler-lər yaradıldı (`handleCheckoutCompleted`, `handleSubscriptionUpdated`, `handleSubscriptionDeleted`, `handlePaymentFailed`)
- [x] `supabase/functions/create-checkout-session/index.ts` — auth check, rate limit (5/saat), Stripe customer upsert, 7 günlük trial, checkout session yaradıldı
- [x] `supabase/functions/create-portal-session/index.ts` — Stripe billing portal session yaradıldı

### 6.3 Frontend
- [x] `src/hooks/useBilling.ts` — `upgradeToPro`, `openBillingPortal`, `fetchSubscription`, `checkUpgradeSuccess` yaradıldı
- [x] `src/pages/Pricing.tsx` — hero, aylıq/illik toggle, Free + Pro plan kartları, müqayisə cədvəli (bütün xüsusiyyətlər) yaradıldı
- [x] `src/pages/Pricing.tsx` — FAQ bölməsi (accordion) yaradıldı
- [x] `src/components/pricing/UpgradeBanner.tsx` — compact və tam variant yaradıldı (orange gradient, Pro-ya keç CTA)
- [x] Dashboard-da Free plan progress bar (scenesUsed/3) və UpgradeBanner inteqrasiyası edildi
- [x] `src/pages/Dashboard.tsx` — `?upgraded=true` query parametri yoxlanıldı (success toast göstərildi)

---

## Mərhələ 7 — API və Edge Functions
**Branch:** `feature/m07-api`
**Status:** `[x]` tamamlandı — 14/14 tamamlandı

### 7.1 Scene CRUD
- [x] `supabase/functions/scene-save/index.ts` — auth + rate limit (300/saat) + scene save + thumbnail upload (Pro) + versiya snapshot (hər 5 save-dən bir, Pro) yaradıldı
- [x] `src/hooks/useScene.ts` — `loadScene`, `saveScene`, `createScene`, `deleteScene`, `renameScene`, `duplicateScene`, `scheduleAutoSave` yaradıldı
- [x] Autosave debounce (2 saniyə, Pro only) tətbiq edildi
- [x] Canvas thumbnail generasiyası (`generateThumbnail`) tətbiq edildi

### 7.2 Export
- [x] `supabase/functions/scene-export/index.ts` — auth + rate limit (20/saat) + format yoxlaması (PDF/PPTX Pro only) + JSON/SVG/PDF/PPTX handler-lar yaradıldı
- [x] `src/hooks/useExport.ts` — `exportScene` yaradıldı (PNG/SVG/JSON client-side, PDF/PPTX server-side)
- [x] Client-side PNG export (2x resolution, offscreen canvas) tətbiq edildi
- [x] Client-side SVG export (elements to SVG) tətbiq edildi
- [x] Client-side JSON export (flaro format) tətbiq edildi

### 7.3 AI Generation
- [x] `supabase/functions/ai-generate/index.ts` — Claude Sonnet 4 inteqrasiyası, rate limit (Free 10/gün, Pro 100/gün), sistem promptu (diagram/flowchart/mindmap/wireframe), element sanitizasiyası yaradıldı
- [x] `src/hooks/useAI.ts` — `generate` funksiyası, canvas mərkəzinə yerləşdirmə, `saveHistory` çağırışı, remaining/limit göstərilməsi yaradıldı
- [x] `src/components/canvas/AIPanel.tsx` — floating panel, prompt input, diagram type seçimi, Pro gate yaradıldı

### 7.4 Shared View
- [x] `src/pages/SharedView.tsx` — `share_token` ilə public scene yüklənməsi, read-only canvas yaradıldı

---

## Mərhələ 8 — Deploy və CI/CD
**Branch:** `feature/m08-deploy`
**Status:** `[x]` tamamlandı — 18/18 tamamlandı

### 8.1 Supabase Production
- [x] Supabase production layihəsi yaradıldı (dashboard.supabase.com)
- [x] `supabase link --project-ref` ilə local CLI bağlandı
- [x] `supabase db push` — bütün migration-lar production-a tətbiq edildi
- [x] Storage bucket-ləri production-da yaradıldı
- [x] Auth konfiqurasiyası tamamlandı (Google + GitHub OAuth, redirect URL-lər, Site URL)
- [x] Edge Functions production-a deploy edildi (`stripe-webhook`, `create-checkout-session`, `create-portal-session`, `scene-save`, `scene-export`, `ai-generate`)
- [x] `supabase secrets set` — bütün server-side key-lər set edildi (STRIPE_SECRET_KEY, ANTHROPIC_API_KEY və s.)
- [x] Stripe webhook production endpoint qeydiyyata alındı + imza testi keçirildi

### 8.2 Vercel Production
- [x] Vercel CLI quraşdırıldı, `vercel link` ilə layihə bağlandı
- [x] Vercel environment variables set edildi (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_STRIPE_PUBLISHABLE_KEY, VITE_APP_URL)
- [x] `vercel --prod` ilə ilk production deploy edildi
- [x] Custom domain (flaro.app) Vercel-ə əlavə edildi + SSL avtomatik aktivdir

### 8.3 GitHub Actions CI/CD
- [x] `.github/workflows/ci.yml` yaradıldı (lint + type-check + build + db-check + deploy-staging + deploy-production)
- [x] GitHub Secrets konfiqurasiya edildi (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, SUPABASE_ACCESS_TOKEN, SUPABASE_PRODUCTION_REF, SUPABASE_STAGING_REF)
- [x] `staging` branch-ına push edildikdə Vercel Preview deploy avtomatik işləyir
- [x] `main` branch-ına push edildikdə production deploy avtomatik işləyir
- [x] CI pipeline test edildi (PR açıldı → lint pass → build pass → deploy)

### 8.4 Post-Deploy Yoxlamalar
- [x] Production checklist bütün maddələri yoxlanıldı (qeydiyyat, OAuth, scene, canvas, Stripe, realtime, share, mobile)
- [x] Error Boundary (`src/components/ErrorBoundary.tsx`) `src/main.tsx`-ə əlavə edildi
- [x] Supabase + Vercel monitoring alert-ləri konfiqurasiya edildi

---

## Ümumi Tərəqqi

| Mərhələ | Status | Tamamlanma | Tapşırıq sayı |
|---|---|---|---|
| 0 — Hazırlıq & Qurulum | `[x]` tamamlandı | 100% (19/19) | 19 |
| 1 — Verilənlər Bazası | `[x]` tamamlandı | 100% (20/20) | 20 |
| 2 — Auth & Təhlükəsizlik | `[x]` tamamlandı | 100% (16/16) | 16 |
| 3 — Canvas Engine | `[x]` tamamlandı | 100% (14/14) | 14 |
| 4 — Frontend Komponentlər | `[x]` tamamlandı | 100% (22/22) | 22 |
| 5 — Əməkdaşlıq | `[x]` tamamlandı | 100% (10/10) | 10 |
| 6 — Abunəlik & Ödəniş | `[x]` tamamlandı | 100% (12/12) | 12 |
| 7 — API & Edge Functions | `[x]` tamamlandı | 100% (14/14) | 14 |
| 8 — Deploy & CI/CD | `[x]` tamamlandı | 100% (18/18) | 18 |
| **CƏMİ** | | **100% (145/145)** | **145** |

---

> **Qeyd:** Hər tapşırığı tamamladıqdan sonra bu faylı yenilə.
> Yeni AI sessiyanı başladıqda: **yalnız "Cari Vəziyyət" blokunu oxu** — bu kifayətdir.
> Local AI ilə işləyərkən: "Bu TODO.md faylına bax, hansı tapşırıq növbəti?" deyə soruşa bilərsən.
