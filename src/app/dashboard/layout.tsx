'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import SignOutButton from '@/components/SignOutButton';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

// Icon components for each section
const Icons = {
  overview: (props: any) => (
    <svg {...props} fill="currentColor" viewBox="0 0 20 20">
      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
    </svg>
  ),
  leads: (props: any) => (
    <svg {...props} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
    </svg>
  ),
  outreach: (props: any) => (
    <svg {...props} fill="currentColor" viewBox="0 0 20 20">
      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
    </svg>
  ),
  inbox: (props: any) => (
    <svg {...props} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd"></path>
    </svg>
  ),
  calendar: (props: any) => (
    <svg {...props} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
    </svg>
  ),
  analytics: (props: any) => (
    <svg {...props} fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path>
    </svg>
  ),
  settings: (props: any) => (
    <svg {...props} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
    </svg>
  ),
  chevron: (props: any) => (
    <svg {...props} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
    </svg>
  )
};

// Navigation item component
const NavItem = ({ href, icon, label, isActive, badge }: {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  badge?: number;
}) => (
  <Link href={href}>
    <div className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
      isActive 
        ? 'bg-blue-600 text-white shadow-lg' 
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`}>
      <div className="flex items-center space-x-3">
        <div className="w-5 h-5">{icon}</div>
        <span className="font-medium">{label}</span>
      </div>
      {badge && badge > 0 && (
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </div>
  </Link>
);

// Collapsible section component
const NavSection = ({ title, children, defaultOpen = true }: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-gray-400 hover:text-white transition-colors"
      >
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        <Icons.chevron className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="mt-2 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  
  useEffect(() => {
    checkOnboardingStatus();
  }, []);
  
  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();
      
      // If no profile or onboarding not completed, redirect to onboarding
      if (!profile || !profile.onboarding_completed) {
        router.push('/onboarding');
        return;
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-72 bg-gray-900 text-white flex flex-col shadow-xl">
        {/* Header */}
        <div className="h-16 flex items-center justify-center border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <span className="text-xl font-bold">AISDR</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          {/* Main Navigation */}
          <NavSection title="Main" defaultOpen={true}>
            <NavItem
              href="/dashboard"
              icon={<Icons.overview className="w-5 h-5" />}
              label="Overview"
              isActive={pathname === '/dashboard'}
            />
            <NavItem
              href="/dashboard/inbox"
              icon={<Icons.inbox className="w-5 h-5" />}
              label="AI Inbox"
              isActive={pathname === '/dashboard/inbox'}
              badge={12}
            />
          </NavSection>
          
          {/* Lead Management */}
          <NavSection title="Lead Management">
            <NavItem
              href="/dashboard/leads"
              icon={<Icons.leads className="w-5 h-5" />}
              label="Lead Database"
              isActive={pathname === '/dashboard/leads'}
            />
            <NavItem
              href="/dashboard/offers"
              icon={<Icons.outreach className="w-5 h-5" />}
              label="Offers & CTAs"
              isActive={pathname === '/dashboard/offers'}
            />
          </NavSection>
          
          {/* Outreach Hub */}
          <NavSection title="Outreach Hub">
            <NavItem
              href="/dashboard/automated-outreach"
              icon={<Icons.outreach className="w-5 h-5" />}
              label="Campaign Builder"
              isActive={pathname === '/dashboard/automated-outreach'}
            />
            <NavItem
              href="/dashboard/strategic-followup"
              icon={<Icons.outreach className="w-5 h-5" />}
              label="Strategic Follow-up"
              isActive={pathname === '/dashboard/strategic-followup'}
            />
          </NavSection>
          
          {/* Calendar System */}
          <NavSection title="Calendar System">
            <NavItem
              href="/dashboard/bookings"
              icon={<Icons.calendar className="w-5 h-5" />}
              label="Booking Links"
              isActive={pathname === '/dashboard/bookings'}
            />
            <NavItem
              href="/dashboard/calendar-hosts"
              icon={<Icons.calendar className="w-5 h-5" />}
              label="Calendar Hosts"
              isActive={pathname === '/dashboard/calendar-hosts'}
            />
          </NavSection>
          
          {/* Analytics & Settings */}
          <NavSection title="Analytics & Settings">
            <NavItem
              href="/dashboard/analytics"
              icon={<Icons.analytics className="w-5 h-5" />}
              label="Performance"
              isActive={pathname === '/dashboard/analytics'}
            />
            <NavItem
              href="/settings"
              icon={<Icons.settings className="w-5 h-5" />}
              label="Settings"
              isActive={pathname === '/settings'}
            />
          </NavSection>
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <SignOutButton />
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
