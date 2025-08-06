// Example integration of token tracking with AI operations
import { tokenTracker } from './tokenTracking';

export interface AIResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  model?: string;
  provider?: string;
}

export class AIWithTokenTracking {
  
  // Example: OpenAI API call with token tracking
  static async generateEmailWithTracking(
    userId: string,
    prompt: string,
    leadData?: any
  ): Promise<{ content: string; trackingId: string | null }> {
    try {
      // Simulate OpenAI API call (replace with actual OpenAI SDK call)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500
        })
      });

      const data = await response.json();
      
      // Extract token usage from OpenAI response
      const usage = data.usage || {};
      const inputTokens = usage.prompt_tokens || 0;
      const outputTokens = usage.completion_tokens || 0;
      
      // Track the token usage
      const trackingId = await tokenTracker.trackEmailGeneration(
        userId,
        'openai',
        'gpt-4',
        inputTokens,
        outputTokens,
        { leadData, prompt: prompt.substring(0, 100) + '...' }
      );

      return {
        content: data.choices[0]?.message?.content || '',
        trackingId
      };
    } catch (error) {
      console.error('AI generation with tracking error:', error);
      throw error;
    }
  }

  // Example: DeepSeek API call with token tracking
  static async analyzeReplyWithTracking(
    userId: string,
    replyContent: string,
    leadContext?: any
  ): Promise<{ analysis: any; trackingId: string | null }> {
    try {
      // Simulate DeepSeek API call (replace with actual DeepSeek SDK call)
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ 
            role: 'user', 
            content: `Analyze this reply: ${replyContent}` 
          }]
        })
      });

      const data = await response.json();
      
      // DeepSeek might have different usage structure - adapt as needed
      const usage = data.usage || {};
      const inputTokens = usage.prompt_tokens || 0;
      const outputTokens = usage.completion_tokens || 0;
      
      // Track the token usage
      const trackingId = await tokenTracker.trackReplyAnalysis(
        userId,
        'deepseek',
        'deepseek-chat',
        inputTokens,
        outputTokens,
        { leadContext, replyLength: replyContent.length }
      );

      return {
        analysis: JSON.parse(data.choices[0]?.message?.content || '{}'),
        trackingId
      };
    } catch (error) {
      console.error('Reply analysis with tracking error:', error);
      throw error;
    }
  }

  // Wrapper for Python service calls with token tracking
  static async callPythonServiceWithTracking(
    userId: string,
    endpoint: string,
    payload: any,
    operationType: string
  ): Promise<{ result: any; trackingId: string | null }> {
    try {
      const response = await fetch(`${process.env.PYTHON_SERVICE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      // Extract token usage from Python service response
      // Assumes your Python service returns token usage info
      const usage = data.token_usage || {};
      const inputTokens = usage.input_tokens || 0;
      const outputTokens = usage.output_tokens || 0;
      const model = usage.model || 'unknown';
      const provider = usage.provider || 'unknown';
      
      if (inputTokens > 0 || outputTokens > 0) {
        // Track the token usage
        const trackingId = await tokenTracker.trackTokenUsage(
          userId,
          operationType,
          provider,
          model,
          inputTokens,
          outputTokens,
          { endpoint, payload: JSON.stringify(payload).substring(0, 200) }
        );

        return {
          result: data,
          trackingId
        };
      }

      return {
        result: data,
        trackingId: null
      };
    } catch (error) {
      console.error('Python service with tracking error:', error);
      throw error;
    }
  }
}

// Usage examples:

/*
// In your email generation API:
const { content, trackingId } = await AIWithTokenTracking.generateEmailWithTracking(
  user.id,
  emailPrompt,
  leadData
);

// In your reply analysis webhook:
const { analysis, trackingId } = await AIWithTokenTracking.analyzeReplyWithTracking(
  user.id,
  replyContent,
  leadContext
);

// In your Python service calls:
const { result, trackingId } = await AIWithTokenTracking.callPythonServiceWithTracking(
  user.id,
  '/analyze-reply',
  { message_body: replyContent, lead_context: leadData },
  'reply_analysis'
);
*/
