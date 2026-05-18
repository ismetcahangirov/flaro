# SketchFlow — Layihə Baxışı və Arxitektura

> **El çizimi tərzi ilə diaqram yaratma aləti** — React + Vite + Supabase
> Rəng paleti: Orange (#F97316) əsaslı, Free & Pro planları ilə

---

## 📋 Layihə Haqqında

**SketchFlow** — Excalidraw-dan ilhamlanan, el çizimi estetikası olan, real-time əməkdaşlıq imkanları ilə təchiz edilmiş bulud əsaslı diaqram yaratma platformasıdır.

### Əsas Xüsusiyyətlər (Görüntülərdən)

| Kateqoriya | Xüsusiyyət | Free | Pro |
|------------|------------|------|-----|
| **Create** | Infinite canvas | ✓ | ✓ |
| | Full editor features | ✓ | ✓ |
| | Unlimited scenes | ✗ | ✓ |
| | Auto sync to server | ✗ | ✓ |
| | Quick dashboard access | ✗ | ✓ |
| | Generative AI | Limited | Extended |
| | Presentations | ✗ | ✓ |
| **Collaborate** | Invite by link | ✓ | ✓ |
| | View-only access | ✗ | ✓ |
| | Voice hangout & screensharing | ✗ | ✓ |
| | Comments | ✗ | ✓ |
| | Live real-time presentations | ✗ | ✓ |
| **Teams** | User accounts | ✗ | ✓ |
| | Saved on cloud | ✗ | ✓ |
| | Workspace Teams | ✗ | ✓ |
| | User management | ✗ | ✓ |
| | Organize into collections | ✗ | ✓ |
| **Share** | With guests | Free | Free |
| | PNG/SVG/JSON export | ✓ | ✓ |
| | Embeddable/Readonly links | ✗ | ✓ |
| | Presentations as slides | ✗ | ✓ |
| | PDF & PPTX export | ✗ | ✓ |
| **Libraries** | Public libraries | ✓ | ✓ |
| | Personal library | Browser | Server |
| | Workspace libraries | ✗ | Soon |
| | Search in libraries | Soon | Soon |

---

## 🏗️ Texnoloji Stack

```
Language:   TypeScript 5 (strict mode)
Frontend:   React 18 + Vite 5
Styling:    Tailwind CSS v3 + Custom Orange Theme
Icons:      Lucide React (premium görünüşlü)
Canvas:     HTML5 Canvas API (Rough.js el çizimi efekti)
Auth:       Supabase Auth (Email + OAuth)
Database:   Supabase PostgreSQL
Storage:    Supabase Storage (canvas assets)
Realtime:   Supabase Realtime (collaboration)
Payments:   Stripe (Pro abunəlik)
State:      Zustand
Router:     React Router v6
Types:      supabase gen types (auto-generated DB types)
```

---

## 📁 Qovluq Strukturu

```
sketchflow/
├── public/
│   ├── fonts/                    # Caveat (el yazısı fontu)
│   └── favicon.svg
│
├── src/
│   ├── assets/
│   │   └── rough.min.js          # El çizimi efekti
│   │
│   ├── types/
│   │   ├── canvas.types.ts       # Canvas element tipləri
│   │   ├── scene.types.ts        # Səhnə tipləri
│   │   ├── auth.types.ts         # Auth tipləri
│   │   ├── subscription.types.ts # Plan tipləri
│   │   └── database.types.ts     # Supabase auto-gen types
│   │
│   ├── components/
│   │   ├── ui/                   # Yenidən istifadə olunan UI
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Avatar.tsx
│   │   │
│   │   ├── canvas/               # Çizim mühiti
│   │   │   ├── CanvasBoard.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── PropsPanel.tsx
│   │   │   ├── ZoomControls.tsx
│   │   │   └── ContextMenu.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── SceneCard.tsx
│   │   │   ├── SceneGrid.tsx
│   │   │   └── NewSceneModal.tsx
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginModal.tsx
│   │   │   ├── SignupModal.tsx
│   │   │   └── OAuthButtons.tsx
│   │   │
│   │   ├── collaboration/
│   │   │   ├── CollabModal.tsx
│   │   │   ├── CursorOverlay.tsx
│   │   │   └── ActiveUsers.tsx
│   │   │
│   │   └── pricing/
│   │       ├── PricingPage.tsx
│   │       └── PricingTable.tsx
│   │
│   ├── hooks/
│   │   ├── useCanvas.ts
│   │   ├── useAuth.ts
│   │   ├── useScene.ts
│   │   ├── useCollaboration.ts
│   │   └── useSubscription.ts
│   │
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── stripe.ts
│   │   └── roughCanvas.ts
│   │
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Editor.tsx
│   │   ├── Pricing.tsx
│   │   └── SharedView.tsx
│   │
│   ├── store/
│   │   ├── canvasStore.ts
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   │
│   ├── styles/
│   │   ├── index.css
│   │   └── canvas.css
│   │
│   └── App.tsx
│
├── supabase/
│   ├── migrations/               # DB migrations
│   └── functions/                # Edge Functions
│
├── .env.example
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 🎨 Dizayn Sistemi

### Rəng Paleti (Orange Theme)

```javascript
// tailwind.config.js
colors: {
  brand: {
    50:  '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',   // Əsas rəng
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  }
}
```

### Tipografiya

```
Başlıqlar:  Inter (clean, professional)
Canvas:     Caveat (el yazısı görünüşü)
Kod:        JetBrains Mono
```

### İkon Sistemi (Lucide React)
- `Pencil` — Draw tool
- `Square` — Rectangle
- `Circle` — Ellipse  
- `Minus` — Line
- `ArrowRight` — Arrow
- `Type` — Text
- `Hand` — Pan
- `MousePointer` — Select
- `Eraser` — Erase
- `Image` — Image insert
- `Diamond` — Diamond shape
- `Zap` — Pro feature badge

---

## 🔐 Təhlükəsizlik Sxemi

```
[İstifadəçi] → [Supabase Auth JWT]
                     ↓
              [RLS Policies]
                     ↓
         ┌───────────┴───────────┐
    [Öz məlumatı]          [Team məlumatı]
    (profiles, scenes)     (workspace_members)
```

**Təhlükəsizlik prinsipləri:**
- Row Level Security (RLS) hər cədvəldə
- JWT token rotation (1 saat)
- Stripe webhook imza yoxlaması
- Rate limiting (Edge Functions)
- CORS konfiqurasiyası
- Input sanitization

---

## 📄 MD Fayllarının Siyahısı

Bu layihə üçün aşağıdakı sənədlər ardıcıl hazırlanacaq:

| # | Fayl | Məzmun |
|---|------|--------|
| ✅ | `01_PROJECT_OVERVIEW.md` | **Bu fayl** — Baxış və arxitektura |
| ⏳ | `02_DATABASE_SCHEMA.md` | Supabase cədvəllər, RLS policies |
| ⏳ | `03_AUTH_AND_SECURITY.md` | Auth axını, təhlükəsizlik |
| ⏳ | `04_CANVAS_ENGINE.md` | Canvas məntiqi, Rough.js |
| ⏳ | `05_COLLABORATION.md` | Realtime, conflict resolution |
| ⏳ | `06_SUBSCRIPTION_BILLING.md` | Stripe, plan məhdudiyyətləri |
| ⏳ | `07_API_AND_EDGE_FUNCTIONS.md` | Supabase Edge Functions |
| ⏳ | `08_FRONTEND_COMPONENTS.md` | React komponentlər |
| ⏳ | `09_DEPLOYMENT.md` | Vercel + Supabase deploy |
| ⏳ | `10_ENV_AND_CONFIG.md` | Mühit dəyişənləri |

---

## 🚀 Başlanğıc Addımları

```bash
# 1. Layihəni yarat
npm create vite@latest sketchflow -- --template react-ts
cd sketchflow

# 2. Asılılıqları quraşdır
npm install @supabase/supabase-js @supabase/auth-ui-react
npm install zustand react-router-dom
npm install lucide-react
npm install roughjs
npm install @stripe/stripe-js

# 3. Dev asılılıqları
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 4. Supabase CLI
npm install -g supabase
supabase login
supabase init
```

---

*Növbəti: `02_DATABASE_SCHEMA.md` — Supabase verilənlər bazası sxemi*
