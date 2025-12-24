import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { planManager, UserSubscription, UsageCheck } from '@/lib/plans';

// Feature access by plan
const PLAN_FEATURES: Record<string, string[]> = {
  'free_trial': ['lead_import', 'lead_enrichment', 'email_copywriting', 'sequence_export'],
  'research': ['lead_import', 'lead_enrichment', 'email_copywriting', 'sequence_export'],
  'live_outreach': ['lead_import', 'lead_enrichment', 'email_copywriting', 'sequence_export', 'email_sending', 'inbox_connection', 'reply_tracking', 'crm_sync', 'calendar_booking', 'warmup', 'ai_response_agent', 'basic_analytics'],
  'growth': ['lead_import', 'lead_enrichment', 'email_copywriting', 'sequence_export', 'email_sending', 'inbox_connection', 'reply_tracking', 'crm_sync', 'calendar_booking', 'warmup', 'ai_response_agent', 'basic_analytics', 'ab_testing', 'ai_learning', 'advanced_analytics', 'multiple_campaigns']
};

export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      const supabase = createClient();
      
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setSubscription(null);
          setLoading(false);
          return;
        }
        
        setUserId(user.id);
        const sub = await planManager.getUserSubscription(user.id);
        setSubscription(sub);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const hasFeature = (feature: string): boolean => {
    if (!subscription) return false;
    const planFeatures = PLAN_FEATURES[subscription.plan_slug] || [];
    return planFeatures.includes(feature);
  };
  
  const canConnectInbox = (): boolean => {
    return hasFeature('inbox_connection');
  };
  
  const canSendEmails = (): boolean => {
    return hasFeature('email_sending');
  };
  
  const canViewAnalytics = (): boolean => {
    return hasFeature('basic_analytics');
  };
  
  const isResearchOrTrial = (): boolean => {
    if (!subscription) return true; // No subscription = treat as restricted
    return subscription.plan_slug === 'research' || subscription.plan_slug === 'free_trial';
  };

  const isWithinLimit = (metric: string): boolean => {
    if (!subscription) return false;
    const limit = (subscription.limits as unknown as Record<string, number>)[metric];
    return limit === -1; // -1 means unlimited
  };

  const isTrialing = (): boolean => {
    if (!subscription) return false;
    return subscription.status === 'trialing' && 
           !!subscription.trial_end && 
           new Date(subscription.trial_end) > new Date();
  };

  const isActive = (): boolean => {
    if (!subscription) return false;
    return subscription.status === 'active' || isTrialing();
  };

  const daysUntilTrialEnd = (): number | null => {
    if (!subscription?.trial_end) return null;
    const trialEnd = new Date(subscription.trial_end);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return {
    subscription,
    loading,
    error,
    userId,
    hasFeature,
    canConnectInbox,
    canSendEmails,
    canViewAnalytics,
    isResearchOrTrial,
    isWithinLimit,
    isTrialing,
    isActive,
    daysUntilTrialEnd,
    refresh: async () => {
      if (userId) {
        const sub = await planManager.getUserSubscription(userId);
        setSubscription(sub);
      }
    }
  };
}

export function useUsageCheck(metric: string) {
  const [usage, setUsage] = useState<UsageCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getUser();
  }, []);

  const checkUsage = async (incrementBy: number = 0): Promise<boolean> => {
    if (!currentUserId) return false;

    setLoading(true);
    try {
      const result = await planManager.checkUsageLimit(currentUserId, metric, incrementBy);
      setUsage(result);
      return result.allowed;
    } catch (error) {
      console.error('Usage check failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUsage = async (): Promise<number> => {
    if (!currentUserId) return 0;
    return await planManager.getUsage(currentUserId, metric);
  };

  useEffect(() => {
    if (currentUserId) {
      checkUsage(0); // Check current usage without incrementing
    }
  }, [currentUserId, metric]);

  return {
    usage,
    loading,
    checkUsage,
    getCurrentUsage,
    canUse: usage?.allowed ?? false,
    usagePercentage: usage ? (usage.limit === -1 ? 0 : (usage.usage / usage.limit) * 100) : 0
  };
}
