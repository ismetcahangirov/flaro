# SketchFlow — Frontend Komponentlər

> **React 18 + TypeScript + Tailwind CSS** — Dashboard, Editor, Toolbar, UI Kit
> Orange theme, Lucide icons, el çizimi estetikası

---

## 🗂️ Komponent Ağacı

```
App
├── pages/
│   ├── Landing.tsx          ← Açılış səhifəsi
│   ├── Dashboard.tsx        ← Scene idarəetməsi
│   ├── Editor.tsx           ← Canvas redaktoru
│   ├── Pricing.tsx          ← (06-cı faylda)
│   └── SharedView.tsx       ← Public baxış
│
├── components/
│   ├── ui/                  ← Əsas UI kit
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   └── Toast.tsx
│   │
│   ├── canvas/              ← Editor UI
│   │   ├── CanvasBoard.tsx  ← Əsas canvas wrapper
│   │   ├── Toolbar.tsx      ← Sol alətlər paneli
│   │   ├── TopBar.tsx       ← Yuxarı panel
│   │   ├── PropsPanel.tsx   ← Sağ xüsusiyyətlər
│   │   ├── ZoomControls.tsx
│   │   └── AIPanel.tsx      ← AI generate panel
│   │
│   ├── dashboard/
│   │   ├── SceneCard.tsx
│   │   ├── SceneGrid.tsx
│   │   └── NewSceneModal.tsx
│   │
│   └── layout/
│       ├── Navbar.tsx
│       └── Sidebar.tsx
```

---

## 🎨 Tailwind Konfiqurasiyası

### `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          950: '#431407',
        },
      },
      fontFamily: {
        hand:   ['Caveat', 'cursive'],
        sans:   ['Inter', 'sans-serif'],
        mono:   ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'canvas': '0 0 0 1px rgba(0,0,0,0.05), 0 4px 24px rgba(0,0,0,0.08)',
        'panel':  '2px 0 12px rgba(0,0,0,0.06)',
        'float':  '0 8px 32px rgba(249,115,22,0.15)',
      },
      animation: {
        'fade-in':    'fadeIn 0.15s ease-out',
        'slide-up':   'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                   to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
}

export default config
```

---

## 🏠 Landing Səhifəsi

### `src/pages/Landing.tsx`

```typescript
import React from 'react'
import { useNavigate }  from 'react-router-dom'
import {
  Pencil, Zap, Users, Cloud,
  ArrowRight, Star, Check,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function Landing() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-20 px-4 text-center overflow-hidden">
        {/* Arxa fon dekorasiya */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px]
                          bg-gradient-radial from-orange-100/60 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50
                        border border-orange-200 rounded-full text-orange-700
                        text-sm font-semibold mb-8 animate-fade-in">
          <Zap size={14} className="fill-orange-500" />
          El çizimi ilə professional diaqramlar
        </div>

        {/* Başlıq */}
        <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900
                       tracking-tight mb-6 leading-[1.05] animate-slide-up">
          Fikirləri{' '}
          <span className="relative inline-block">
            <span className="text-brand-500">çəkin</span>
            {/* El çizimi alt xətt */}
            <svg
              className="absolute -bottom-2 left-0 w-full"
              viewBox="0 0 200 12"
              preserveAspectRatio="none"
            >
              <path
                d="M2 8 Q50 2 100 7 Q150 12 198 6"
                stroke="#F97316"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </span>
          , paylaşın, birlikdə işləyin
        </h1>

        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          SketchFlow — el çizimi estetikası olan, real-time əməkdaşlıq imkanları ilə
          təchiz edilmiş ağıllı diaqram yaratma platforması.
        </p>

        {/* CTA düymələri */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
            className="flex items-center gap-2.5 px-8 py-4 bg-brand-500 text-white
                       font-bold text-lg rounded-2xl hover:bg-brand-600 transition-all
                       shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-200
                       hover:-translate-y-0.5 active:translate-y-0"
          >
            Pulsuz başla
            <ArrowRight size={20} />
          </button>

          <button
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-2 px-8 py-4 bg-white text-gray-700
                       font-semibold text-lg rounded-2xl border border-gray-200
                       hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            Qiymətlər
          </button>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-6 mt-12 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-2">
              {['#F97316', '#3B82F6', '#10B981', '#8B5CF6'].map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-white"
                     style={{ backgroundColor: c }} />
              ))}
            </div>
            <span>10,000+ istifadəçi</span>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-1">4.9/5</span>
          </div>
        </div>
      </section>

      {/* Feature bölməsi */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Niyə SketchFlow?
          </h2>
          <p className="text-center text-gray-500 mb-16 max-w-xl mx-auto">
            Professional görünüş, əl çizimi ruhu
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

const FEATURES = [
  {
    icon:  <Pencil className="text-brand-500" size={24} />,
    title: 'El çizimi estetikası',
    desc:  'Rough.js ilə hər element canlı, üzvi görünür. Texniki diaqramlar belə insan əli tərəfindən çəkilmiş hiss verir.',
    color: 'bg-orange-50',
  },
  {
    icon:  <Users className="text-blue-500" size={24} />,
    title: 'Real-time əməkdaşlıq',
    desc:  'Komandanızla eyni canvas üzərində işləyin. Hər kəsin kursoru, seçimi anlıq görünür.',
    color: 'bg-blue-50',
  },
  {
    icon:  <Cloud className="text-emerald-500" size={24} />,
    title: 'Avtomatik sinxronizasiya',
    desc:  'Pro planda hər dəyişiklik buludda avtomatik saxlanılır. Heç nəyi itirməyin.',
    color: 'bg-emerald-50',
  },
]

function FeatureCard({ icon, title, desc, color }: typeof FEATURES[0]) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm
                    hover:shadow-md transition-shadow group">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-5`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
    </div>
  )
}

function Navbar() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md
                    border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5 cursor-pointer"
             onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Pencil size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg text-gray-900">SketchFlow</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/pricing')}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2
                       rounded-lg hover:bg-gray-100 transition-colors"
          >
            Qiymətlər
          </button>

          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-brand-500 text-white text-sm font-semibold
                         rounded-xl hover:bg-brand-600 transition-colors"
            >
              Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2
                           rounded-lg hover:bg-gray-100 transition-colors"
              >
                Giriş
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-4 py-2 bg-brand-500 text-white text-sm font-semibold
                           rounded-xl hover:bg-brand-600 transition-colors shadow-sm"
              >
                Başla — Pulsuz
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
```

---

## 📋 Dashboard Səhifəsi

### `src/pages/Dashboard.tsx`

```typescript
import React, { useState, useEffect } from 'react'
import { useNavigate }   from 'react-router-dom'
import {
  Plus, Search, Grid3x3, List,
  LogOut, Settings, Crown,
  Pencil,
} from 'lucide-react'
import { supabase }          from '@/lib/supabase'
import { useAuth }           from '@/hooks/useAuth'
import { useScene }          from '@/hooks/useScene'
import { useSubscription }   from '@/hooks/useSubscription'
import { useBilling }        from '@/hooks/useBilling'
import { SceneGrid }         from '@/components/dashboard/SceneGrid'
import { NewSceneModal }     from '@/components/dashboard/NewSceneModal'
import { UpgradeBanner }     from '@/components/pricing/UpgradeBanner'
import type { Scene }        from '@/types/database.types'

export default function Dashboard() {
  const navigate   = useNavigate()
  const { user, profile, isPro, signOut } = useAuth()
  const { createScene, deleteScene, renameScene, duplicateScene } = useScene()
  const { canCreateScene, scenesUsed, scenesLimit } = useSubscription()
  const { openBillingPortal } = useBilling()

  const [scenes,      setScenes]      = useState<Scene[]>([])
  const [isLoading,   setIsLoading]   = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode,    setViewMode]    = useState<'grid' | 'list'>('grid')
  const [showNewModal, setShowNewModal] = useState(false)

  // ── Scene-ləri yüklə ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return

    const fetchScenes = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('scenes')
        .select('*')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false })

      if (!error && data) setScenes(data)
      setIsLoading(false)
    }

    fetchScenes()

    // Realtime: yeni scene əlavə edilsə/silinse yenilə
    const channel = supabase
      .channel('dashboard-scenes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scenes', filter: `owner_id=eq.${user.id}` },
        () => fetchScenes()
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [user])

  // ── Yeni scene yarat ─────────────────────────────────────────────────────
  const handleCreateScene = async (title: string) => {
    const gate = canCreateScene()
    if (!gate.allowed) {
      setShowNewModal(false)
      return
    }

    try {
      const newScene = await createScene(title)
      if (newScene) navigate(`/editor/${newScene.id}`)
    } catch (err: any) {
      if (err.message === 'FREE_PLAN_LIMIT') {
        alert('Free planda maksimum 3 scene yarada bilərsiniz')
      }
    }
  }

  const filteredScenes = scenes.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sol sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col
                        shadow-panel fixed top-0 left-0 h-full z-30">
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Pencil size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-gray-900">SketchFlow</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          <SidebarItem icon={<Grid3x3 size={17}/>} label="Səhnələrim" active />
          {isPro && (
            <SidebarItem icon={<Crown size={17}/>} label="Workspace" />
          )}
        </nav>

        {/* Plan badge + istifadəçi */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          {/* Plan indikatoru */}
          {!isPro && (
            <div className="p-3 bg-orange-50 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-orange-700">Free Plan</span>
                <span className="text-xs text-orange-500">{scenesUsed}/3 scene</span>
              </div>
              <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all"
                  style={{ width: `${(scenesUsed / 3) * 100}%` }}
                />
              </div>
              <button
                onClick={() => navigate('/pricing')}
                className="mt-2.5 w-full text-xs font-bold text-white bg-brand-500
                           py-2 rounded-lg hover:bg-brand-600 transition-colors"
              >
                Pro-ya keç →
              </button>
            </div>
          )}

          {isPro && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-xl">
              <Crown size={14} className="text-brand-500 fill-brand-500" />
              <span className="text-xs font-bold text-brand-600">Pro Plan</span>
            </div>
          )}

          {/* İstifadəçi */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center
                            justify-center text-white text-xs font-bold uppercase flex-shrink-0">
              {profile?.full_name?.charAt(0) ?? user?.email?.charAt(0) ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">
                {profile?.full_name ?? 'İstifadəçi'}
              </p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              title="Çıxış"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Əsas məzmun */}
      <main className="flex-1 ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm
                           border-b border-gray-100 px-8 h-16 flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900 flex-shrink-0">
            Səhnələrim
          </h1>

          {/* Axtarış */}
          <div className="flex-1 max-w-md relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Axtarın..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 border border-transparent
                         rounded-xl text-sm outline-none focus:bg-white
                         focus:border-brand-300 transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* View toggle */}
            <div className="flex bg-gray-100 p-1 rounded-xl gap-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-brand-500 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid3x3 size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-brand-500 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List size={15} />
              </button>
            </div>

            {/* Yeni scene düyməsi */}
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white
                         text-sm font-semibold rounded-xl hover:bg-brand-600
                         transition-colors shadow-sm shadow-orange-200"
            >
              <Plus size={16} />
              Yeni scene
            </button>
          </div>
        </header>

        <div className="p-8">
          {/* Upgrade banner (Free plan, 3 scene dolubsa) */}
          {!isPro && scenesUsed >= 3 && (
            <div className="mb-6">
              <UpgradeBanner
                feature="unlimited_scenes"
                message="3 scene limitinə çatdınız. Pro planla limitsiz scene yaradın."
              />
            </div>
          )}

          <SceneGrid
            scenes={filteredScenes}
            isLoading={isLoading}
            viewMode={viewMode}
            onOpen={id => navigate(`/editor/${id}`)}
            onDelete={async id => {
              await deleteScene(id)
              setScenes(s => s.filter(sc => sc.id !== id))
            }}
            onRename={async (id, title) => {
              const updated = await renameScene(id, title)
              setScenes(s => s.map(sc => sc.id === id ? updated : sc))
            }}
            onDuplicate={async id => {
              try {
                const copy = await duplicateScene(id)
                if (copy) setScenes(s => [copy, ...s])
              } catch (err: any) {
                if (err.message === 'FREE_PLAN_LIMIT') alert('Scene limiti dolub')
              }
            }}
          />
        </div>
      </main>

      {/* Yeni scene modalı */}
      {showNewModal && (
        <NewSceneModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreateScene}
          canCreate={canCreateScene().allowed}
        />
      )}
    </div>
  )
}

function SidebarItem({
  icon, label, active = false
}: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                        text-sm font-medium transition-colors ${
      active
        ? 'bg-orange-50 text-brand-600'
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
    }`}>
      {icon}
      {label}
    </button>
  )
}
```

---

## ✏️ Editor Səhifəsi

### `src/pages/Editor.tsx`

```typescript
import React, { useEffect, useRef } from 'react'
import { useParams }         from 'react-router-dom'
import { useCanvas }         from '@/hooks/useCanvas'
import { useScene }          from '@/hooks/useScene'
import { useCollaboration }  from '@/hooks/useCollaboration'
import { useAuth }           from '@/hooks/useAuth'
import { Toolbar }           from '@/components/canvas/Toolbar'
import { TopBar }            from '@/components/canvas/TopBar'
import { PropsPanel }        from '@/components/canvas/PropsPanel'
import { ZoomControls }      from '@/components/canvas/ZoomControls'
import { CursorOverlay }     from '@/components/collaboration/CursorOverlay'
import { CommentsLayer }     from '@/components/collaboration/Comments'
import { AIPanel }           from '@/components/canvas/AIPanel'

export default function Editor() {
  const { sceneId }  = useParams<{ sceneId: string }>()
  const canvasRef    = useRef<HTMLCanvasElement>(null)

  const { loadScene, saveScene, isSaving, lastSaved, scheduleAutoSave } = useScene(sceneId)
  const { isAuthenticated, isPro } = useAuth()
  const { toCanvas, toScreen }     = useCanvas(canvasRef)
  const collab = useCollaboration(sceneId ?? '')

  // Scene-i yüklə
  useEffect(() => {
    if (sceneId) loadScene(sceneId)
  }, [sceneId])

  // Cursor hərəkətini broadcast et
  useEffect(() => {
    if (!canvasRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      const pt = toCanvas(e.clientX, e.clientY)
      collab.broadcastCursor(pt)
    }

    const handleMouseLeave = () => collab.broadcastCursor(null)

    canvasRef.current.addEventListener('mousemove',  handleMouseMove)
    canvasRef.current.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      canvasRef.current?.removeEventListener('mousemove',  handleMouseMove)
      canvasRef.current?.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [toCanvas, collab.broadcastCursor])

  return (
    <div className="fixed inset-0 bg-gray-50 overflow-hidden flex flex-col">
      {/* Yuxarı panel */}
      <TopBar
        sceneId={sceneId ?? ''}
        isSaving={isSaving}
        lastSaved={lastSaved}
        onSave={() => saveScene(true)}
        activeUsers={collab.activeUsers}
      />

      {/* Əsas sahə */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Sol toolbar */}
        <Toolbar />

        {/* Canvas */}
        <div className="flex-1 relative">
          <canvas
            id="main-canvas"
            ref={canvasRef}
            className="absolute inset-0 cursor-crosshair"
            style={{ touchAction: 'none' }}
          />

          {/* Əməkdaşlıq layerləri */}
          <CursorOverlay />
          {isPro && sceneId && <CommentsLayer sceneId={sceneId} />}
        </div>

        {/* Sağ panel */}
        <PropsPanel />
      </div>

      {/* Zoom idarəetməsi */}
      <ZoomControls />

      {/* AI panel (floating) */}
      {isPro && <AIPanel />}
    </div>
  )
}
```

---

## 🛠️ Toolbar Komponenti

### `src/components/canvas/Toolbar.tsx`

```typescript
import React from 'react'
import {
  MousePointer2, Hand, Square, Circle,
  Diamond, Minus, ArrowRight, Type,
  Pencil, Eraser, Image, SeparatorHorizontal,
} from 'lucide-react'
import { useCanvasStore } from '@/store/canvasStore'
import { Tooltip }        from '@/components/ui/Tooltip'
import type { ToolType }  from '@/types/canvas.types'

interface ToolConfig {
  type:     ToolType
  icon:     React.ReactNode
  label:    string
  shortcut: string
}

const TOOLS: (ToolConfig | 'separator')[] = [
  { type: 'select',    icon: <MousePointer2 size={18}/>, label: 'Seç',       shortcut: 'V' },
  { type: 'hand',      icon: <Hand          size={18}/>, label: 'Sürüşdür',  shortcut: 'H' },
  'separator',
  { type: 'rectangle', icon: <Square        size={18}/>, label: 'Düzbucaqlı', shortcut: 'R' },
  { type: 'ellipse',   icon: <Circle        size={18}/>, label: 'Ellips',    shortcut: 'O' },
  { type: 'diamond',   icon: <Diamond       size={18}/>, label: 'Romb',      shortcut: 'D' },
  'separator',
  { type: 'line',      icon: <Minus         size={18}/>, label: 'Xətt',      shortcut: 'L' },
  { type: 'arrow',     icon: <ArrowRight    size={18}/>, label: 'Ok',        shortcut: 'A' },
  'separator',
  { type: 'text',      icon: <Type          size={18}/>, label: 'Mətn',      shortcut: 'T' },
  { type: 'freedraw',  icon: <Pencil        size={18}/>, label: 'Qaralama',  shortcut: 'P' },
  { type: 'eraser',    icon: <Eraser        size={18}/>, label: 'Silgi',     shortcut: 'E' },
]

export function Toolbar() {
  const { activeTool, setTool } = useCanvasStore()

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20
                    bg-white rounded-2xl shadow-canvas border border-gray-100
                    p-1.5 flex flex-col gap-0.5">
      {TOOLS.map((tool, i) => {
        if (tool === 'separator') {
          return (
            <div key={`sep-${i}`}
                 className="my-1 border-t border-gray-100 mx-1" />
          )
        }

        const isActive = activeTool === tool.type

        return (
          <Tooltip
            key={tool.type}
            content={`${tool.label} (${tool.shortcut})`}
            side="right"
          >
            <button
              onClick={() => setTool(tool.type)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center
                          transition-all ${
                isActive
                  ? 'bg-brand-500 text-white shadow-md shadow-orange-200'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              {tool.icon}
            </button>
          </Tooltip>
        )
      })}
    </div>
  )
}
```

---

## 📊 PropsPanel Komponenti

### `src/components/canvas/PropsPanel.tsx`

```typescript
import React from 'react'
import { useCanvasStore } from '@/store/canvasStore'

const STROKE_WIDTHS  = [1, 2, 3, 4, 6]
const ROUGHNESS_VALS = [
  { value: 0, label: 'Hamar'  },
  { value: 1, label: 'Az'     },
  { value: 2, label: 'Orta'   },
  { value: 3, label: 'Çox'    },
]
const PRESET_COLORS  = [
  '#1e1e1e', '#ffffff', '#F97316', '#3B82F6',
  '#10B981', '#EF4444', '#8B5CF6', '#F59E0B',
]

export function PropsPanel() {
  const store = useCanvasStore()
  const selectedEls = store.elements.filter(e => store.selectedIds.has(e.id))
  const hasSelection = selectedEls.length > 0

  return (
    <aside className="w-64 bg-white border-l border-gray-100 shadow-panel
                      flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {hasSelection ? `${selectedEls.length} element seçildi` : 'Alət xüsusiyyətləri'}
        </h3>
      </div>

      <div className="p-4 space-y-5">
        {/* Stroke rəngi */}
        <Section title="Xətt rəngi">
          <ColorPicker
            value={store.strokeColor}
            onChange={store.setStrokeColor}
            onElementUpdate={c => store.selectedIds.size > 0 &&
              store.updateElements(Array.from(store.selectedIds), { strokeColor: c })}
          />
        </Section>

        {/* Fill rəngi */}
        <Section title="Doldurma rəngi">
          <ColorPicker
            value={store.fillColor}
            onChange={store.setFillColor}
            showTransparent
            onElementUpdate={c => store.selectedIds.size > 0 &&
              store.updateElements(Array.from(store.selectedIds), { fillColor: c })}
          />
        </Section>

        {/* Xətt qalınlığı */}
        <Section title="Xətt qalınlığı">
          <div className="flex gap-2">
            {STROKE_WIDTHS.map(w => (
              <button
                key={w}
                onClick={() => {
                  store.setStrokeWidth(w)
                  if (store.selectedIds.size > 0)
                    store.updateElements(Array.from(store.selectedIds), { strokeWidth: w })
                }}
                className={`flex-1 h-9 rounded-lg flex items-center justify-center
                            border-2 transition-colors ${
                  store.strokeWidth === w
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className="bg-gray-700 rounded-full"
                  style={{ width: `${w * 3 + 4}px`, height: `${w}px` }}
                />
              </button>
            ))}
          </div>
        </Section>

        {/* El çizimi səviyyəsi */}
        <Section title="El çizimi effekti">
          <div className="grid grid-cols-2 gap-2">
            {ROUGHNESS_VALS.map(r => (
              <button
                key={r.value}
                onClick={() => {
                  store.setRoughness(r.value)
                  if (store.selectedIds.size > 0)
                    store.updateElements(Array.from(store.selectedIds), { roughness: r.value })
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold
                            border-2 transition-colors ${
                  store.roughness === r.value
                    ? 'border-brand-500 bg-brand-50 text-brand-600'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Şəffaflıq */}
        <Section title={`Şəffaflıq — ${store.opacity}%`}>
          <input
            type="range"
            min={10} max={100} step={5}
            value={store.opacity}
            onChange={e => {
              const v = Number(e.target.value)
              store.setOpacity(v)
              if (store.selectedIds.size > 0)
                store.updateElements(Array.from(store.selectedIds), { opacity: v })
            }}
            className="w-full accent-brand-500"
          />
        </Section>
      </div>
    </aside>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5">
        {title}
      </p>
      {children}
    </div>
  )
}

interface ColorPickerProps {
  value:           string
  onChange:        (c: string) => void
  onElementUpdate: (c: string) => void
  showTransparent?: boolean
}

function ColorPicker({ value, onChange, onElementUpdate, showTransparent }: ColorPickerProps) {
  const allColors = showTransparent ? ['transparent', ...PRESET_COLORS] : PRESET_COLORS

  return (
    <div className="flex flex-wrap gap-2">
      {allColors.map(c => (
        <button
          key={c}
          onClick={() => { onChange(c); onElementUpdate(c) }}
          className={`w-7 h-7 rounded-lg border-2 transition-all ${
            value === c ? 'border-brand-500 scale-110' : 'border-transparent hover:scale-105'
          }`}
          style={{
            backgroundColor: c === 'transparent' ? undefined : c,
            backgroundImage: c === 'transparent'
              ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, #fff 25%, #fff 75%, #ccc 75%)'
              : undefined,
            backgroundSize: '8px 8px',
          }}
        />
      ))}
      {/* Custom rəng */}
      <label className="w-7 h-7 rounded-lg border-2 border-dashed border-gray-300
                        hover:border-brand-400 cursor-pointer flex items-center
                        justify-center text-gray-400 text-lg overflow-hidden">
        +
        <input
          type="color"
          className="absolute opacity-0 w-0 h-0"
          value={value === 'transparent' ? '#ffffff' : value}
          onChange={e => { onChange(e.target.value); onElementUpdate(e.target.value) }}
        />
      </label>
    </div>
  )
}
```

---

## 🎯 Scene Card Komponenti

### `src/components/dashboard/SceneCard.tsx`

```typescript
import React, { useState, useRef } from 'react'
import {
  MoreHorizontal, Pencil, Trash2,
  Copy, ExternalLink, Clock,
} from 'lucide-react'
import type { Scene } from '@/types/database.types'

interface SceneCardProps {
  scene:       Scene
  onOpen:      () => void
  onDelete:    () => void
  onRename:    (title: string) => void
  onDuplicate: () => void
}

export function SceneCard({
  scene, onOpen, onDelete, onRename, onDuplicate
}: SceneCardProps) {
  const [showMenu,    setShowMenu]    = useState(false)
  const [isRenaming,  setIsRenaming]  = useState(false)
  const [renameValue, setRenameValue] = useState(scene.title)
  const inputRef = useRef<HTMLInputElement>(null)

  const formatDate = (d: string) =>
    new Intl.RelativeTimeFormat('az', { numeric: 'auto' }).format(
      Math.round((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    )

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== scene.title) {
      onRename(renameValue.trim())
    }
    setIsRenaming(false)
  }

  return (
    <div
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden
                 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5
                 cursor-pointer"
      onClick={!isRenaming ? onOpen : undefined}
    >
      {/* Thumbnail */}
      <div className="h-36 bg-gradient-to-br from-orange-50 to-amber-50 relative
                      overflow-hidden">
        {scene.thumbnail_url ? (
          <img
            src={scene.thumbnail_url}
            alt={scene.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Pencil size={32} className="text-orange-200" strokeWidth={1.5} />
          </div>
        )}

        {/* Üzərinə gəldikdə "Aç" overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100
                        transition-opacity flex items-center justify-center">
          <div className="bg-white/90 text-gray-800 px-4 py-2 rounded-xl
                          text-sm font-semibold flex items-center gap-2">
            <ExternalLink size={14} />
            Aç
          </div>
        </div>
      </div>

      {/* Məlumatlar */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          {isRenaming ? (
            <input
              ref={inputRef}
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRenameSubmit()
                if (e.key === 'Escape') setIsRenaming(false)
              }}
              onClick={e => e.stopPropagation()}
              autoFocus
              className="flex-1 text-sm font-semibold text-gray-900 border-b-2
                         border-brand-500 outline-none bg-transparent"
            />
          ) : (
            <h3 className="text-sm font-semibold text-gray-900 truncate flex-1">
              {scene.title}
            </h3>
          )}

          {/* Kontekst menyusu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={e => { e.stopPropagation(); setShowMenu(v => !v) }}
              className="w-7 h-7 rounded-lg flex items-center justify-center
                         text-gray-400 hover:bg-gray-100 hover:text-gray-600
                         transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal size={15} />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-8 bg-white rounded-xl shadow-xl
                           border border-gray-100 py-1.5 z-50 w-44 animate-slide-down"
                onClick={e => e.stopPropagation()}
              >
                <MenuAction
                  icon={<Pencil size={14}/>}
                  label="Adını dəyişdir"
                  onClick={() => { setIsRenaming(true); setShowMenu(false) }}
                />
                <MenuAction
                  icon={<Copy size={14}/>}
                  label="Kopyala"
                  onClick={() => { onDuplicate(); setShowMenu(false) }}
                />
                <div className="my-1 border-t border-gray-100" />
                <MenuAction
                  icon={<Trash2 size={14}/>}
                  label="Sil"
                  onClick={() => { onDelete(); setShowMenu(false) }}
                  danger
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
          <Clock size={11} />
          <span>{formatDate(scene.updated_at)}</span>
        </div>
      </div>
    </div>
  )
}

function MenuAction({
  icon, label, onClick, danger = false
}: {
  icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm
                  transition-colors ${
        danger
          ? 'text-red-500 hover:bg-red-50'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
```

---

## 💡 Tooltip UI Komponenti

### `src/components/ui/Tooltip.tsx`

```typescript
import React, { useState, useRef } from 'react'

interface TooltipProps {
  content:  string
  children: React.ReactElement
  side?:    'top' | 'right' | 'bottom' | 'left'
  delay?:   number
}

export function Tooltip({
  content, children, side = 'top', delay = 500
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), delay)
  }

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
  }

  const positions = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {visible && (
        <div className={`absolute ${positions[side]} z-50 pointer-events-none animate-fade-in`}>
          <div className="bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5
                          rounded-lg whitespace-nowrap shadow-lg">
            {content}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## ✅ Frontend Xülasəsi

| Komponent | Fayl | Məzmun |
|-----------|------|--------|
| **Landing** | `Landing.tsx` | Hero, feature kartlar, Navbar |
| **Dashboard** | `Dashboard.tsx` | Sidebar (plan bar), scene grid, axtarış |
| **Editor** | `Editor.tsx` | Canvas, Toolbar, PropsPanel, collab layers |
| **Toolbar** | `Toolbar.tsx` | 11 alət, keyboard shortcuts, Tooltip |
| **PropsPanel** | `PropsPanel.tsx` | Rəng, qalınlıq, roughness, opacity |
| **SceneCard** | `SceneCard.tsx` | Thumbnail, rename, duplicate, delete |
| **Tooltip** | `Tooltip.tsx` | Delay, 4 tərəf |
| **Tailwind** | `tailwind.config.ts` | Brand orange, font-hand, animasiyalar |

---

*Növbəti: `09_DEPLOYMENT.md` — Vercel deploy, Supabase production, env setup, CI/CD*
