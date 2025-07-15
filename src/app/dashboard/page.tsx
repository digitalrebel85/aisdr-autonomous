// src/app/dashboard/page.tsx

import SignOutButton from '@/components/SignOutButton'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back!</p>
        </div>
        <nav className="flex justify-center space-x-4">
          <Link href="/settings" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Go to Settings
          </Link>
        </nav>
        <div className="flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}