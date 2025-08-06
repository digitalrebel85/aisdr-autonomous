import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { planManager } from '@/lib/plans';

// Routes that require plan checking
const PROTECTED_ROUTES = [
  '/api/send-email',
  '/api/leads',
  '/api/campaigns',
  '/api/nylas/callback',
  '/dashboard/leads',
  '/dashboard/campaigns',
  '/dashboard/inbox'
];

// Plan limits mapping
const PLAN_LIMITS = {
  '/api/send-email': 'emails_per_month',
  '/api/leads': 'prospects_per_month',
  '/api/campaigns': 'campaigns',
  '/api/nylas/callback': 'connected_inboxes'
};

export async function planEnforcementMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if this route needs plan enforcement
  const needsEnforcement = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  if (!needsEnforcement) {
    return NextResponse.next();
  }

  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Get user subscription
    const subscription = await planManager.getUserSubscription(user.id);
    
    if (!subscription) {
      // No subscription - redirect to pricing
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'No active subscription. Please upgrade your plan.' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/pricing?reason=no_subscription', request.url));
    }

    // Check if subscription is active
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Subscription is not active. Please update your billing.' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/billing?reason=inactive_subscription', request.url));
    }

    // Check specific limits for API routes
    if (pathname.startsWith('/api/')) {
      const limitType = PLAN_LIMITS[pathname as keyof typeof PLAN_LIMITS];
      if (limitType) {
        const usageCheck = await planManager.checkUsageLimit(user.id, limitType, 0);
        if (!usageCheck.allowed) {
          return NextResponse.json(
            { 
              error: 'Plan limit exceeded',
              limit: usageCheck.limit,
              usage: usageCheck.usage,
              upgrade_url: '/pricing'
            },
            { status: 429 }
          );
        }
      }
    }

    // Add user and subscription info to headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-subscription-id', subscription.subscription_id);
    response.headers.set('x-plan-slug', subscription.plan_slug);
    
    return response;

  } catch (error) {
    console.error('Plan enforcement error:', error);
    
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unable to verify subscription status' },
        { status: 500 }
      );
    }
    
    return NextResponse.redirect(new URL('/error?reason=subscription_check_failed', request.url));
  }
}

// Helper function to check specific feature access
export async function checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
  try {
    const subscription = await planManager.getUserSubscription(userId);
    if (!subscription) return false;
    
    // Define feature access by plan
    const featureAccess = {
      'startup': ['basic_analytics', 'email_campaigns', 'lead_import'],
      'professional': ['basic_analytics', 'email_campaigns', 'lead_import', 'advanced_analytics', 'ab_testing', 'integrations'],
      'enterprise': ['basic_analytics', 'email_campaigns', 'lead_import', 'advanced_analytics', 'ab_testing', 'integrations', 'custom_integrations', 'dedicated_support']
    };
    
    const planFeatures = featureAccess[subscription.plan_slug as keyof typeof featureAccess] || [];
    return planFeatures.includes(feature);
    
  } catch (error) {
    console.error('Feature access check failed:', error);
    return false;
  }
}

// Helper function to get usage percentage for UI
export async function getUsagePercentage(userId: string, metric: string): Promise<number> {
  try {
    const usageCheck = await planManager.checkUsageLimit(userId, metric, 0);
    if (usageCheck.limit === -1) return 0; // Unlimited
    return (usageCheck.usage / usageCheck.limit) * 100;
  } catch (error) {
    console.error('Usage percentage check failed:', error);
    return 0;
  }
}
