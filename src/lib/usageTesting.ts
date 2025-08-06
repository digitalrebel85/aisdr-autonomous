import { planManager } from './plans';
import { createClient } from '@/utils/supabase/client';

export interface UsageTestResult {
  success: boolean;
  message: string;
  usage?: {
    current: number;
    limit: number;
    remaining: number;
  };
  error?: string;
}

export class UsageTester {
  private supabase = createClient();

  async testLeadUsage(userId: string, count: number = 1): Promise<UsageTestResult> {
    try {
      const usageCheck = await planManager.checkUsageLimit(userId, 'prospects_per_month', count);
      
      if (!usageCheck.allowed) {
        return {
          success: false,
          message: `Cannot add ${count} leads - would exceed limit`,
          usage: {
            current: usageCheck.usage,
            limit: usageCheck.limit,
            remaining: usageCheck.limit === -1 ? -1 : usageCheck.limit - usageCheck.usage
          }
        };
      }

      return {
        success: true,
        message: `Successfully incremented lead usage by ${count}`,
        usage: {
          current: usageCheck.usage + count,
          limit: usageCheck.limit,
          remaining: usageCheck.limit === -1 ? -1 : usageCheck.limit - (usageCheck.usage + count)
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error testing lead usage',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testEmailUsage(userId: string, count: number = 1): Promise<UsageTestResult> {
    try {
      const usageCheck = await planManager.checkUsageLimit(userId, 'emails_per_month', count);
      
      if (!usageCheck.allowed) {
        return {
          success: false,
          message: `Cannot send ${count} emails - would exceed limit`,
          usage: {
            current: usageCheck.usage,
            limit: usageCheck.limit,
            remaining: usageCheck.limit === -1 ? -1 : usageCheck.limit - usageCheck.usage
          }
        };
      }

      return {
        success: true,
        message: `Successfully incremented email usage by ${count}`,
        usage: {
          current: usageCheck.usage + count,
          limit: usageCheck.limit,
          remaining: usageCheck.limit === -1 ? -1 : usageCheck.limit - (usageCheck.usage + count)
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error testing email usage',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getCurrentUsage(userId: string): Promise<{
    leads: number;
    emails: number;
    subscription: any;
  }> {
    const [leadsUsage, emailsUsage, subscription] = await Promise.all([
      planManager.getUsage(userId, 'prospects_per_month'),
      planManager.getUsage(userId, 'emails_per_month'),
      planManager.getUserSubscription(userId)
    ]);

    return {
      leads: leadsUsage,
      emails: emailsUsage,
      subscription
    };
  }

  async resetUsage(userId: string, metric: string): Promise<boolean> {
    try {
      // This would require admin privileges - for testing only
      const { error } = await this.supabase
        .from('usage_tracking')
        .delete()
        .eq('user_id', userId)
        .eq('metric_name', metric)
        .eq('period_start', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      return !error;
    } catch (error) {
      console.error('Error resetting usage:', error);
      return false;
    }
  }

  async simulateUsageScenario(userId: string, scenario: 'light' | 'heavy' | 'limit_test'): Promise<UsageTestResult[]> {
    const results: UsageTestResult[] = [];

    switch (scenario) {
      case 'light':
        // Simulate light usage
        results.push(await this.testLeadUsage(userId, 10));
        results.push(await this.testEmailUsage(userId, 5));
        break;

      case 'heavy':
        // Simulate heavy usage
        results.push(await this.testLeadUsage(userId, 100));
        results.push(await this.testEmailUsage(userId, 50));
        break;

      case 'limit_test':
        // Test approaching limits
        const subscription = await planManager.getUserSubscription(userId);
        if (subscription) {
          const leadLimit = subscription.limits.prospects_per_month;
          const emailLimit = subscription.limits.emails_per_month;

          if (leadLimit !== -1) {
            // Try to use 90% of lead limit
            const targetLeads = Math.floor(leadLimit * 0.9);
            results.push(await this.testLeadUsage(userId, targetLeads));
          }

          if (emailLimit !== -1) {
            // Try to use 90% of email limit
            const targetEmails = Math.floor(emailLimit * 0.9);
            results.push(await this.testEmailUsage(userId, targetEmails));
          }
        }
        break;
    }

    return results;
  }
}

export const usageTester = new UsageTester();
