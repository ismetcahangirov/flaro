# TODO — SketchFlow

> Local AI ilə işləyərkən tamamlanan tapşırıqları `[ ]` → `[x]` et.
> **Format:** `[x]` = tamamlandı · `[ ]` = gözləyir · `[~]` = davam edir · `[!]` = bloklanıb

---

## ⚡ Cari Vəziyyət
> **Bu bloku hər PR birləşəndən sonra yenilə. Token bitib yeni hesabdan davam edirsənsə — yalnız bu bloku oxu.**

| Sahə | Dəyər |
|---|---|
| **Son tamamlanan tapşırıq** | Mərhələ 1 — Verilənlər Bazası |
| **Aktiv branch** | `feature/m01-database` |
| **Növbəti branch** | `feature/m02-auth` |
| **Növbəti tapşırıq** | Mərhələ 2 — Auth & Təhlükəsizlik (PR merge-dən sonra) |
| **Bloklanmış tapşırıq** | Yoxdur |
| **Qeyd** | Mərhələ 1 tamamlandı. 15 migration fayl + 2 TypeScript tip faylı yaradıldı. PR merge edildikdən sonra Mərhələ 2-yə keç. Ümumi progress 27%. |

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
- [x] `npm create vite@latest sketchflow -- --template react-ts` ilə layihə yaradıldı
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
**Status:** `[ ]` gözləyir — 0/16 tamamlandı

### 2.1 Supabase Konfiqurasiyası
- [ ] `supabase/config.toml` — JWT expiry (3600), refresh token rotation, email confirmation, Google + GitHub OAuth konfiqurasiya edildi
- [ ] Supabase Dashboard-da Google OAuth aktiv edildi (Client ID + Secret)
- [ ] Supabase Dashboard-da GitHub OAuth aktiv edildi (Client ID + Secret)
- [ ] Supabase Dashboard-da Auth redirect URL-ləri əlavə edildi (production + localhost)

### 2.2 Frontend Auth
- [ ] `src/lib/supabase.ts` — typed Supabase client yaradıldı (`createClient<Database>`, autoRefreshToken, persistSession)
- [ ] `src/store/authStore.ts` — Zustand auth store yaradıldı (`user`, `session`, `profile`, `isPro()`, `plan()`)
- [ ] `src/hooks/useAuth.ts` — `useAuth` hook yaradıldı (signUp, signIn, signInWithOAuth, resetPassword, updatePassword, signOut, updateProfile, session init)
- [ ] `src/components/auth/ProtectedRoute.tsx` — `ProtectedRoute` komponenti yaradıldı (`requirePlan` prop ilə)
- [ ] `src/pages/AuthCallback.tsx` — OAuth callback səhifəsi yaradıldı

### 2.3 Plan Qaydaları (Feature Gates)
- [ ] `src/hooks/useSubscription.ts` — `useSubscription` hook yaradıldı (`canUse`, `canCreateScene`, `upgradeToPro`, AI limit)
- [ ] `src/lib/sanitize.ts` — `escapeHtml`, `sanitizeTitle`, `sanitizeComment`, `isValidEmail`, `checkPasswordStrength` yazıldı

### 2.4 Shared Utilities (Edge Functions)
- [ ] `supabase/functions/_shared/cors.ts` — CORS headers, `handleCors`, allow-list origin-lər yaradıldı
- [ ] `supabase/functions/_shared/rateLimiter.ts` — `checkRateLimit` funksiyası + `RATE_LIMITS` konfiqurasiyası yaradıldı
- [ ] `supabase/functions/_shared/auth.ts` — `requireAuth`, `errorResponse`, `successResponse` helper-ləri yaradıldı

### 2.5 App Router
- [ ] `src/App.tsx` — Route konfiqurasiyası yaradıldı (public routes, ProtectedRoute, Pro-only routes)

---

## Mərhələ 3 — Canvas Engine
**Branch:** `feature/m03-canvas`
**Status:** `[ ]` gözləyir — 0/14 tamamlandı

### 3.1 Rough.js Wrapper
- [ ] `src/lib/roughCanvas.ts` — `drawRoughElement` funksiyası yazıldı (rectangle, ellipse, diamond, line, arrow, freedraw, text)
- [ ] Ox başlığı (`drawArrowhead`), Freedraw (`drawFreedraw`), Text render (`drawText`) yazıldı
- [ ] `drawSelectionBox` + `drawHandles` + `drawLasso` yazıldı (brand orange, dashed border)

### 3.2 Hit Test
- [ ] `src/lib/hitTest.ts` — `getElementAtPoint`, `getElementsInRect`, `isPointInElement` yazıldı (ellipse-ə dəqiq hit test)

### 3.3 Canvas Store
- [ ] `src/store/canvasStore.ts` — Zustand canvas store yaradıldı (elements, selectedIds, undoStack, redoStack, appState, tool state)
- [ ] Element actions: `addElement`, `updateElement`, `updateElements`, `deleteElements`, `duplicateElements`, `bringToFront`, `sendToBack`
- [ ] Selection actions: `selectElement`, `selectAll`, `clearSelection`, `setEditingId`
- [ ] History actions: `saveHistory`, `undo`, `redo` (max 50 addım)
- [ ] AppState actions: `setZoom`, `setScroll`, `resetView`, `zoomToFit`

### 3.4 useCanvas Hook
- [ ] `src/hooks/useCanvas.ts` — mouse event handler-lər yazıldı (mouseDown, mouseMove, mouseUp)
- [ ] Pan (orta düymə + Space), Drag, Lasso, Eraser davranışları tətbiq edildi
- [ ] Zoom (Ctrl+scroll, mouse mərkəzinə görə) tətbiq edildi
- [ ] Keyboard shortcuts tətbiq edildi (V/H/R/O/D/L/A/T/P/E tool keys, Ctrl+Z/Y/A/D, Delete, Escape)
- [ ] `requestAnimationFrame` render loop yaradıldı (clearCanvas, grid, elements, selection, lasso)
- [ ] Grid çizimi (`drawGrid`) yaradıldı

---

## Mərhələ 4 — Frontend Komponentlər
**Branch:** `feature/m04-frontend`
**Status:** `[ ]` gözləyir — 0/22 tamamlandı

### 4.1 UI Kit
- [ ] `src/components/ui/Tooltip.tsx` — delay (500ms), 4 tərəf (top/right/bottom/left) yaradıldı
- [ ] `src/components/ui/Button.tsx` — primary/secondary/ghost variant-lar yaradıldı
- [ ] `src/components/ui/Modal.tsx` — backdrop blur, ESC bağlama, portal yaradıldı
- [ ] `src/components/ui/Badge.tsx` + `src/components/ui/Avatar.tsx` yaradıldı
- [ ] `src/components/ui/Toast.tsx` — bildiriş sistemi yaradıldı (success/error/info)

### 4.2 Landing Səhifəsi
- [ ] `src/pages/Landing.tsx` — Hero bölməsi (gradient, animated heading, CTA buttons) yaradıldı
- [ ] Navbar (logo, pricing link, giriş/signup buttons) yaradıldı
- [ ] Feature kartları bölməsi (3 kart: el çizimi, realtime, autosync) yaradıldı

### 4.3 Dashboard Səhifəsi
- [ ] `src/pages/Dashboard.tsx` — Sol sidebar (logo, nav, plan bar, user) yaradıldı
- [ ] Scene axtarış + grid/list view toggle yaradıldı
- [ ] Realtime scene siyahısı (Supabase postgres_changes) tətbiq edildi
- [ ] `src/components/dashboard/SceneCard.tsx` — thumbnail, rename (inline input), duplicate, delete, context menu yaradıldı
- [ ] `src/components/dashboard/SceneGrid.tsx` — grid və list view rejimləri yaradıldı
- [ ] `src/components/dashboard/NewSceneModal.tsx` — yeni scene yaratma modalı yaradıldı

### 4.4 Editor Səhifəsi
- [ ] `src/pages/Editor.tsx` — canvas, toolbar, topbar, propsPanel, collab layers, zoom controls birləşdirildi
- [ ] `src/components/canvas/Toolbar.tsx` — 11 alət, separator-lar, keyboard shortcut tooltip-ləri yaradıldı
- [ ] `src/components/canvas/TopBar.tsx` — scene adı (edit), save status, active users, share button yaradıldı
- [ ] `src/components/canvas/PropsPanel.tsx` — stroke rəngi, fill rəngi, stroke width, roughness, opacity yaradıldı
- [ ] `src/components/canvas/ZoomControls.tsx` — zoom in/out, reset, fit screen yaradıldı
- [ ] `src/components/canvas/CanvasBoard.tsx` — canvas element wrapper, touch event dəstəyi yaradıldı

---

## Mərhələ 5 — Əməkdaşlıq (Realtime Collaboration)
**Branch:** `feature/m05-collaboration`
**Status:** `[ ]` gözləyir — 0/10 tamamlandı

- [ ] `src/lib/collabColors.ts` — 10 rəng, `getUserColor` (deterministik), `colorWithAlpha` yaradıldı
- [ ] `src/types/collaboration.types.ts` — `CollabUser`, `CollabEvent`, `CollabPayload` tipləri yaradıldı
- [ ] `src/store/collabStore.ts` — Zustand collab store yaradıldı (`activeUsers` Map, `isConnected`, `isConnecting`)
- [ ] `src/hooks/useCollaboration.ts` — Supabase Realtime channel qurulumu yaradıldı (presence + broadcast)
- [ ] Cursor broadcast (50ms throttle) + element broadcast (300ms debounce) tətbiq edildi
- [ ] LWW (Last-Write-Wins) conflict resolution — `version` counter ilə tətbiq edildi
- [ ] `src/components/collaboration/CursorOverlay.tsx` — remote cursor-lar (SVG cursor + ad etiketi, 50ms smooth transition) yaradıldı
- [ ] `src/components/collaboration/ActiveUsers.tsx` — avatar stack, online count, dropdown siyahı yaradıldı
- [ ] `src/components/collaboration/Comments.tsx` — Pro plan, canvas pin, Realtime, resolve funksionallığı yaradıldı
- [ ] `src/components/collaboration/ShareModal.tsx` — public toggle, link kopyala, embed kodu (Pro) yaradıldı

---

## Mərhələ 6 — Abunəlik və Ödəniş (Stripe)
**Branch:** `feature/m06-billing`
**Status:** `[ ]` gözləyir — 0/12 tamamlandı

### 6.1 Stripe Konfiqurasiyası
- [ ] Stripe Dashboard-da "SketchFlow Pro" product yaradıldı ($6/ay aylıq + $57.60/il illik)
- [ ] Stripe Dashboard-da webhook endpoint qeydiyyata alındı (checkout.session.completed, customer.subscription.*, invoice.payment_failed)
- [ ] `src/lib/stripe.ts` — singleton `loadStripe` yaradıldı

### 6.2 Edge Functions
- [ ] `supabase/functions/stripe-webhook/index.ts` — imza yoxlaması + event handler-lər yaradıldı (`handleCheckoutCompleted`, `handleSubscriptionUpdated`, `handleSubscriptionDeleted`, `handlePaymentFailed`)
- [ ] `supabase/functions/create-checkout-session/index.ts` — auth check, rate limit (5/saat), Stripe customer upsert, 7 günlük trial, checkout session yaradıldı
- [ ] `supabase/functions/create-portal-session/index.ts` — Stripe billing portal session yaradıldı

### 6.3 Frontend
- [ ] `src/hooks/useBilling.ts` — `upgradeToPro`, `openBillingPortal`, `fetchSubscription`, `checkUpgradeSuccess` yaradıldı
- [ ] `src/pages/Pricing.tsx` — hero, aylıq/illik toggle, Free + Pro plan kartları, müqayisə cədvəli (bütün xüsusiyyətlər) yaradıldı
- [ ] `src/pages/Pricing.tsx` — FAQ bölməsi (accordion) yaradıldı
- [ ] `src/components/pricing/UpgradeBanner.tsx` — compact və tam variant yaradıldı (orange gradient, Pro-ya keç CTA)
- [ ] Dashboard-da Free plan progress bar (scenesUsed/3) və UpgradeBanner inteqrasiyası edildi
- [ ] `src/pages/Dashboard.tsx` — `?upgraded=true` query parametri yoxlanıldı (success toast göstərildi)

---

## Mərhələ 7 — API və Edge Functions
**Branch:** `feature/m07-api`
**Status:** `[ ]` gözləyir — 0/14 tamamlandı

### 7.1 Scene CRUD
- [ ] `supabase/functions/scene-save/index.ts` — auth + rate limit (300/saat) + scene save + thumbnail upload (Pro) + versiya snapshot (hər 5 save-dən bir, Pro) yaradıldı
- [ ] `src/hooks/useScene.ts` — `loadScene`, `saveScene`, `createScene`, `deleteScene`, `renameScene`, `duplicateScene`, `scheduleAutoSave` yaradıldı
- [ ] Autosave debounce (2 saniyə, Pro only) tətbiq edildi
- [ ] Canvas thumbnail generasiyası (`generateThumbnail`) tətbiq edildi

### 7.2 Export
- [ ] `supabase/functions/scene-export/index.ts` — auth + rate limit (20/saat) + format yoxlaması (PDF/PPTX Pro only) + JSON/SVG/PDF/PPTX handler-lar yaradıldı
- [ ] `src/hooks/useExport.ts` — `exportScene` yaradıldı (PNG/SVG/JSON client-side, PDF/PPTX server-side)
- [ ] Client-side PNG export (2x resolution, offscreen canvas) tətbiq edildi
- [ ] Client-side SVG export (elements to SVG) tətbiq edildi
- [ ] Client-side JSON export (sketchflow format) tətbiq edildi

### 7.3 AI Generation
- [ ] `supabase/functions/ai-generate/index.ts` — Claude Sonnet 4 inteqrasiyası, rate limit (Free 10/gün, Pro 100/gün), sistem promptu (diagram/flowchart/mindmap/wireframe), element sanitizasiyası yaradıldı
- [ ] `src/hooks/useAI.ts` — `generate` funksiyası, canvas mərkəzinə yerləşdirmə, `saveHistory` çağırışı, remaining/limit göstərilməsi yaradıldı
- [ ] `src/components/canvas/AIPanel.tsx` — floating panel, prompt input, diagram type seçimi, Pro gate yaradıldı

### 7.4 Shared View
- [ ] `src/pages/SharedView.tsx` — `share_token` ilə public scene yüklənməsi, read-only canvas yaradıldı

---

## Mərhələ 8 — Deploy və CI/CD
**Branch:** `feature/m08-deploy`
**Status:** `[ ]` gözləyir — 0/18 tamamlandı

### 8.1 Supabase Production
- [ ] Supabase production layihəsi yaradıldı (dashboard.supabase.com)
- [ ] `supabase link --project-ref` ilə local CLI bağlandı
- [ ] `supabase db push` — bütün migration-lar production-a tətbiq edildi
- [ ] Storage bucket-ləri production-da yaradıldı
- [ ] Auth konfiqurasiyası tamamlandı (Google + GitHub OAuth, redirect URL-lər, Site URL)
- [ ] Edge Functions production-a deploy edildi (`stripe-webhook`, `create-checkout-session`, `create-portal-session`, `scene-save`, `scene-export`, `ai-generate`)
- [ ] `supabase secrets set` — bütün server-side key-lər set edildi (STRIPE_SECRET_KEY, ANTHROPIC_API_KEY və s.)
- [ ] Stripe webhook production endpoint qeydiyyata alındı + imza testi keçirildi

### 8.2 Vercel Production
- [ ] Vercel CLI quraşdırıldı, `vercel link` ilə layihə bağlandı
- [ ] Vercel environment variables set edildi (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_STRIPE_PUBLISHABLE_KEY, VITE_APP_URL)
- [ ] `vercel --prod` ilə ilk production deploy edildi
- [ ] Custom domain (sketchflow.app) Vercel-ə əlavə edildi + SSL avtomatik aktivdir

### 8.3 GitHub Actions CI/CD
- [ ] `.github/workflows/ci.yml` yaradıldı (lint + type-check + build + db-check + deploy-staging + deploy-production)
- [ ] GitHub Secrets konfiqurasiya edildi (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, SUPABASE_ACCESS_TOKEN, SUPABASE_PRODUCTION_REF, SUPABASE_STAGING_REF)
- [ ] `staging` branch-ına push edildikdə Vercel Preview deploy avtomatik işləyir
- [ ] `main` branch-ına push edildikdə production deploy avtomatik işləyir
- [ ] CI pipeline test edildi (PR açıldı → lint pass → build pass → deploy)

### 8.4 Post-Deploy Yoxlamalar
- [ ] Production checklist bütün maddələri yoxlanıldı (qeydiyyat, OAuth, scene, canvas, Stripe, realtime, share, mobile)
- [ ] Error Boundary (`src/components/ErrorBoundary.tsx`) `src/main.tsx`-ə əlavə edildi
- [ ] Supabase + Vercel monitoring alert-ləri konfiqurasiya edildi

---

## Ümumi Tərəqqi

| Mərhələ | Status | Tamamlanma | Tapşırıq sayı |
|---|---|---|---|
| 0 — Hazırlıq & Qurulum | `[x]` tamamlandı | 100% (19/19) | 19 |
| 1 — Verilənlər Bazası | `[x]` tamamlandı | 100% (20/20) | 20 |
| 2 — Auth & Təhlükəsizlik | `[ ]` gözləyir | 0% (0/16) | 16 |
| 3 — Canvas Engine | `[ ]` gözləyir | 0% (0/14) | 14 |
| 4 — Frontend Komponentlər | `[ ]` gözləyir | 0% (0/22) | 22 |
| 5 — Əməkdaşlıq | `[ ]` gözləyir | 0% (0/10) | 10 |
| 6 — Abunəlik & Ödəniş | `[ ]` gözləyir | 0% (0/12) | 12 |
| 7 — API & Edge Functions | `[ ]` gözləyir | 0% (0/14) | 14 |
| 8 — Deploy & CI/CD | `[ ]` gözləyir | 0% (0/18) | 18 |
| **CƏMİ** | | **27% (39/145)** | **145** |

---

> **Qeyd:** Hər tapşırığı tamamladıqdan sonra bu faylı yenilə.
> Yeni AI sessiyanı başladıqda: **yalnız "Cari Vəziyyət" blokunu oxu** — bu kifayətdir.
> Local AI ilə işləyərkən: "Bu TODO.md faylına bax, hansı tapşırıq növbəti?" deyə soruşa bilərsən.
