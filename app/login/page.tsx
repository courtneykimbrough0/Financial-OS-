'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { CalendarIcon, Mail, Loader2, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)
    if (error) {
      setErrorMsg(error.message)
    } else {
      setSuccess(true)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#070709] px-4 py-12 text-zinc-100 font-sans relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Branding header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg text-indigo-400 mb-4">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Welcome to Financial OS</h1>
          <p className="text-sm text-zinc-400 mt-1.5">Cash engine, forecasting, and liability modeling</p>
        </div>

        {/* Product Explainer */}
        <div className="mb-6 text-sm text-zinc-300 bg-zinc-950/40 border border-white/5 rounded-3xl p-6 space-y-3.5">
          <p className="font-semibold text-white text-center">See your cash flow before it happens.</p>
          <ul className="space-y-2 text-xs text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 select-none mt-0.5">•</span>
              <span>Track income, expenses, subscriptions, liabilities, and savings in one place</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 select-none mt-0.5">•</span>
              <span>Calendar and chart views show your balance days, weeks, or months ahead</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 select-none mt-0.5">•</span>
              <span>Built-in payoff planner compares strategies for your liabilities</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 select-none mt-0.5">•</span>
              <span>Private and secure — only you can see your data</span>
            </li>
          </ul>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-950/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl relative">
          {success ? (
            <div className="text-center py-4">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400 mb-4 animate-bounce">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Check your email</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                We sent a secure magic link to <span className="text-indigo-400 font-semibold">{email}</span>. Click the link in your inbox to sign in instantly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900/60 border border-white/5 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="text-xs text-rose-400 bg-rose-950/20 border border-rose-500/20 px-4 py-3 rounded-xl">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Magic Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
