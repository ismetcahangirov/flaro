function App() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-2xl font-bold text-white shadow-float">
          F
        </div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600">
          Flaro setup
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight text-gray-950 md:text-6xl">
          Hand-drawn diagrams, built for teams.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
          The project skeleton is ready for the Supabase, canvas, realtime, and billing
          modules that follow in the roadmap.
        </p>
      </div>
    </main>
  )
}

export default App
