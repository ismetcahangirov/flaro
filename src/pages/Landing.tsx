export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="text-center space-y-6 max-w-2xl">
        <div className="inline-block bg-orange-500 text-white font-bold text-3xl px-6 py-3 rounded-2xl shadow-lg transform rotate-2 animate-bounce">
          Flaro
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight font-sans text-slate-900 md:text-6xl">
          Beautiful hand-drawn <span className="text-orange-500">diagrams</span>
        </h1>
        <p className="text-lg text-slate-600 font-sans leading-relaxed">
          Create premium wireframes, mindmaps, and workflows that look like they were sketched on a whiteboard. Built for collaborative teams.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
          <a href="/login" className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-md transition-all">
            Get Started Free
          </a>
          <a href="/pricing" className="px-8 py-4 bg-white hover:bg-slate-100 text-slate-800 font-semibold rounded-xl border border-slate-200 shadow-sm transition-all">
            View Pricing
          </a>
        </div>
      </div>
    </div>
  )
}
