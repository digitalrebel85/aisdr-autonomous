'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Bot, Sparkles, ArrowRight } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (!acceptTerms) {
      setError('Please accept the terms and conditions')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback?next=/onboarding`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        // Show success message - user needs to check email
        setError(null)
        router.push('/signup/check-email')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }

    setLoading(false)
  }

  const handleGoogleSignUp = async () => {
    setError(null)
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback?next=/onboarding`,
      },
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-fuchsia-600/20 rounded-full blur-3xl animate-float-reverse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="animate-fade-in-up">
          <Link href="/" className="flex justify-center items-center space-x-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:scale-110 transition-transform duration-300">
              <Bot className="w-7 h-7 text-white group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <span className="text-2xl font-bold text-white group-hover:text-violet-300 transition-colors">ConnectLead</span>
          </Link>
          <h2 className="mt-8 text-center text-3xl font-bold text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{' '}
            <Link
              href="/login"
              className="font-medium text-violet-400 hover:text-violet-300 transition-colors"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl py-8 px-6 rounded-2xl border border-white/10 animate-fade-in-scale" style={{animationDelay: '200ms'}}>
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSignUp}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-4 py-3 bg-white/5 border border-white/10 placeholder-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-4 py-3 bg-white/5 border border-white/10 placeholder-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="Create a password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-4 py-3 bg-white/5 border border-white/10 placeholder-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="Confirm your password"
              />
            </div>

            <div className="flex items-center">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-white/20 rounded bg-white/5"
              />
              <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-300">
                I agree to the{' '}
                <a href="#" className="text-violet-400 hover:text-violet-300 transition-colors">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-violet-400 hover:text-violet-300 transition-colors">
                  Privacy Policy
                </a>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02]"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </div>
                ) : (
                  <span className="flex items-center">
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#0a0a0f] text-gray-500">Or continue with</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="w-full flex justify-center items-center px-4 py-3 border border-white/10 rounded-xl text-sm font-medium text-white bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:border-white/20"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 animate-fade-in-up" style={{animationDelay: '400ms'}}>
          By creating an account, you agree to our Terms of Service and Privacy Policy.
          <br />
          We'll help you get started with a quick onboarding process.
        </p>
      </div>
    </div>
  )
}
