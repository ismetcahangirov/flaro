import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Grid3x3, List,
  LogOut, Settings, Crown,
  Sparkles, Home, RefreshCw, Menu, X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useScene } from '@/hooks/useScene'
import { useSubscription } from '@/hooks/useSubscription'
import { useBilling } from '@/hooks/useBilling'
import { SceneGrid } from '@/components/dashboard/SceneGrid'
import { NewSceneModal } from '@/components/dashboard/NewSceneModal'
import { UpgradeBanner } from '@/components/pricing/UpgradeBanner'
import type { Scene } from '@/types/database.types'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, session, profile, isPro, signOut } = useAuth()
  const { createScene, deleteScene, renameScene, duplicateScene } = useScene()
  const { canCreateScene, scenesUsed } = useSubscription()
  const { openBillingPortal } = useBilling()

  const [scenes, setScenes] = useState<Scene[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showNewModal, setShowNewModal] = useState(false)
  const [showUpgradeMsg, setShowUpgradeMsg] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // ── Upgrade uğur mesajı (?upgraded=true) ───────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === 'true') {
      setShowUpgradeMsg(true)
      // URL-i təmizlə
      window.history.replaceState({}, '', '/dashboard')
      setTimeout(() => setShowUpgradeMsg(false), 6000)
    }
  }, [])

  const [errorMsg, setErrorMsg] = useState('')

  const fetchScenes = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setErrorMsg('')
    const { data, error } = await supabase
      .from('scenes')
      .select('*')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[Dashboard] Error fetching scenes:', error)
      setErrorMsg('Səhnələri yükləyərkən xəta baş verdi.')
    } else if (data) {
      setScenes(data)
    }
    setIsLoading(false)
  }, [user])

  // ── Scene-ləri yüklə ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !session) return

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
  }, [user, session, fetchScenes])

  // ── Yeni scene yarat ─────────────────────────────────────────────────────
  const handleCreateScene = async (title: string) => {
    const gate = canCreateScene()
    if (!gate.allowed) {
      setShowNewModal(false)
      return
    }

    try {
      const newScene = await createScene(title) as any
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
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans">
      {/* Mobil Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sol sidebar */}
      <aside className={`w-64 bg-white border-r border-slate-100 flex flex-col
                        shadow-md fixed top-0 left-0 h-full z-40 transition-transform duration-300
                        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo & Close button on Mobile */}
        <div className="px-5 py-2 border-b border-slate-100 flex items-center justify-between">
          <img style={{ filter: "drop-shadow(0 0px 7px rgba(255, 87, 4, 0.2))" }} src="/flaro-logo.png" alt="Flaro" className="h-[45px] md:h-[65px] lg:h-[85px] w-auto" />
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                       text-sm font-medium transition-colors text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          >
            <Home size={17} />
            Ana səhifə
          </button>
          <SidebarItem icon={<Grid3x3 size={17} />} label="Səhnələrim" active />
          {isPro && (
            <SidebarItem icon={<Crown size={17} />} label="Workspace" />
          )}
        </nav>

        {/* Plan badge + istifadəçi */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          {/* Plan indikatoru */}
          {!isPro && (
            <div className="p-3 bg-orange-50 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-orange-700">Free Plan</span>
                <span className="text-xs text-orange-500">{scenesUsed}/3 scene</span>
              </div>
              <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all"
                  style={{ width: `${(scenesUsed / 3) * 100}%` }}
                />
              </div>
              <button
                onClick={() => navigate('/pricing')}
                className="mt-2.5 w-full text-xs font-bold text-white bg-orange-500
                           py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Pro-ya keç →
              </button>
            </div>
          )}

          {isPro && (
            <div className="flex items-center justify-between px-3 py-2 bg-orange-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Crown size={14} className="text-orange-500 fill-orange-500" />
                <span className="text-xs font-bold text-orange-600">Pro Plan</span>
              </div>
              <button
                onClick={openBillingPortal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title="Ayarlar"
              >
                <Settings size={14} />
              </button>
            </div>
          )}

          {/* İstifadəçi */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center
                            justify-center text-white text-xs font-bold uppercase flex-shrink-0">
              {profile?.full_name?.charAt(0) ?? user?.email?.charAt(0) ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {profile?.full_name ?? 'İstifadəçi'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
              title="Çıxış"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Əsas məzmun */}
      <main className="flex-1 md:ml-64 w-full min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md
                           border-b border-slate-100 px-4 md:px-8 h-16 flex items-center gap-2 md:gap-4">
          
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <Menu size={22} />
          </button>

          <h1 className="text-xl font-bold text-slate-900 flex-shrink-0 hidden md:block">
            Səhnələrim
          </h1>

          {/* Axtarış */}
          <div className="flex-1 max-w-md relative hidden sm:block">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Axtarın..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-transparent
                         rounded-xl text-sm outline-none focus:bg-white
                         focus:border-orange-300 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-1.5 md:gap-2 ml-auto">
            {/* View toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-0.5">
              <button
                onClick={fetchScenes}
                title="Yenilə"
                className={`p-2 rounded-lg transition-colors text-slate-400 hover:text-slate-600 ${isLoading ? 'animate-spin' : ''}`}
              >
                <RefreshCw size={15} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid'
                  ? 'bg-white text-orange-500 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                <Grid3x3 size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list'
                  ? 'bg-white text-orange-500 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                <List size={15} />
              </button>
            </div>

            {/* Yeni scene düyməsi */}
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-orange-500 text-white
                         text-sm font-semibold rounded-xl hover:bg-orange-600
                         transition-colors shadow-md shadow-orange-100 whitespace-nowrap"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Yeni scene</span>
              <span className="sm:hidden">Yeni</span>
            </button>
          </div>
        </header>

        {/* Mobil Axtarış (ancaq mobildə, top barın altında) */}
        <div className="p-4 sm:hidden bg-white border-b border-slate-100">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Səhnələri axtarın..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-transparent
                         rounded-xl text-sm outline-none focus:bg-white
                         focus:border-orange-300 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="p-4 md:p-8">
          {/* Upgrade uğur tostu */}
          {showUpgradeMsg && (
            <div className="mb-6 flex items-center gap-4 p-5 bg-gradient-to-r from-orange-500
                            to-amber-500 text-white rounded-3xl shadow-xl shadow-orange-100
                            animate-slide-down">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} className="fill-white" />
              </div>
              <div>
                <p className="font-extrabold text-base">Flaro Pro-ya xoş gəldiniz! 🎉</p>
                <p className="text-sm text-orange-100">Bütün Pro xüsusiyyətlər indi aktiv. 7 günlük pulsuz sınaqdan istifadə edin.</p>
              </div>
              <button
                onClick={() => setShowUpgradeMsg(false)}
                className="ml-auto text-white/70 hover:text-white transition-colors"
              >✕</button>
            </div>
          )}

          {/* Upgrade banner (Free plan, 3 scene dolubsa) */}
          {!isPro && scenesUsed >= 3 && (
            <div className="mb-6">
              <UpgradeBanner
                feature="unlimited_scenes"
                message="3 scene limitinə çatdınız. Pro planla limitsiz scene yaradın."
              />
            </div>
          )}

          {/* Xəta mesajı */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl flex items-center gap-3">
              <span className="flex-1">{errorMsg}</span>
              <button onClick={fetchScenes} className="text-sm font-bold bg-white px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50">Təkrar yoxla</button>
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
                        text-sm font-medium transition-colors ${active
        ? 'bg-orange-50 text-orange-600 font-bold'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`}>
      {icon}
      {label}
    </button>
  )
}
