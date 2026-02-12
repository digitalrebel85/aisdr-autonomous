/**
 * Free Trial Management System
 * 
 * Implements a hybrid trial model:
 * - 14-day time-based trial OR
 * - 50 enriched leads + 100 sent emails (whichever comes first)
 * 
 * Features:
 * - Usage tracking
 * - Cost controls
 * - Automatic tier management
 * - Trial expiration handling
 */

import { createClient } from '@/utils/supabase/client';

export interface TrialLimits {
  maxDays: number;
  maxLeads: number;
  maxEmails: number;
}

export interface TrialUsage {
  daysRemaining: number;
  leadsUsed: number;
  leadsRemaining: number;
  emailsUsed: number;
  emailsRemaining: number;
  isExpired: boolean;
  expirationReason?: 'time' | 'leads' | 'emails';
}

export interface UserTrial {
  userId: string;
  startDate: Date;
  endDate: Date;
  leadsEnriched: number;
  emailsSent: number;
  status: 'active' | 'expired' | 'converted';
}

// Default trial limits
export const DEFAULT_TRIAL_LIMITS: TrialLimits = {
  maxDays: 14,
  maxLeads: 50,
  maxEmails: 100,
};

/**
 * Initialize a new trial for a user
 */
export async function initializeTrial(userId: string): Promise<UserTrial> {
  const supabase = createClient();
  
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + DEFAULT_TRIAL_LIMITS.maxDays);

  const { data, error } = await supabase
    .from('user_trials')
    .insert({
      user_id: userId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      leads_enriched: 0,
      emails_sent: 0,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to initialize trial: ${error.message}`);
  }

  return {
    userId: data.user_id,
    startDate: new Date(data.start_date),
    endDate: new Date(data.end_date),
    leadsEnriched: data.leads_enriched,
    emailsSent: data.emails_sent,
    status: data.status,
  };
}

/**
 * Get current trial status and usage for a user
 */
export async function getTrialUsage(userId: string): Promise<TrialUsage> {
  const supabase = createClient();

  const { data: trial, error } = await supabase
    .from('user_trials')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !trial) {
    throw new Error('Trial not found');
  }

  const now = new Date();
  const endDate = new Date(trial.end_date);
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  
  const leadsUsed = trial.leads_enriched;
  const leadsRemaining = Math.max(0, DEFAULT_TRIAL_LIMITS.maxLeads - leadsUsed);
  
  const emailsUsed = trial.emails_sent;
  const emailsRemaining = Math.max(0, DEFAULT_TRIAL_LIMITS.maxEmails - emailsUsed);

  // Determine if trial is expired and why
  let isExpired = false;
  let expirationReason: 'time' | 'leads' | 'emails' | undefined;

  if (daysRemaining === 0) {
    isExpired = true;
    expirationReason = 'time';
  } else if (leadsRemaining === 0) {
    isExpired = true;
    expirationReason = 'leads';
  } else if (emailsRemaining === 0) {
    isExpired = true;
    expirationReason = 'emails';
  }

  // Update trial status if expired
  if (isExpired && trial.status === 'active') {
    await supabase
      .from('user_trials')
      .update({ status: 'expired' })
      .eq('user_id', userId);
  }

  return {
    daysRemaining,
    leadsUsed,
    leadsRemaining,
    emailsUsed,
    emailsRemaining,
    isExpired,
    expirationReason,
  };
}

/**
 * Check if user can enrich a lead (within trial limits)
 */
export async function canEnrichLead(userId: string): Promise<boolean> {
  const usage = await getTrialUsage(userId);
  return !usage.isExpired && usage.leadsRemaining > 0;
}

/**
 * Check if user can send an email (within trial limits)
 */
export async function canSendEmail(userId: string): Promise<boolean> {
  const usage = await getTrialUsage(userId);
  return !usage.isExpired && usage.emailsRemaining > 0;
}

/**
 * Increment lead enrichment count
 */
export async function incrementLeadCount(userId: string, count: number = 1): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.rpc('increment_leads_enriched', {
    p_user_id: userId,
    p_count: count,
  });

  if (error) {
    throw new Error(`Failed to increment lead count: ${error.message}`);
  }
}

/**
 * Increment email sent count
 */
export async function incrementEmailCount(userId: string, count: number = 1): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.rpc('increment_emails_sent', {
    p_user_id: userId,
    p_count: count,
  });

  if (error) {
    throw new Error(`Failed to increment email count: ${error.message}`);
  }
}

/**
 * Convert trial to paid subscription
 */
export async function convertTrialToPaid(userId: string, subscriptionTier: string): Promise<void> {
  const supabase = createClient();

  // Update trial status
  await supabase
    .from('user_trials')
    .update({ status: 'converted' })
    .eq('user_id', userId);

  // Create subscription record
  await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      tier: subscriptionTier,
      status: 'active',
      start_date: new Date().toISOString(),
    });
}

/**
 * Get trial expiration message for UI
 */
export function getTrialExpirationMessage(usage: TrialUsage): string {
  if (!usage.isExpired) {
    return '';
  }

  switch (usage.expirationReason) {
    case 'time':
      return 'Your 14-day free trial has ended. Upgrade to continue using ConnectLead.';
    case 'leads':
      return 'You\'ve used all 50 free lead enrichments. Upgrade to enrich more leads.';
    case 'emails':
      return 'You\'ve sent all 100 free emails. Upgrade to continue your outreach.';
    default:
      return 'Your free trial has ended. Upgrade to continue.';
  }
}

/**
 * Calculate trial progress percentage
 */
export function calculateTrialProgress(usage: TrialUsage): {
  timeProgress: number;
  leadsProgress: number;
  emailsProgress: number;
  overallProgress: number;
} {
  const timeProgress = ((DEFAULT_TRIAL_LIMITS.maxDays - usage.daysRemaining) / DEFAULT_TRIAL_LIMITS.maxDays) * 100;
  const leadsProgress = (usage.leadsUsed / DEFAULT_TRIAL_LIMITS.maxLeads) * 100;
  const emailsProgress = (usage.emailsUsed / DEFAULT_TRIAL_LIMITS.maxEmails) * 100;
  
  // Overall progress is the maximum of the three (whichever hits limit first)
  const overallProgress = Math.max(timeProgress, leadsProgress, emailsProgress);

  return {
    timeProgress: Math.min(100, timeProgress),
    leadsProgress: Math.min(100, leadsProgress),
    emailsProgress: Math.min(100, emailsProgress),
    overallProgress: Math.min(100, overallProgress),
  };
}

