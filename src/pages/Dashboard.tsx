import { useAuth } from '@/hooks/useAuth'

export default function Dashboard() {
  const { user, signOut, profile } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 text-white font-bold text-xl px-4 py-1.5 rounded-xl shadow-md rotate-1">
            Flaro
          </div>
          <span className="font-semibold text-slate-900">Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 font-medium">
            {profile?.full_name || user?.email} ({profile?.plan === 'pro' ? '★ Pro' : 'Free'})
          </span>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
          >
            Sign Out
          </button>
        </div>
      </header>
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to Flaro, {profile?.full_name || 'Creator'}!
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            Your collaborative hand-drawn space is ready. You are currently on the <span className="font-semibold text-orange-500 capitalize">{profile?.plan || 'free'} plan</span>.
          </p>
          <div className="pt-4 flex gap-4">
            <a href="/editor/new" className="px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-md transition-all">
              + New Hand-Drawn Scene
            </a>
            {profile?.plan !== 'pro' && (
              <a href="/pricing" className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-md transition-all">
                Upgrade to Pro
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
