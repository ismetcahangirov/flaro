export default function Pricing() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans py-16 px-6 flex flex-col items-center">
      <div className="max-w-4xl w-full text-center space-y-4 mb-16">
        <div className="inline-block bg-orange-500 text-white font-bold text-2xl px-5 py-2.5 rounded-xl shadow-md rotate-1">
          Flaro
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
          Simple, transparent <span className="text-orange-500">plans</span>
        </h1>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
          Start for free, upgrade to unlock unlimited sketches, team workspaces, PDF/PPTX export, and real-time collaboration.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Free Plan */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-slate-900">Free Plan</h3>
            <p className="text-slate-500">For students, designers, and hobbyists starting out.</p>
            <div className="text-4xl font-black text-slate-900">$0</div>
            <ul className="space-y-3 pt-6 border-t border-slate-100 text-slate-600">
              <li className="flex items-center gap-2">✓ Max 3 Sketchboards</li>
              <li className="flex items-center gap-2">✓ Basic Hand-Drawn Elements</li>
              <li className="flex items-center gap-2">✓ Client-Side Image Export</li>
              <li className="flex items-center gap-2">✓ 10 Daily AI Generations</li>
            </ul>
          </div>
          <a href="/login" className="mt-8 block text-center py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-all">
            Get Started Free
          </a>
        </div>

        {/* Pro Plan */}
        <div className="bg-white rounded-3xl p-8 border-2 border-orange-500 shadow-xl flex flex-col justify-between relative transform scale-105">
          <div className="absolute -top-4 right-6 bg-orange-500 text-white text-xs uppercase font-extrabold px-3 py-1.5 rounded-full shadow-md">
            Popular
          </div>
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-slate-900">Pro Plan</h3>
            <p className="text-slate-500">For teams, companies, and professional workflows.</p>
            <div className="text-4xl font-black text-slate-900">$6 <span className="text-sm font-medium text-slate-500">/ month</span></div>
            <ul className="space-y-3 pt-6 border-t border-slate-100 text-slate-600">
              <li className="flex items-center gap-2 text-orange-600 font-semibold">★ Unlimited Sketchboards</li>
              <li className="flex items-center gap-2">✓ Real-time Team Workspaces</li>
              <li className="flex items-center gap-2">✓ PDF & PPTX Server Export</li>
              <li className="flex items-center gap-2">✓ 100 Daily AI Generations</li>
              <li className="flex items-center gap-2">✓ Real-Time Multi-player Canvas</li>
            </ul>
          </div>
          <a href="/login" className="mt-8 block text-center py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition-all">
            Upgrade to Pro
          </a>
        </div>
      </div>
    </div>
  )
}
