import Link from 'next/link'
import { Bot, Mail, CheckCircle } from 'lucide-react'

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-fuchsia-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-emerald-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <Link href="/" className="inline-block group">
            <div className="flex items-center justify-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative p-3 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl shadow-2xl shadow-violet-500/30 group-hover:scale-110 transition-transform duration-300">
                  <Bot className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </Link>
          
          <div className="mt-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <Mail className="h-8 w-8 text-emerald-400" />
            </div>
            
            <h2 className="mt-6 text-3xl font-bold text-white">
              Check your email
            </h2>
            
            <p className="mt-4 text-gray-400">
              We&apos;ve sent a verification link to your email address. 
              Please check your inbox and click the link to activate your account.
            </p>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/10 py-8 px-6 rounded-2xl backdrop-blur-sm">
          <div className="space-y-6">
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-violet-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-violet-300">
                    What&apos;s next?
                  </h3>
                  <div className="mt-2 text-sm text-violet-300/80">
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Check your email inbox (and spam folder)</li>
                      <li>Click the verification link in the email</li>
                      <li>Complete your account setup</li>
                      <li>Start your ConnectLead journey!</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                Didn&apos;t receive the email? Check your spam folder or
              </p>
              <button className="text-violet-400 hover:text-violet-300 font-medium text-sm transition-colors">
                Resend verification email
              </button>
            </div>

            <div className="border-t border-white/10 pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Already verified your email?
                </p>
                <Link
                  href="/login"
                  className="mt-2 inline-block text-violet-400 hover:text-violet-300 font-medium transition-colors"
                >
                  Sign in to your account
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            ← Back to homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
