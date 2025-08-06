import { createClient } from '@/utils/supabase/client';

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd?: number;
  model?: string;
  provider?: string;
}

export interface TokenTrackingRecord {
  id: string;
  user_id: string;
  operation_type: string; // 'email_generation', 'reply_analysis', 'lead_enrichment', etc.
  model: string;
  provider: string; // 'openai', 'deepseek', 'anthropic'
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
  metadata?: Record<string, any>;
  created_at: string;
}

// Token costs per 1K tokens (update these with current pricing)
const TOKEN_COSTS = {
  openai: {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }
  },
  deepseek: {
    'deepseek-chat': { input: 0.00014, output: 0.00028 },
    'deepseek-coder': { input: 0.00014, output: 0.00028 }
  },
  anthropic: {
    'claude-3-opus': { input: 0.015, output: 0.075 },
    'claude-3-sonnet': { input: 0.003, output: 0.015 },
    'claude-3-haiku': { input: 0.00025, output: 0.00125 }
  }
};

export class TokenTracker {
  private supabase = createClient();

  calculateCost(provider: string, model: string, inputTokens: number, outputTokens: number): number {
    const providerCosts = TOKEN_COSTS[provider as keyof typeof TOKEN_COSTS];
    if (!providerCosts) return 0;

    const modelCosts = providerCosts[model as keyof typeof providerCosts];
    if (!modelCosts) return 0;

    const inputCost = (inputTokens / 1000) * modelCosts.input;
    const outputCost = (outputTokens / 1000) * modelCosts.output;
    
    return inputCost + outputCost;
  }

  async trackTokenUsage(
    userId: string,
    operationType: string,
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    metadata?: Record<string, any>
  ): Promise<string | null> {
    try {
      const totalTokens = inputTokens + outputTokens;
      const cost = this.calculateCost(provider, model, inputTokens, outputTokens);

      const { data, error } = await this.supabase
        .from('token_usage')
        .insert({
          user_id: userId,
          operation_type: operationType,
          provider,
          model,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: totalTokens,
          cost_usd: cost,
          metadata: metadata || {}
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error tracking token usage:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Token tracking error:', error);
      return null;
    }
  }

  async getUserTokenUsage(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    operationType?: string
  ): Promise<{
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    total_cost: number;
    by_operation: Record<string, TokenUsage & { count: number }>;
    by_model: Record<string, TokenUsage & { count: number }>;
  }> {
    try {
      let query = this.supabase
        .from('token_usage')
        .select('*')
        .eq('user_id', userId);

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }
      if (operationType) {
        query = query.eq('operation_type', operationType);
      }

      const { data, error } = await query;

      if (error) throw error;

      const records = data || [];
      
      // Calculate totals
      const totals = records.reduce((acc, record) => ({
        total_tokens: acc.total_tokens + record.total_tokens,
        input_tokens: acc.input_tokens + record.input_tokens,
        output_tokens: acc.output_tokens + record.output_tokens,
        total_cost: acc.total_cost + record.cost_usd
      }), { total_tokens: 0, input_tokens: 0, output_tokens: 0, total_cost: 0 });

      // Group by operation type
      const byOperation: Record<string, TokenUsage & { count: number }> = {};
      records.forEach(record => {
        if (!byOperation[record.operation_type]) {
          byOperation[record.operation_type] = {
            input_tokens: 0,
            output_tokens: 0,
            total_tokens: 0,
            cost_usd: 0,
            count: 0
          };
        }
        byOperation[record.operation_type].input_tokens += record.input_tokens;
        byOperation[record.operation_type].output_tokens += record.output_tokens;
        byOperation[record.operation_type].total_tokens += record.total_tokens;
        byOperation[record.operation_type].cost_usd! += record.cost_usd;
        byOperation[record.operation_type].count += 1;
      });

      // Group by model
      const byModel: Record<string, TokenUsage & { count: number }> = {};
      records.forEach(record => {
        const modelKey = `${record.provider}/${record.model}`;
        if (!byModel[modelKey]) {
          byModel[modelKey] = {
            input_tokens: 0,
            output_tokens: 0,
            total_tokens: 0,
            cost_usd: 0,
            count: 0,
            provider: record.provider,
            model: record.model
          };
        }
        byModel[modelKey].input_tokens += record.input_tokens;
        byModel[modelKey].output_tokens += record.output_tokens;
        byModel[modelKey].total_tokens += record.total_tokens;
        byModel[modelKey].cost_usd! += record.cost_usd;
        byModel[modelKey].count += 1;
      });

      return {
        ...totals,
        by_operation: byOperation,
        by_model: byModel
      };
    } catch (error) {
      console.error('Error getting user token usage:', error);
      return {
        total_tokens: 0,
        input_tokens: 0,
        output_tokens: 0,
        total_cost: 0,
        by_operation: {},
        by_model: {}
      };
    }
  }

  async getMonthlyTokenUsage(userId: string, year?: number, month?: number) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    return this.getUserTokenUsage(userId, startDate, endDate);
  }

  // Wrapper functions for common operations
  async trackEmailGeneration(userId: string, provider: string, model: string, inputTokens: number, outputTokens: number, emailData?: any) {
    return this.trackTokenUsage(userId, 'email_generation', provider, model, inputTokens, outputTokens, emailData);
  }

  async trackReplyAnalysis(userId: string, provider: string, model: string, inputTokens: number, outputTokens: number, replyData?: any) {
    return this.trackTokenUsage(userId, 'reply_analysis', provider, model, inputTokens, outputTokens, replyData);
  }

  async trackLeadEnrichment(userId: string, provider: string, model: string, inputTokens: number, outputTokens: number, leadData?: any) {
    return this.trackTokenUsage(userId, 'lead_enrichment', provider, model, inputTokens, outputTokens, leadData);
  }

  async trackFollowUpGeneration(userId: string, provider: string, model: string, inputTokens: number, outputTokens: number, followUpData?: any) {
    return this.trackTokenUsage(userId, 'follow_up_generation', provider, model, inputTokens, outputTokens, followUpData);
  }
}

export const tokenTracker = new TokenTracker();
