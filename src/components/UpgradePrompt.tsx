'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';

interface UpgradePromptProps {
  feature: string;
  description: string;
  planRequired?: string;
  className?: string;
}

export default function UpgradePrompt({ 
  feature, 
  description, 
  planRequired = 'Live Outreach',
  className = ''
}: UpgradePromptProps) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-violet-600/10 via-fuchsia-600/10 to-cyan-600/10 rounded-2xl border border-violet-500/20 p-8 ${className}`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-fuchsia-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="relative flex flex-col items-center text-center space-y-6">
        {/* Lock Icon */}
        <div className="p-4 bg-violet-500/20 rounded-2xl border border-violet-500/30">
          <Lock className="w-8 h-8 text-violet-400" />
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">{feature}</h3>
          <p className="text-gray-400 max-w-md">{description}</p>
        </div>
        
        {/* Upgrade CTA */}
        <div className="space-y-3">
          <Link href="/pricing">
            <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-8 py-6 text-lg group">
              <Sparkles className="w-5 h-5 mr-2" />
              Upgrade to {planRequired}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-sm text-gray-500">
            Unlock email sending, inbox connections, and more
          </p>
        </div>
      </div>
    </div>
  );
}

// Inline version for smaller spaces
export function UpgradePromptInline({ 
  feature,
  planRequired = 'Live Outreach'
}: { 
  feature: string;
  planRequired?: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-500/20 rounded-lg">
          <Lock className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{feature}</p>
          <p className="text-xs text-gray-400">Upgrade to {planRequired} to unlock</p>
        </div>
      </div>
      <Link href="/pricing">
        <Button size="sm" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white">
          Upgrade
        </Button>
      </Link>
    </div>
  );
}
