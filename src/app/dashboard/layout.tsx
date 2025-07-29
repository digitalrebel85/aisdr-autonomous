import Link from 'next/link';
import SignOutButton from '@/components/SignOutButton';

// A simple icon component for demonstration
const Icon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
  </svg>
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="h-16 flex items-center justify-center text-2xl font-bold">AISDR</div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          <Link href="/dashboard" className="flex items-center px-4 py-2 rounded-md hover:bg-gray-700">
            <Icon className="w-6 h-6 mr-3" />
            <span>Overview</span>
          </Link>
          <Link href="/dashboard/inbox" className="flex items-center px-4 py-2 rounded-md hover:bg-gray-700">
             <Icon className="w-6 h-6 mr-3" />
            <span>AI Inbox</span>
          </Link>
          <Link href="/dashboard/leads" className="flex items-center px-4 py-2 rounded-md hover:bg-gray-700">
             <Icon className="w-6 h-6 mr-3" />
            <span>Leads</span>
          </Link>
          <Link href="/dashboard/offers" className="flex items-center px-4 py-2 rounded-md hover:bg-gray-700">
             <Icon className="w-6 h-6 mr-3" />
            <span>Offers</span>
          </Link>
          <Link href="/dashboard/automated-outreach" className="flex items-center px-4 py-2 rounded-md hover:bg-gray-700">
             <Icon className="w-6 h-6 mr-3" />
            <span>Automated Outreach</span>
          </Link>
          <Link href="/dashboard/strategic-followup" className="flex items-center px-4 py-2 rounded-md hover:bg-gray-700">
             <Icon className="w-6 h-6 mr-3" />
            <span>Strategic Follow-up</span>
          </Link>
          <Link href="/dashboard/bookings" className="flex items-center px-4 py-2 rounded-md hover:bg-gray-700">
             <Icon className="w-6 h-6 mr-3" />
            <span>Calendar Bookings</span>
          </Link>
          <Link href="/dashboard/calendar-hosts" className="flex items-center px-4 py-2 rounded-md hover:bg-gray-700">
             <Icon className="w-6 h-6 mr-3" />
            <span>Calendar Hosts</span>
          </Link>
          <Link href="/dashboard/analytics" className="flex items-center px-4 py-2 rounded-md hover:bg-gray-700">
             <Icon className="w-6 h-6 mr-3" />
            <span>Analytics</span>
          </Link>
          <Link href="/settings" className="flex items-center px-4 py-2 rounded-md hover:bg-gray-700">
             <Icon className="w-6 h-6 mr-3" />
            <span>Settings</span>
          </Link>
        </nav>
        <div className="p-4">
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 p-10">
        {children}
      </main>
    </div>
  );
}
