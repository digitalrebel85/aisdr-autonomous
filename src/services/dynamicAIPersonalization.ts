// Dynamic AI Personalization Service
// Generates unique pain points, hooks, and angles for each email without requiring personas

interface LeadContext {
  id: string;
  first_name?: string;
  last_name?: string;
  job_title?: string;
  company?: string;
  industry?: string;
  company_size?: number;
  email_content?: string; // Their original email
  linkedin_data?: any;
}

interface OfferContext {
  id: string;
  name: string;
  value_proposition: string;
  call_to_action: string;
  hook_snippet: string;
}

interface EmailContext {
  subject?: string;
  originalContent: string;
  sentiment?: string;
  intent?: string;
}

interface DynamicPersonalization {
  painPoints: string[];
  personalizationHooks: string[];
  messageAngles: string[];
  emotionalTriggers: string[];
  logicalTriggers: string[];
  socialProofElements: string[];
  urgencyFactors: string[];
  selectedOffer?: OfferContext;
  personalizationScore: number;
  generatedEmail: {
    subject: string;
    body: string;
  };
}

export class DynamicAIPersonalizationService {

  /**
   * Generate completely dynamic personalization without personas
   */
  async generateDynamicPersonalization(
    lead: LeadContext, 
    offers: OfferContext[], 
    emailContext: EmailContext
  ): Promise<DynamicPersonalization> {
    
    console.log(`🧠 Generating dynamic AI personalization for ${lead.first_name} at ${lead.company}`);

    // 1. AI-Generated Pain Points based on role and industry
    const painPoints = this.generateAIPainPoints(lead);
    
    // 2. Dynamic Personalization Hooks
    const personalizationHooks = this.generatePersonalizationHooks(lead, emailContext);
    
    // 3. Unique Message Angles
    const messageAngles = this.generateUniqueMessageAngles(lead, emailContext);
    
    // 4. Emotional & Logical Triggers
    const emotionalTriggers = this.generateEmotionalTriggers(lead, painPoints);
    const logicalTriggers = this.generateLogicalTriggers(lead, painPoints);
    
    // 5. Social Proof Elements
    const socialProofElements = this.generateSocialProof(lead);
    
    // 6. Urgency Factors
    const urgencyFactors = this.generateUrgencyFactors(lead, emailContext);
    
    // 7. Select Best Offer
    const selectedOffer = this.selectBestOfferDynamic(offers, lead, painPoints, emailContext);
    
    // 8. Generate Complete Email
    const generatedEmail = this.generateCompleteEmail(
      lead, 
      selectedOffer, 
      {
        painPoints,
        personalizationHooks,
        messageAngles,
        emotionalTriggers,
        logicalTriggers,
        socialProofElements,
        urgencyFactors
      }
    );

    const personalizationScore = this.calculateDynamicScore({
      painPoints,
      personalizationHooks,
      messageAngles,
      emotionalTriggers,
      logicalTriggers,
      selectedOffer
    });

    return {
      painPoints,
      personalizationHooks,
      messageAngles,
      emotionalTriggers,
      logicalTriggers,
      socialProofElements,
      urgencyFactors,
      selectedOffer,
      personalizationScore,
      generatedEmail
    };
  }

  /**
   * AI-Generated Pain Points based on job title and industry
   */
  private generateAIPainPoints(lead: LeadContext): string[] {
    const painPointDatabase = {
      // Executive Level
      'ceo': ['Revenue growth stagnation', 'Market competition pressure', 'Operational inefficiencies', 'Team productivity gaps'],
      'cto': ['Technical debt accumulation', 'Scalability challenges', 'Security vulnerabilities', 'Development bottlenecks'],
      'cfo': ['Budget optimization pressure', 'ROI measurement difficulties', 'Cost control challenges', 'Financial reporting inefficiencies'],
      
      // Sales & Marketing
      'sales director': ['Lead quality issues', 'Conversion rate decline', 'Sales cycle length', 'Team quota achievement'],
      'vp of sales': ['Pipeline predictability', 'Sales process optimization', 'Team performance management', 'Revenue forecasting accuracy'],
      'marketing director': ['Lead generation costs', 'Attribution tracking', 'Campaign ROI measurement', 'Brand awareness challenges'],
      
      // Operations
      'operations manager': ['Process inefficiencies', 'Resource allocation', 'Quality control issues', 'Workflow bottlenecks'],
      'hr director': ['Talent acquisition costs', 'Employee retention', 'Performance management', 'Compliance challenges'],
      
      // Industry-specific
      'saas': ['Customer churn', 'User onboarding friction', 'Feature adoption rates', 'Subscription revenue optimization'],
      'technology': ['Innovation speed', 'Technical talent shortage', 'Legacy system modernization', 'Cybersecurity threats'],
      'manufacturing': ['Supply chain disruptions', 'Production efficiency', 'Quality assurance', 'Equipment maintenance'],
      'healthcare': ['Patient experience', 'Regulatory compliance', 'Cost management', 'Technology adoption'],
      'financial services': ['Regulatory compliance', 'Digital transformation', 'Customer acquisition costs', 'Risk management']
    };

    const painPoints: string[] = [];
    
    // Role-based pain points
    if (lead.job_title) {
      const roleKey = lead.job_title.toLowerCase();
      for (const [key, points] of Object.entries(painPointDatabase)) {
        if (roleKey.includes(key)) {
          painPoints.push(...points.slice(0, 2));
          break;
        }
      }
    }
    
    // Industry-based pain points
    if (lead.industry) {
      const industryKey = lead.industry.toLowerCase();
      for (const [key, points] of Object.entries(painPointDatabase)) {
        if (industryKey.includes(key)) {
          painPoints.push(...points.slice(0, 2));
          break;
        }
      }
    }
    
    // Company size-based pain points
    if (lead.company_size) {
      if (lead.company_size < 50) {
        painPoints.push('Limited resources for growth', 'Wearing multiple hats inefficiency');
      } else if (lead.company_size > 500) {
        painPoints.push('Communication silos', 'Process standardization challenges');
      }
    }

    // Fallback generic pain points
    if (painPoints.length === 0) {
      painPoints.push('Manual process inefficiencies', 'Time management challenges', 'Resource optimization needs');
    }

    return [...new Set(painPoints)].slice(0, 4); // Remove duplicates, max 4
  }

  /**
   * Generate dynamic personalization hooks for each email
   */
  private generatePersonalizationHooks(lead: LeadContext, emailContext: EmailContext): string[] {
    const hooks: string[] = [];

    // Name + Company personalization
    hooks.push(`${lead.first_name}, I noticed ${lead.company} is in the ${lead.industry} space`);
    
    // Role-specific hooks
    if (lead.job_title) {
      hooks.push(`As a ${lead.job_title}, you're probably focused on driving results for ${lead.company}`);
      hooks.push(`Most ${lead.job_title}s I work with at ${lead.industry} companies face similar challenges`);
    }

    // Email context hooks
    if (emailContext.intent === 'interested') {
      hooks.push(`Since you expressed interest, let me share something specific to ${lead.company}`);
    } else if (emailContext.intent === 'pricing_inquiry') {
      hooks.push(`${lead.first_name}, regarding your pricing question - here's what makes sense for ${lead.company}`);
    }

    // Industry trend hooks
    const industryTrends = {
      'technology': 'AI adoption is accelerating faster than ever',
      'saas': 'Customer retention is becoming the new growth metric',
      'manufacturing': 'Supply chain resilience is now a competitive advantage',
      'healthcare': 'Patient experience is driving digital transformation',
      'financial services': 'Regulatory changes are reshaping the industry'
    };

    if (lead.industry && industryTrends[lead.industry.toLowerCase() as keyof typeof industryTrends]) {
      hooks.push(`${industryTrends[lead.industry.toLowerCase() as keyof typeof industryTrends]} - especially relevant for ${lead.company}`);
    }

    // Timing-based hooks
    const currentMonth = new Date().getMonth();
    if (currentMonth === 11 || currentMonth === 0) { // Dec/Jan
      hooks.push(`As you're planning for the new year, ${lead.company} could benefit from this`);
    } else if (currentMonth >= 2 && currentMonth <= 4) { // Q1
      hooks.push(`Perfect timing for ${lead.company} to implement this before mid-year`);
    }

    return hooks.slice(0, 3);
  }

  /**
   * Generate unique message angles for each email
   */
  private generateUniqueMessageAngles(lead: LeadContext, emailContext: EmailContext): string[] {
    const angles: string[] = [];

    // Competitive advantage angle
    angles.push(`While your competitors are still figuring this out, ${lead.company} could be ahead of the curve`);

    // Industry evolution angle
    angles.push(`The ${lead.industry} industry is at a tipping point - here's how ${lead.company} can capitalize`);

    // Role empowerment angle
    if (lead.job_title) {
      angles.push(`What if you could be the ${lead.job_title} who transforms how ${lead.company} operates?`);
    }

    // Problem-solution flip angle
    angles.push(`Turn your biggest operational challenge into your competitive differentiator`);

    // Future-state angle
    angles.push(`Imagine ${lead.company} 6 months from now with this solution in place`);

    // Peer success angle
    angles.push(`Other ${lead.industry} leaders are already seeing results - here's their playbook`);

    // Risk mitigation angle
    angles.push(`The cost of inaction is higher than the investment - especially for ${lead.company}`);

    return angles.slice(0, 3);
  }

  /**
   * Generate emotional triggers
   */
  private generateEmotionalTriggers(lead: LeadContext, painPoints: string[]): string[] {
    const triggers: string[] = [];

    // Fear of missing out
    triggers.push(`Don't let ${lead.company} fall behind while competitors gain the advantage`);

    // Pride/achievement
    triggers.push(`Be the leader who brought this innovation to ${lead.company}`);

    // Relief from pain
    if (painPoints.length > 0) {
      triggers.push(`Finally eliminate ${painPoints[0].toLowerCase()} that's been holding ${lead.company} back`);
    }

    // Confidence/security
    triggers.push(`Give ${lead.company} the competitive edge it deserves`);

    return triggers.slice(0, 2);
  }

  /**
   * Generate logical triggers
   */
  private generateLogicalTriggers(lead: LeadContext, painPoints: string[]): string[] {
    const triggers: string[] = [];

    // ROI-focused
    triggers.push(`Measurable ROI within 90 days for ${lead.company}`);

    // Efficiency gains
    triggers.push(`Save 15-20 hours per week on manual processes`);

    // Cost reduction
    triggers.push(`Reduce operational costs by 25-40%`);

    // Scalability
    triggers.push(`Scale ${lead.company}'s operations without proportional headcount increase`);

    return triggers.slice(0, 2);
  }

  /**
   * Generate social proof elements
   */
  private generateSocialProof(lead: LeadContext): string[] {
    const proofElements: string[] = [];

    // Industry-specific social proof
    proofElements.push(`Other ${lead.industry} companies have seen 40% improvement in efficiency`);

    // Role-specific social proof
    if (lead.job_title) {
      proofElements.push(`${lead.job_title}s at similar companies report this as their best investment`);
    }

    // Company size social proof
    if (lead.company_size) {
      if (lead.company_size < 100) {
        proofElements.push(`Perfect for growing companies like ${lead.company}`);
      } else {
        proofElements.push(`Proven at enterprise scale - ready for ${lead.company}`);
      }
    }

    return proofElements.slice(0, 2);
  }

  /**
   * Generate urgency factors
   */
  private generateUrgencyFactors(lead: LeadContext, emailContext: EmailContext): string[] {
    const urgencyFactors: string[] = [];

    // Market-based urgency
    urgencyFactors.push(`${lead.industry} market conditions make this more critical than ever`);

    // Competitive urgency
    urgencyFactors.push(`Your competitors are already implementing similar solutions`);

    // Seasonal urgency
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 9) { // Q4
      urgencyFactors.push(`Perfect timing to implement before year-end`);
    }

    // Email context urgency
    if (emailContext.intent === 'interested') {
      urgencyFactors.push(`Strike while the iron is hot - let's move quickly on this`);
    }

    return urgencyFactors.slice(0, 2);
  }

  /**
   * Dynamically select best offer
   */
  private selectBestOfferDynamic(
    offers: OfferContext[], 
    lead: LeadContext, 
    painPoints: string[], 
    emailContext: EmailContext
  ): OfferContext | undefined {
    if (!offers || offers.length === 0) return undefined;

    let bestOffer = offers[0];
    let bestScore = 0;

    for (const offer of offers) {
      let score = 0;
      const offerText = `${offer.value_proposition} ${offer.hook_snippet}`.toLowerCase();

      // Score against generated pain points
      painPoints.forEach(painPoint => {
        if (offerText.includes(painPoint.toLowerCase().split(' ')[0])) {
          score += 3;
        }
      });

      // Score against lead context
      if (lead.industry && offerText.includes(lead.industry.toLowerCase())) {
        score += 2;
      }

      if (lead.job_title && offerText.includes(lead.job_title.toLowerCase().split(' ')[0])) {
        score += 2;
      }

      // Email intent matching
      if (emailContext.intent === 'pricing_inquiry' && offerText.includes('roi')) {
        score += 3;
      }

      if (score > bestScore) {
        bestScore = score;
        bestOffer = offer;
      }
    }

    return bestOffer;
  }

  /**
   * Generate complete personalized email
   */
  private generateCompleteEmail(
    lead: LeadContext, 
    selectedOffer: OfferContext | undefined, 
    elements: any
  ): { subject: string; body: string } {
    
    // Dynamic subject generation
    const subjects = [
      `${lead.first_name}, quick question about ${lead.company}'s ${elements.painPoints[0]?.split(' ')[0] || 'growth'}`,
      `${lead.company} + ${selectedOffer?.name || 'our solution'} = game changer?`,
      `${lead.first_name}, this could transform ${lead.company}'s operations`,
      `Re: ${lead.company}'s competitive advantage`,
      `${lead.first_name}, 15 minutes to discuss ${lead.company}'s future?`
    ];

    const subject = subjects[Math.floor(Math.random() * subjects.length)];

    // Dynamic email body
    const body = `Hi ${lead.first_name},

${elements.personalizationHooks[0]}

${elements.messageAngles[0]}

Based on what I know about ${lead.company}, you're likely dealing with:
• ${elements.painPoints[0]}
• ${elements.painPoints[1] || 'Operational inefficiencies'}

${selectedOffer?.value_proposition || 'Our solution addresses these exact challenges.'} For ${lead.company}, this means:

• ${elements.logicalTriggers[0]}
• ${elements.emotionalTriggers[0]}
• ${elements.socialProofElements[0]}

${elements.messageAngles[1]}

${selectedOffer?.call_to_action || 'Would you be open to a brief conversation about this?'}

Best regards

P.S. ${elements.urgencyFactors[0]} - let's not wait on this.`;

    return { subject, body };
  }

  /**
   * Calculate dynamic personalization score
   */
  private calculateDynamicScore(elements: any): number {
    let score = 0;
    
    if (elements.painPoints.length >= 2) score += 25;
    if (elements.personalizationHooks.length >= 2) score += 25;
    if (elements.messageAngles.length >= 2) score += 20;
    if (elements.emotionalTriggers.length >= 1) score += 10;
    if (elements.logicalTriggers.length >= 1) score += 10;
    if (elements.selectedOffer) score += 10;
    
    return Math.min(score, 100);
  }
}

export const dynamicAIPersonalizationService = new DynamicAIPersonalizationService();
