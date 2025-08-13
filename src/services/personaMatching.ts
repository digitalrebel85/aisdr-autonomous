// Hybrid Persona Matching Service
// Handles exact matching, fuzzy matching, AI suggestions, and fallback logic

interface Lead {
  id: string;
  job_title?: string;
  company?: string;
  industry?: string;
  company_size?: number;
  company_size_text?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

interface Persona {
  id: string;
  name: string;
  title_patterns: string[];
  company_size_min?: number;
  company_size_max?: number;
  company_size_text?: string;
  industries: string[];
  pain_points: string[];
  messaging_hooks: string[];
  tone: string;
  is_default: boolean;
  effectiveness_score: number;
}

interface PersonaMatch {
  persona: Persona;
  confidence: number;
  matchReasons: string[];
  matchType: 'exact' | 'fuzzy' | 'ai_suggested' | 'default';
}

interface MatchingConfig {
  exactMatchThreshold: number;
  fuzzyMatchThreshold: number;
  aiSuggestionThreshold: number;
  requireManualReview: number;
}

export class PersonaMatchingService {
  private config: MatchingConfig = {
    exactMatchThreshold: 0.9,
    fuzzyMatchThreshold: 0.6,
    aiSuggestionThreshold: 0.7,
    requireManualReview: 0.8
  };

  /**
   * Main hybrid matching function
   */
  async assignPersonaToLead(lead: Lead, personas: Persona[]): Promise<PersonaMatch> {
    console.log(`🎯 Starting persona matching for lead: ${lead.first_name} ${lead.last_name}`);

    // Step 1: Try exact matching first
    let match = this.findExactMatch(lead, personas);
    if (match && match.confidence >= this.config.exactMatchThreshold) {
      console.log(`✅ Exact match found: ${match.persona.name} (${match.confidence})`);
      return match;
    }

    // Step 2: Try fuzzy matching with confidence threshold
    match = this.findFuzzyMatch(lead, personas);
    if (match && match.confidence >= this.config.fuzzyMatchThreshold) {
      console.log(`🔍 Fuzzy match found: ${match.persona.name} (${match.confidence})`);
      return match;
    }

    // Step 3: Use AI to suggest or create (placeholder for now)
    match = await this.getAISuggestion(lead, personas);
    if (match && match.confidence >= this.config.aiSuggestionThreshold) {
      console.log(`🤖 AI suggestion: ${match.persona.name} (${match.confidence})`);
      return match;
    }

    // Step 4: Fall back to default persona
    const defaultPersona = personas.find(p => p.is_default);
    if (defaultPersona) {
      console.log(`🔄 Using default persona: ${defaultPersona.name}`);
      return {
        persona: defaultPersona,
        confidence: 0.5,
        matchReasons: ['No specific match found, using default'],
        matchType: 'default'
      };
    }

    throw new Error('No personas available, including default persona');
  }

  /**
   * Exact matching - high confidence matches
   */
  private findExactMatch(lead: Lead, personas: Persona[]): PersonaMatch | null {
    for (const persona of personas) {
      const reasons: string[] = [];
      let score = 0;
      let maxScore = 0;

      // Title matching (40% weight)
      maxScore += 0.4;
      if (lead.job_title && persona.title_patterns.length > 0) {
        const titleMatch = persona.title_patterns.some(pattern => 
          this.exactStringMatch(lead.job_title, pattern)
        );
        if (titleMatch) {
          score += 0.4;
          reasons.push(`Job title "${lead.job_title}" exactly matches persona patterns`);
        }
      }

      // Industry matching (30% weight)
      maxScore += 0.3;
      if (lead.industry && persona.industries.includes(lead.industry)) {
        score += 0.3;
        reasons.push(`Industry "${lead.industry}" matches persona`);
      }

      // Company size matching (30% weight)
      maxScore += 0.3;
      if (this.matchesCompanySize(lead, persona)) {
        score += 0.3;
        reasons.push(`Company size matches persona criteria`);
      }

      const confidence = maxScore > 0 ? score / maxScore : 0;

      if (confidence >= this.config.exactMatchThreshold) {
        return {
          persona,
          confidence,
          matchReasons: reasons,
          matchType: 'exact'
        };
      }
    }

    return null;
  }

  /**
   * Fuzzy matching with similarity scoring
   */
  private findFuzzyMatch(lead: Lead, personas: Persona[]): PersonaMatch | null {
    let bestMatch: PersonaMatch | null = null;

    for (const persona of personas) {
      const reasons: string[] = [];
      let score = 0;
      let maxScore = 0;

      // Fuzzy title matching (40% weight)
      maxScore += 0.4;
      if (lead.job_title && persona.title_patterns.length > 0) {
        const bestTitleMatch = Math.max(...persona.title_patterns.map(pattern => 
          this.stringSimilarity(lead.job_title.toLowerCase(), pattern.toLowerCase())
        ));
        
        if (bestTitleMatch > 0.7) {
          score += 0.4 * bestTitleMatch;
          reasons.push(`Job title "${lead.job_title}" similar to persona patterns (${Math.round(bestTitleMatch * 100)}%)`);
        }
      }

      // Industry matching (30% weight)
      maxScore += 0.3;
      if (lead.industry) {
        const industryMatch = persona.industries.some(industry => 
          this.stringSimilarity(lead.industry.toLowerCase(), industry.toLowerCase()) > 0.8
        );
        if (industryMatch) {
          score += 0.3;
          reasons.push(`Industry "${lead.industry}" closely matches persona`);
        }
      }

      // Company size matching (30% weight)
      maxScore += 0.3;
      if (this.matchesCompanySize(lead, persona)) {
        score += 0.3;
        reasons.push(`Company size matches persona criteria`);
      }

      const confidence = maxScore > 0 ? score / maxScore : 0;

      if (confidence > (bestMatch?.confidence || 0)) {
        bestMatch = {
          persona,
          confidence,
          matchReasons: reasons,
          matchType: 'fuzzy'
        };
      }
    }

    return bestMatch && bestMatch.confidence >= this.config.fuzzyMatchThreshold ? bestMatch : null;
  }

  /**
   * AI suggestion (placeholder - can be enhanced with actual AI service)
   */
  private async getAISuggestion(lead: Lead, personas: Persona[]): Promise<PersonaMatch | null> {
    // For now, return null - this can be enhanced with OpenAI/Claude integration
    // The AI could analyze the lead profile and suggest the best persona or even create a new one
    
    // Placeholder logic: find persona with most similar pain points or messaging
    const leadProfile = `${lead.job_title} at ${lead.company} in ${lead.industry}`;
    
    // Simple keyword-based matching as a starting point
    for (const persona of personas) {
      const keywordMatches = this.countKeywordMatches(leadProfile, [
        ...persona.pain_points,
        ...persona.messaging_hooks,
        ...persona.industries
      ]);
      
      if (keywordMatches > 2) {
        return {
          persona,
          confidence: Math.min(0.8, 0.5 + (keywordMatches * 0.1)),
          matchReasons: [`AI detected ${keywordMatches} relevant keywords in profile`],
          matchType: 'ai_suggested'
        };
      }
    }

    return null;
  }

  /**
   * Check if lead should be queued for manual review
   */
  shouldRequireManualReview(match: PersonaMatch): boolean {
    return match.confidence < this.config.requireManualReview;
  }

  /**
   * Helper functions
   */
  private exactStringMatch(str1: string, str2: string): boolean {
    return str1.toLowerCase().trim() === str2.toLowerCase().trim();
  }

  private stringSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private matchesCompanySize(lead: Lead, persona: Persona): boolean {
    // If persona has specific size ranges
    if (persona.company_size_min && persona.company_size_max && lead.company_size) {
      return lead.company_size >= persona.company_size_min && 
             lead.company_size <= persona.company_size_max;
    }

    // If persona has text-based size and lead has text
    if (persona.company_size_text && lead.company_size_text) {
      return this.stringSimilarity(
        persona.company_size_text.toLowerCase(),
        lead.company_size_text.toLowerCase()
      ) > 0.8;
    }

    // If no specific size criteria, consider it a match
    return true;
  }

  private countKeywordMatches(text: string, keywords: string[]): number {
    const lowerText = text.toLowerCase();
    return keywords.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    ).length;
  }

  /**
   * Update persona effectiveness based on outcomes
   */
  async updatePersonaEffectiveness(
    personaId: string, 
    outcome: 'positive' | 'negative' | 'neutral',
    interactionType: string
  ): Promise<void> {
    // This would update the persona_effectiveness table
    // and recalculate the persona's overall effectiveness_score
    console.log(`📊 Updating persona ${personaId} effectiveness: ${outcome} for ${interactionType}`);
  }

  /**
   * Create new persona from lead data
   */
  async createPersonaFromLead(lead: Lead, userId: string): Promise<Persona> {
    const newPersona = {
      user_id: userId,
      name: `${lead.job_title} - ${lead.industry}`,
      description: `Auto-generated persona for ${lead.job_title} professionals in ${lead.industry}`,
      title_patterns: [lead.job_title || 'Professional'],
      industries: [lead.industry || 'General Business'],
      company_size_text: lead.company_size_text,
      pain_points: [
        'Operational efficiency challenges',
        'Resource optimization needs',
        'Growth and scaling concerns'
      ],
      messaging_hooks: [
        'Improve operational efficiency',
        'Optimize resource utilization',
        'Scale operations effectively'
      ],
      tone: 'professional',
      is_default: false
    };

    console.log(`🆕 Creating new persona: ${newPersona.name}`);
    return newPersona as Persona;
  }
}

export const personaMatchingService = new PersonaMatchingService();
