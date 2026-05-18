import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error:    Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Sentry or local error analytics can be reported here
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-6">
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-50 pointer-events-none" />
          <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-2xl z-10 text-center max-w-md w-full space-y-6">
            <div className="w-16 h-16 bg-orange-100 border border-orange-200/50 rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <span className="text-3xl animate-bounce-soft">⚠️</span>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight mb-2">
                Gözlənilməz xəta baş verdi
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                {this.state.error?.message ?? 'Flaro tətbiqində gözlənilməyən bir problem yaşandı. Zəhmət olmasa yenidən cəhd edin.'}
              </p>
            </div>
            
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold
                           text-sm rounded-2xl hover:shadow-lg hover:shadow-orange-100 transition-all shadow-md active:scale-95 duration-200"
              >
                Səhifəni Yenilə
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.href = '/dashboard'
                }}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-extrabold
                           text-sm rounded-2xl transition-all active:scale-95 duration-200"
              >
                Ana Səhifəyə Keç
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
