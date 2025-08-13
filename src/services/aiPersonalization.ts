// AI Personalization Service
// Generates personalized hooks, triggers, and angles based on persona and offer data

interface PersonalizationContext {
  lead: {
    id: string;
    first_name?: string;
    last_name?: string;
    job_title?: string;
    company?: string;
    industry?: string;
    email_content?: string; // The original email they sent
  };
  persona: {
    id: string;
    name: string;
    pain_points: string[];
    messaging_hooks: string[];
    tone: string;
    title_patterns: string[];
    industries: string[];
  };
  offers: {
    id: string;
    name: string;
    value_proposition: string;
    call_to_action: string;
    hook_snippet: string;
  }[];
  emailContext?: {
    subject: string;
    originalContent: string;
    sentiment?: string;
    intent?: string;
  };
}

interface PersonalizedResponse {
  subject: string;
  body: string;
  hooks: string[];
  triggers: string[];
  angles: string[];
  selectedOffer?: any;
  personalizationScore: number;
}

export class AIPersonalizationService {
  
  /**
   * Generate personalized email response using AI
   */
  async generatePersonalizedReply(context: PersonalizationContext): Promise<PersonalizedResponse> {
    console.log(`🤖 Generating personalized reply for ${context.lead.first_name} using persona: ${context.persona.name}`);

    // 1. Analyze the lead's original email for context
    const emailAnalysis = this.analyzeEmailContent(context.emailContext?.originalContent || '');
    
    // 2. Select the most relevant offer based on persona and email content
    const selectedOffer = this.selectBestOffer(context.offers, context.persona, emailAnalysis);
    
    // 3. Generate personalized hooks, triggers, and angles
    const personalizationElements = this.generatePersonalizationElements(context, selectedOffer, emailAnalysis);
    
    // 4. Craft the personalized email
    const personalizedEmail = await this.craftPersonalizedEmail(context, selectedOffer, personalizationElements);
    
    return {
      ...personalizedEmail,
      ...personalizationElements,
      selectedOffer,
      personalizationScore: this.calculatePersonalizationScore(context, personalizationElements)
    };
  }

  /**
   * Analyze email content for intent, sentiment, and key topics
   */
  private analyzeEmailContent(content: string): any {
    const lowerContent = content.toLowerCase();
    
    // Simple keyword-based analysis (can be enhanced with actual AI/NLP)
    const analysis = {
      intent: 'inquiry',
      sentiment: 'neutral',
      topics: [] as string[],
      urgency: 'normal',
      businessContext: [] as string[]
    };

    // Intent detection
    if (lowerContent.includes('interested') || lowerContent.includes('learn more')) {
      analysis.intent = 'interested';
    } else if (lowerContent.includes('not interested') || lowerContent.includes('remove')) {
      analysis.intent = 'unsubscribe';
    } else if (lowerContent.includes('meeting') || lowerContent.includes('call') || lowerContent.includes('demo')) {
      analysis.intent = 'meeting_request';
    } else if (lowerContent.includes('price') || lowerContent.includes('cost') || lowerContent.includes('budget')) {
      analysis.intent = 'pricing_inquiry';
    }

    // Sentiment detection
    if (lowerContent.includes('excited') || lowerContent.includes('great') || lowerContent.includes('perfect')) {
      analysis.sentiment = 'positive';
    } else if (lowerContent.includes('concerned') || lowerContent.includes('issue') || lowerContent.includes('problem')) {
      analysis.sentiment = 'negative';
    }

    // Business context extraction
    const businessKeywords = ['revenue', 'growth', 'efficiency', 'automation', 'scale', 'team', 'process', 'roi', 'productivity'];
    analysis.businessContext = businessKeywords.filter(keyword => lowerContent.includes(keyword));

    // Urgency detection
    if (lowerContent.includes('urgent') || lowerContent.includes('asap') || lowerContent.includes('immediately')) {
      analysis.urgency = 'high';
    }

    return analysis;
  }

  /**
   * Select the most relevant offer based on persona and email analysis
   */
  private selectBestOffer(offers: any[], persona: any, emailAnalysis: any): any {
    if (!offers || offers.length === 0) return null;

    let bestOffer = offers[0];
    let bestScore = 0;

    for (const offer of offers) {
      let score = 0;

      // Score based on persona pain points alignment
      const offerText = `${offer.value_proposition} ${offer.hook_snippet}`.toLowerCase();
      persona.pain_points.forEach((painPoint: string) => {
        if (offerText.includes(painPoint.toLowerCase())) {
          score += 3;
        }
      });

      // Score based on persona messaging hooks alignment
      persona.messaging_hooks.forEach((hook: string) => {
        if (offerText.includes(hook.toLowerCase())) {
          score += 2;
        }
      });

      // Score based on email business context
      emailAnalysis.businessContext.forEach((context: string) => {
        if (offerText.includes(context)) {
          score += 2;
        }
      });

      // Bonus for intent matching
      if (emailAnalysis.intent === 'pricing_inquiry' && offerText.includes('roi')) {
        score += 3;
      }
      if (emailAnalysis.intent === 'meeting_request' && offer.call_to_action.toLowerCase().includes('demo')) {
        score += 3;
      }

      if (score > bestScore) {
        bestScore = score;
        bestOffer = offer;
      }
    }

    console.log(`📊 Selected offer: ${bestOffer.name} (score: ${bestScore})`);
    return bestOffer;
  }

  /**
   * Generate personalized hooks, triggers, and angles
   */
  private generatePersonalizationElements(context: PersonalizationContext, selectedOffer: any, emailAnalysis: any) {
    const { lead, persona } = context;

    // Generate personalized hooks
    const hooks = this.generateHooks(lead, persona, selectedOffer, emailAnalysis);
    
    // Generate triggers (emotional/logical motivators)
    const triggers = this.generateTriggers(lead, persona, selectedOffer, emailAnalysis);
    
    // Generate angles (unique approaches/perspectives)
    const angles = this.generateAngles(lead, persona, selectedOffer, emailAnalysis);

    return { hooks, triggers, angles };
  }

  /**
   * Generate personalized hooks
   */
  private generateHooks(lead: any, persona: any, offer: any, emailAnalysis: any): string[] {
    const hooks: string[] = [];

    // Industry-specific hooks
    if (lead.industry) {
      hooks.push(`${lead.industry} companies like ${lead.company} typically see ${offer?.value_proposition || 'significant improvements'}`);
    }

    // Role-specific hooks
    if (lead.job_title) {
      const relevantPainPoints = persona.pain_points.slice(0, 2);
      hooks.push(`As a ${lead.job_title}, you're probably dealing with ${relevantPainPoints.join(' and ')}`);
    }

    // Persona messaging hooks with personalization
    persona.messaging_hooks.forEach((hook: string) => {
      hooks.push(`${lead.first_name}, ${hook.toLowerCase()} - especially for ${lead.company}`);
    });

    // Offer-specific hooks
    if (offer?.hook_snippet) {
      hooks.push(`${offer.hook_snippet} - perfect for ${lead.job_title}s in ${lead.industry}`);
    }

    // Intent-based hooks
    if (emailAnalysis.intent === 'interested') {
      hooks.push(`Since you're interested, let me show you exactly how ${lead.company} could benefit`);
    }

    return hooks.slice(0, 3); // Return top 3 hooks
  }

  /**
   * Generate emotional and logical triggers
   */
  private generateTriggers(lead: any, persona: any, offer: any, emailAnalysis: any): string[] {
    const triggers: string[] = [];

    // Pain point triggers
    persona.pain_points.forEach((painPoint: string) => {
      triggers.push(`Eliminate ${painPoint.toLowerCase()} that's costing ${lead.company} time and money`);
    });

    // Urgency triggers
    if (emailAnalysis.urgency === 'high') {
      triggers.push(`Quick implementation - see results within 30 days`);
    }

    // Social proof triggers
    triggers.push(`Other ${lead.industry} leaders have already made this switch`);
    
    // FOMO triggers
    triggers.push(`Don't let competitors gain the advantage while ${lead.company} falls behind`);

    // ROI triggers
    if (offer?.value_proposition) {
      triggers.push(`${offer.value_proposition} - measurable ROI for ${lead.company}`);
    }

    return triggers.slice(0, 3);
  }

  /**
   * Generate unique angles and perspectives
   */
  private generateAngles(lead: any, persona: any, offer: any, emailAnalysis: any): string[] {
    const angles: string[] = [];

    // Industry angle
    angles.push(`The ${lead.industry} industry is rapidly evolving - here's how to stay ahead`);

    // Role-specific angle
    angles.push(`From one ${lead.job_title} to another - here's what's working`);

    // Company size angle
    angles.push(`Tailored specifically for companies like ${lead.company}`);

    // Problem-solution angle
    if (persona.pain_points.length > 0) {
      angles.push(`Turn your biggest challenge (${persona.pain_points[0]}) into your competitive advantage`);
    }

    // Future-focused angle
    angles.push(`Where ${lead.company} could be in 6 months with the right solution`);

    return angles.slice(0, 3);
  }

  /**
   * Craft the personalized email using AI-style generation
   */
  private async craftPersonalizedEmail(context: PersonalizationContext, selectedOffer: any, elements: any): Promise<{ subject: string; body: string }> {
    const { lead, persona } = context;
    
    // Generate personalized subject line
    const subject = this.generateSubject(lead, selectedOffer, elements);
    
    // Generate email body with persona tone
    const body = this.generateEmailBody(lead, persona, selectedOffer, elements);

    return { subject, body };
  }

  /**
   * Generate personalized subject line
   */
  private generateSubject(lead: any, offer: any, elements: any): string {
    const subjects = [
      `${lead.first_name}, quick question about ${lead.company}'s ${elements.triggers[0]?.split(' ')[1] || 'growth'}`,
      `Re: ${offer?.name || 'Your inquiry'} - ${lead.company} specific solution`,
      `${lead.first_name}, this could save ${lead.company} significant time`,
      `Quick follow-up for ${lead.first_name} at ${lead.company}`,
      `${lead.company} + ${offer?.name || 'our solution'} = perfect match?`
    ];

    return subjects[Math.floor(Math.random() * subjects.length)];
  }

  /**
   * Generate personalized email body
   */
  private generateEmailBody(lead: any, persona: any, offer: any, elements: any): string {
    const tone = persona.tone || 'professional';
    const greeting = this.getGreeting(tone);
    const closing = this.getClosing(tone);

    return `${greeting} ${lead.first_name},

${elements.hooks[0]}

${elements.angles[0]}

${offer?.value_proposition || 'Our solution can help you achieve your goals.'} Specifically for ${lead.company}, this means:

• ${elements.triggers[0]}
• ${elements.triggers[1] || 'Streamlined operations and improved efficiency'}
• ${elements.triggers[2] || 'Measurable ROI within the first quarter'}

${elements.angles[1]}

${offer?.call_to_action || 'Would you be open to a brief 15-minute conversation to explore this further?'}

${closing}

P.S. ${elements.hooks[1] || `I've helped other ${lead.industry} companies achieve similar results - happy to share specific examples.`}`;
  }

  /**
   * Get greeting based on persona tone
   */
  private getGreeting(tone: string): string {
    const greetings = {
      professional: 'Hi',
      casual: 'Hey',
      technical: 'Hello',
      friendly: 'Hi there',
      formal: 'Dear'
    };
    return greetings[tone as keyof typeof greetings] || 'Hi';
  }

  /**
   * Get closing based on persona tone
   */
  private getClosing(tone: string): string {
    const closings = {
      professional: 'Best regards',
      casual: 'Cheers',
      technical: 'Best',
      friendly: 'Thanks',
      formal: 'Sincerely'
    };
    return closings[tone as keyof typeof closings] || 'Best regards';
  }

  /**
   * Calculate personalization score
   */
  private calculatePersonalizationScore(context: PersonalizationContext, elements: any): number {
    let score = 0;
    
    // Base score for having persona data
    score += 20;
    
    // Score for persona alignment
    if (elements.hooks.length > 0) score += 25;
    if (elements.triggers.length > 0) score += 25;
    if (elements.angles.length > 0) score += 20;
    
    // Score for offer alignment
    if (context.offers.length > 0) score += 10;
    
    return Math.min(score, 100);
  }
}

export const aiPersonalizationService = new AIPersonalizationService();
