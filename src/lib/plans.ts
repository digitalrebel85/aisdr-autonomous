import { createClient } from '@/utils/supabase/client';

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number | null;
  price_yearly: number | null;
  features: string[];
  limits: PlanLimits;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PlanLimits {
  prospects_per_month: number;
  emails_per_month: number;
  connected_inboxes: number;
  team_members: number;
  campaigns?: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  plan?: Plan;
}

export interface UserSubscription {
  subscription_id: string;
  plan_name: string;
  plan_slug: string;
  status: string;
  billing_cycle: string;
  current_period_end: string;
  trial_end: string | null;
  limits: PlanLimits;
}

export interface UsageCheck {
  allowed: boolean;
  usage: number;
  limit: number;
}

export class PlanManager {
  private supabase = createClient();

  async getPlans(): Promise<Plan[]> {
    const { data, error } = await this.supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    return data || [];
  }

  async getPlan(slugOrId: string): Promise<Plan | null> {
    const { data, error } = await this.supabase
      .from('plans')
      .select('*')
      .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
      .single();

    if (error) return null;
    return data;
  }

  async getUserSubscription(userId?: string): Promise<UserSubscription | null> {
    if (!userId) {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return null;
      userId = user.id;
    }

    const { data, error } = await this.supabase
      .rpc('get_user_subscription', { user_uuid: userId });

    if (error || !data || data.length === 0) return null;
    return data[0];
  }

  async createSubscription(
    userId: string,
    planSlug: string,
    billingCycle: 'monthly' | 'yearly' = 'monthly',
    trialDays?: number
  ): Promise<Subscription> {
    const plan = await this.getPlan(planSlug);
    if (!plan) throw new Error('Plan not found');

    const subscriptionData: any = {
      user_id: userId,
      plan_id: plan.id,
      billing_cycle: billingCycle,
      status: trialDays ? 'trialing' : 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
    };

    if (trialDays) {
      subscriptionData.trial_end = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString();
    }

    const { data, error } = await this.supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select('*, plan:plans(*)')
      .single();

    if (error) throw error;
    return data;
  }

  async updateSubscription(
    subscriptionId: string,
    updates: Partial<Subscription>
  ): Promise<Subscription> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', subscriptionId)
      .select('*, plan:plans(*)')
      .single();

    if (error) throw error;
    return data;
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('id', subscriptionId);

    if (error) throw error;
  }

  async checkUsageLimit(
    userId: string,
    metric: string,
    incrementBy: number = 1
  ): Promise<UsageCheck> {
    const { data, error } = await this.supabase
      .rpc('check_usage_limit', {
        user_uuid: userId,
        metric,
        increment_by: incrementBy
      });

    if (error) throw error;
    return data;
  }

  async getUsage(userId: string, metric: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('usage_tracking')
      .select('metric_value')
      .eq('user_id', userId)
      .eq('metric_name', metric)
      .eq('period_start', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .single();

    if (error) return 0;
    return data?.metric_value || 0;
  }

  // Helper methods for common checks
  async canSendEmail(userId: string): Promise<boolean> {
    const result = await this.checkUsageLimit(userId, 'emails_per_month', 0);
    return result.allowed;
  }

  async canAddProspect(userId: string): Promise<boolean> {
    const result = await this.checkUsageLimit(userId, 'prospects_per_month', 0);
    return result.allowed;
  }

  async canConnectInbox(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) return false;

    const currentInboxes = await this.supabase
      .from('connected_inboxes')
      .select('id')
      .eq('user_id', userId);

    const inboxCount = currentInboxes.data?.length || 0;
    const limit = subscription.limits.connected_inboxes;

    return limit === -1 || inboxCount < limit;
  }

  // Admin methods
  async createPlan(planData: Omit<Plan, 'id' | 'created_at' | 'updated_at'>): Promise<Plan> {
    const { data, error } = await this.supabase
      .from('plans')
      .insert(planData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePlan(planId: string, updates: Partial<Plan>): Promise<Plan> {
    const { data, error } = await this.supabase
      .from('plans')
      .update(updates)
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const planManager = new PlanManager();
