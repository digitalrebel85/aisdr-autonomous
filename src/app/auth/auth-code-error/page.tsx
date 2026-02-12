'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, RefreshCw, Mail } from 'lucide-react';

export default function AuthCodeErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-8 text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          {/* Error Message */}
          <h1 className="text-2xl font-bold text-white mb-2">Authentication Failed</h1>
          <p className="text-gray-400 mb-6">
            We couldn&apos;t complete the sign-in process. This can happen if the authentication link expired or was already used.
          </p>

          {/* Troubleshooting */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4 mb-6 text-left">
            <h3 className="text-sm font-medium text-white mb-2">Try the following:</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <RefreshCw className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                <span>Try signing in again with a fresh link</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                <span>Check your email for the latest verification link</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                <span>Clear your browser cookies and try again</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/login" className="block">
              <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button className="w-full bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white">
                Go to Homepage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
