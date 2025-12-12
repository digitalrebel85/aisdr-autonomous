'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  Target, 
  MessageSquare, 
  Sparkles, 
  Users, 
  Rocket,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Plus,
  Building2,
  Mail,
  Zap,
  Brain,
  ArrowRight,
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ICPProfile {
  id: number;
  name: string;
  description: string;
  industry?: string;
  company_size?: string;
  job_titles?: string[];
  pain_points?: string[];
}

interface Offer {
  id: number;
  name: string;
  description: string;
  value_proposition: string;
  call_to_action: string;
  hook_snippet?: string;
}

interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  title: string;
  icp_score?: number;
}

interface AIStrategy {
  framework: {
    name: string;
    description: string;
    reasoning: string;
  };
  sequence: {
    total_touches: number;
    cadence: string;
    reasoning: string;
  };
  insights: {
    painPoints?: string[];
    valuePropositions?: string[];
    proofPoints?: string[];
    leadMagnets?: string[];
    competitiveInsights?: {
      commonAlternatives?: string[];
      differentiators?: string[];
    };
    triggerEvents?: string[];
    bestPractices?: string[];
    messagingHooks?: string[];
  };
}

interface GeneratedEmail {
  step: number;
  subject: string;
  body: string;
}

interface LeadSequence {
  lead: Lead;
  emails: GeneratedEmail[];
  isGenerating: boolean;
  error?: string;
}

interface WizardState {
  // Step 1: Target
  selectedICP: ICPProfile | null;
  customObjective: string;
  
  // Step 2: Offer
  selectedOffer: Offer | null;
  
  // Step 3: Strategy (AI-generated)
  aiStrategy: AIStrategy | null;
  isGeneratingStrategy: boolean;
  
  // Step 4: Leads
  selectedLeads: Lead[];
  
  // Step 5: Preview sequences
  leadSequences: LeadSequence[];
  isGeneratingSequences: boolean;
  
  // Step 6: Campaign details
  campaignName: string;
}

// ============================================================================
// WIZARD STEPS CONFIG
// ============================================================================

const STEPS = [
  { id: 1, name: 'Target', icon: Target, description: 'Who are you reaching?' },
  { id: 2, name: 'Offer', icon: MessageSquare, description: 'What are you offering?' },
  { id: 3, name: 'Strategy', icon: Sparkles, description: 'AI builds your approach' },
  { id: 4, name: 'Leads', icon: Users, description: 'Select your audience' },
  { id: 5, name: 'Preview', icon: Mail, description: 'Review email sequences' },
  { id: 6, name: 'Launch', icon: Rocket, description: 'Confirm and go live' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CampaignWizard() {
  const router = useRouter();
  const supabase = createClient();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);
  
  // Data from API
  const [icpProfiles, setIcpProfiles] = useState<ICPProfile[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  
  // Wizard state
  const [state, setState] = useState<WizardState>({
    selectedICP: null,
    customObjective: '',
    selectedOffer: null,
    aiStrategy: null,
    isGeneratingStrategy: false,
    selectedLeads: [],
    leadSequences: [],
    isGeneratingSequences: false,
    campaignName: '',
  });

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [icpRes, offersRes, leadsRes] = await Promise.all([
        fetch('/api/icp'),
        fetch('/api/offers'),
        fetch('/api/leads'),
      ]);

      const [icpData, offersData, leadsData] = await Promise.all([
        icpRes.json(),
        offersRes.json(),
        leadsRes.json(),
      ]);

      setIcpProfiles(icpData.profiles || []);
      setOffers(offersData.offers || []);
      setLeads(leadsData.leads || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error refreshing leads:', error);
    }
  };

  // ============================================================================
  // AI STRATEGY GENERATION
  // ============================================================================

  const generateAIStrategy = async () => {
    if (!state.selectedICP || !state.selectedOffer) return;

    setState(prev => ({ ...prev, isGeneratingStrategy: true }));

    try {
      const response = await fetch('/api/campaigns/ai-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objective: state.customObjective || 'Book qualified meetings',
          icp_profile_id: state.selectedICP.id,
          offer: state.selectedOffer,
          campaign_name: state.campaignName || 'New Campaign',
        }),
      });

      const data = await response.json();
      
      if (data.success && data.recommendations) {
        setState(prev => ({
          ...prev,
          aiStrategy: data.recommendations,
          isGeneratingStrategy: false,
        }));
      } else {
        // Fallback strategy if AI fails
        setState(prev => ({
          ...prev,
          aiStrategy: {
            framework: {
              name: 'Value-First Outreach',
              description: 'Lead with value, build trust, then pitch',
              reasoning: 'Based on your ICP and offer, a value-first approach will resonate best.',
            },
            sequence: {
              total_touches: 5,
              cadence: '3-day intervals',
              reasoning: 'Optimal for B2B decision makers with busy schedules.',
            },
            insights: {
              painPoints: ['Inefficient processes costing time and money', 'Difficulty scaling operations'],
              valuePropositions: ['Streamline operations and boost efficiency', 'Scale confidently with automated workflows'],
              bestPractices: ['Personalize first line with specific company insight', 'Keep emails under 150 words'],
            },
          },
          isGeneratingStrategy: false,
        }));
      }
    } catch (error) {
      console.error('Error generating strategy:', error);
      setState(prev => ({ ...prev, isGeneratingStrategy: false }));
    }
  };

  // Auto-generate strategy when entering step 3
  useEffect(() => {
    if (currentStep === 3 && !state.aiStrategy && !state.isGeneratingStrategy) {
      generateAIStrategy();
    }
  }, [currentStep]);

  // ============================================================================
  // SEQUENCE GENERATION (Step 5)
  // ============================================================================

  const generateSequencesForLeads = async () => {
    if (state.selectedLeads.length === 0 || !state.selectedOffer || !state.aiStrategy) return;

    setState(prev => ({ ...prev, isGeneratingSequences: true }));

    const sequences: LeadSequence[] = state.selectedLeads.map(lead => ({
      lead,
      emails: [],
      isGenerating: true
    }));

    setState(prev => ({ ...prev, leadSequences: sequences }));

    // Generate emails for each lead (in parallel, max 3 at a time)
    const numSteps = state.aiStrategy.sequence.total_touches || 3;
    
    for (let i = 0; i < state.selectedLeads.length; i++) {
      const lead = state.selectedLeads[i];
      const emails: GeneratedEmail[] = [];

      try {
        // Generate each email in the sequence
        for (let step = 1; step <= numSteps; step++) {
          try {
            const response = await fetch('/api/outreach/generate-draft', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                // Lead info
                first_name: lead.first_name,
                last_name: lead.last_name,
                name: `${lead.first_name} ${lead.last_name}`,
                email: lead.email,
                company: lead.company,
                title: lead.title || '',
                
                // Offer & messaging
                offer: state.selectedOffer?.value_proposition || state.selectedOffer?.name || '',
                hook_snippet: state.selectedOffer?.hook_snippet || '',
                // Prefer lead-specific pain points, fall back to ICP pain points
                pain_points: (() => {
                  // Check for lead-specific pain points first
                  const leadPainPoints = (lead as any).pain_points;
                  if (leadPainPoints && Array.isArray(leadPainPoints) && leadPainPoints.length > 0) {
                    return leadPainPoints.join(', ');
                  }
                  // Fall back to ICP pain points
                  if (Array.isArray(state.selectedICP?.pain_points)) {
                    return state.selectedICP.pain_points.join(', ');
                  }
                  return state.selectedICP?.pain_points || '';
                })(),
                
                // Sequence context - CRITICAL for unique emails per step
                step_number: step,
                total_steps: numSteps,
                objective: state.customObjective || 'meetings',
                framework: state.aiStrategy?.framework.name || ''
              })
            });

            if (response.ok) {
              const data = await response.json();
              emails.push({
                step,
                subject: data.subject || data.subject_line || `Follow-up ${step}`,
                body: data.body || data.email_body || ''
              });
            } else {
              throw new Error('API failed');
            }
          } catch (err) {
            // Generate sequence-aware fallback emails based on objective
            const offerName = state.selectedOffer?.name || 'our solution';
            const valueProps = state.selectedOffer?.value_proposition || '';
            const cta = state.selectedOffer?.call_to_action || 'book a call';
            // Prefer lead-specific pain points, fall back to ICP
            const leadPainPoints = (lead as any).pain_points;
            const painPoints = (leadPainPoints && Array.isArray(leadPainPoints) && leadPainPoints.length > 0)
              ? leadPainPoints
              : (state.selectedICP?.pain_points || []);
            const painPoint = painPoints[0] || 'scaling efficiently';
            const painPoint2 = painPoints[1] || 'maximizing ROI';
            const objective = state.customObjective || 'meetings';
            const framework = state.aiStrategy?.framework.name || 'AIDA';
            const proofPoints = state.aiStrategy?.insights?.proofPoints || [];
            const proof = proofPoints[0] || 'companies like yours have seen significant results';
            
            // Pattern interrupts to rotate for variety
            const patternInterrupts = [
              'Quick one:',
              'This might be left-field, but...',
              'Not sure if this is relevant — tell me if it\'s not.',
              'Might be off-base here, but...',
              ''
            ];
            const interrupt = patternInterrupts[step % patternInterrupts.length];
            
            // Elite-level sequences with mental shifts, value drops, and conversational CTAs
            const sequencesByObjective: { [key: string]: { [step: number]: { subject: string; body: string } } } = {
              meetings: {
                // Touch 1: Pattern Interrupt + Pain + Unique Insight
                1: {
                  subject: `${lead.first_name}, quick question`,
                  body: `Hi ${lead.first_name},

${interrupt ? interrupt + '\n\n' : ''}Most ${lead.title ? lead.title + 's' : 'leaders'} I talk to think ${painPoint} is just part of the job. But the data tells a different story.

The companies winning right now aren't working harder on this — they're approaching it completely differently.

I put together a quick breakdown of what's actually working. Want me to send it over?

Best,
[Your name]`
                },
                // Touch 2: Soft Proof + Micro-Value Drop (earn trust with ONE actionable takeaway)
                2: {
                  subject: `Re: Quick question`,
                  body: `Hi ${lead.first_name},

Following up with something useful (not just another "checking in" email).

Here's one thing that's working for companies like ${lead.company} right now:

${proof}

The key insight: ${valueProps}

If this resonates, I can share the full breakdown. If not, no worries at all.

Worth a deeper look?

Best,
[Your name]`
                },
                // Touch 3: Direct Ask + Value Incentive
                3: {
                  subject: `For ${lead.first_name} - 15 min?`,
                  body: `Hi ${lead.first_name},

I'll keep this short.

If you're open to a quick call, I'll send you our ${offerName} playbook beforehand — so even if we never talk again, you walk away with something useful.

15 minutes, no pitch. Just want to see if there's a fit.

Here's my calendar: [calendar link]

If timing's off, just say the word.

Best,
[Your name]`
                },
                // Touch 4: Breakup with Fork in the Road
                4: {
                  subject: `Close your file?`,
                  body: `Hi ${lead.first_name},

I've reached out a few times and haven't heard back — totally get it, you're busy.

I don't want to keep cluttering your inbox, so just let me know:

→ Should I close your file?
→ Or would you prefer the 30-second breakdown instead?

Either way works. Just reply with "close" or "send it" and I'll take it from there.

Best,
[Your name]`
                }
              },
              demos: {
                // Touch 1: Visual Hook + Problem Framing
                1: {
                  subject: `${lead.first_name}, can I show you in 12 seconds?`,
                  body: `Hi ${lead.first_name},

Most ${lead.title ? lead.title + 's' : 'teams'} I talk to are stuck on ${painPoint}. It's frustrating because the solutions out there either don't work or take forever to implement.

I recorded a 12-second clip showing how ${offerName} handles this differently.

Want me to send it over? (Genuinely just 12 seconds — I timed it.)

Best,
[Your name]`
                },
                // Touch 2: Social Proof Story + Micro-Demo
                2: {
                  subject: `Re: 12-second demo`,
                  body: `Hi ${lead.first_name},

Quick follow-up with a real example.

A company similar to ${lead.company} was dealing with the same ${painPoint} challenge. Here's what changed:

${proof}

I can show you exactly how they set this up — takes about 15 minutes.

Worth a look?

Best,
[Your name]`
                },
                // Touch 3: FOMO Demo (personalization, not pressure)
                3: {
                  subject: `Want to see this on YOUR data?`,
                  body: `Hi ${lead.first_name},

Last note on this.

Instead of a generic demo, I can actually show you how ${offerName} would work with ${lead.company}'s specific setup.

It's way more useful than slides — you'll see exactly what the output looks like for your situation.

Interested? Just reply "show me" and I'll set it up.

Best,
[Your name]`
                }
              },
              trials: {
                // Touch 1: Risk Reversal + Desired Outcome
                1: {
                  subject: `Try it without changing anything`,
                  body: `Hi ${lead.first_name},

What if you could test ${offerName} without touching your current systems?

It runs in parallel — no migration, no risk, no commitment. You just see the results side-by-side.

${valueProps}

Most teams get their first win within 24 hours.

Want me to set up a sandbox for ${lead.company}?

Best,
[Your name]`
                },
                // Touch 2: Quickstart + 1-Minute Success Path
                2: {
                  subject: `Your first win in 60 seconds`,
                  body: `Hi ${lead.first_name},

Following up on the trial offer.

Here's exactly how to get your first result:

1. Click the link (30 seconds)
2. Connect your data source (15 seconds)
3. See your first output (15 seconds)

That's it. No credit card, no sales call required.

Most people are surprised how fast it works. Want the link?

Best,
[Your name]`
                },
                // Touch 3: Trial Expiring + Soft CTA with Micro-Commitment
                3: {
                  subject: `15-second video for ${lead.first_name}`,
                  body: `Hi ${lead.first_name},

Last note on the trial.

I made a 15-second video showing exactly what ${lead.company} would see on day one.

If you're even slightly curious about solving ${painPoint}, this is the lowest-friction way to find out.

Reply "send it" and I'll share the video + trial link.

No pressure either way.

Best,
[Your name]`
                }
              },
              sales: {
                // Touch 1: Insight Reframe (challenge conventional thinking)
                1: {
                  subject: `${lead.first_name}, everyone thinks this...`,
                  body: `Hi ${lead.first_name},

Most ${lead.title ? lead.title + 's' : 'leaders'} think the answer to ${painPoint} is to work harder or hire more people.

But the data shows something different: the companies pulling ahead are doing less, not more. They've just changed their approach.

Curious if you've seen this at ${lead.company}?

Best,
[Your name]`
                },
                // Touch 2: Solution + Differentiator (why you vs alternatives)
                2: {
                  subject: `Re: What's different about this`,
                  body: `Hi ${lead.first_name},

Following up on my last note.

You've probably seen a dozen tools that claim to solve ${painPoint}. Here's what makes ${offerName} different:

${valueProps}

Unlike other solutions, we focus on ${painPoint2} — which is usually where things break down.

Worth a quick conversation to see if it fits?

Best,
[Your name]`
                },
                // Touch 3: Before/After Transformation Narrative
                3: {
                  subject: `What changed in 14 days`,
                  body: `Hi ${lead.first_name},

Quick story that might be relevant.

A company like ${lead.company} came to us struggling with ${painPoint}. They'd tried other solutions but kept hitting the same walls.

14 days after implementing ${offerName}:

${proof}

The shift wasn't about working harder — it was about working differently.

Want me to share how they did it?

Best,
[Your name]`
                },
                // Touch 4: Special Offer + Real Deadline
                4: {
                  subject: `Holding this for ${lead.company}`,
                  body: `Hi ${lead.first_name},

I've reached out a few times, and I want to make this easy.

For companies that move forward this week, we're offering:

${valueProps}

I can hold a spot for ${lead.company} until Friday. After that, I'll assume the timing isn't right.

Interested? Just reply and I'll send the details.

Best,
[Your name]`
                },
                // Touch 5: Breakup Fork (easy opt-out + curiosity hook)
                5: {
                  subject: `Close your file or send the short version?`,
                  body: `Hi ${lead.first_name},

I've sent a few notes and haven't heard back — no worries, I know you're busy.

I don't want to keep filling your inbox, so just let me know:

→ Reply "close" and I'll close your file
→ Reply "short version" and I'll send a 30-second breakdown

Either way, I'll respect your time.

Best,
[Your name]`
                }
              }
            };
            
            const sequenceEmails = sequencesByObjective[objective] || sequencesByObjective.meetings;
            const fallback = sequenceEmails[step] || sequenceEmails[Object.keys(sequenceEmails).length];
            
            emails.push({
              step,
              subject: fallback.subject,
              body: fallback.body
            });
          }
        }

        // Update this lead's sequence
        setState(prev => ({
          ...prev,
          leadSequences: prev.leadSequences.map((seq, idx) => 
            idx === i ? { ...seq, emails, isGenerating: false } : seq
          )
        }));

      } catch (error) {
        console.error(`Error generating sequence for ${lead.email}:`, error);
        setState(prev => ({
          ...prev,
          leadSequences: prev.leadSequences.map((seq, idx) => 
            idx === i ? { ...seq, isGenerating: false, error: 'Failed to generate' } : seq
          )
        }));
      }
    }

    setState(prev => ({ ...prev, isGeneratingSequences: false }));
  };

  // Auto-generate sequences when entering step 5
  useEffect(() => {
    if (currentStep === 5 && state.leadSequences.length === 0 && !state.isGeneratingSequences) {
      generateSequencesForLeads();
    }
  }, [currentStep]);

  // ============================================================================
  // CAMPAIGN LAUNCH
  // ============================================================================

  const launchCampaign = async () => {
    if (state.selectedLeads.length === 0) {
      alert('Please select at least one lead');
      return;
    }

    setIsLaunching(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's connected inbox for sending
      const { data: inboxes, error: inboxError } = await supabase
        .from('connected_inboxes')
        .select('id, grant_id, email_address, access_token')
        .eq('user_id', user.id)
        .limit(1);

      if (inboxError) {
        console.error('Error fetching inboxes:', inboxError);
      }

      const inbox = inboxes?.find(i => i.access_token); // Find one with valid token
      if (!inbox) {
        throw new Error('No connected inbox found. Please connect an email inbox in Settings first.');
      }

      // Validate offer is selected
      if (!state.selectedOffer?.id) {
        throw new Error('Please select an offer before launching the campaign.');
      }

      // Create the campaign
      const campaignData: Record<string, any> = {
        user_id: user.id,
        name: state.campaignName || `Campaign - ${new Date().toLocaleDateString()}`,
        offer_id: state.selectedOffer.id,
        status: 'active',
        total_leads: state.selectedLeads.length,
        delay_minutes: 5,
        created_at: new Date().toISOString()
      };

      console.log('Creating campaign with data:', campaignData);

      const { data: campaign, error: campaignError } = await supabase
        .from('outreach_campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Add leads to outreach queue with pre-generated email sequences
      const now = new Date();
      const allQueueItems: any[] = [];
      
      // For each lead, create queue items for each email in their sequence
      state.leadSequences.forEach((seq, leadIndex) => {
        seq.emails.forEach((email, emailIndex) => {
          // Schedule emails: first email now, then 1 day, 3 days, 5 days apart
          const dayDelays = [0, 1, 3, 5, 7, 10]; // Days between emails
          const delayDays = dayDelays[emailIndex] || (emailIndex * 2);
          const scheduledTime = new Date(now.getTime() + (leadIndex * 5 * 60 * 1000) + (delayDays * 24 * 60 * 60 * 1000));
          
          allQueueItems.push({
            user_id: user.id,
            campaign_id: campaign.id,
            lead_id: seq.lead.id,
            inbox_id: inbox.id,
            grant_id: inbox.grant_id,
            sender_email: inbox.email_address,
            status: 'queued',
            sequence_step: emailIndex + 1,
            scheduled_at: scheduledTime.toISOString(),
            lead_data: {
              first_name: seq.lead.first_name,
              last_name: seq.lead.last_name,
              email: seq.lead.email,
              company: seq.lead.company,
              title: seq.lead.title
            },
            offer_data: state.selectedOffer ? {
              name: state.selectedOffer.name,
              value_proposition: state.selectedOffer.value_proposition,
              call_to_action: state.selectedOffer.call_to_action
            } : null,
            generated_email: {
              subject: email.subject,
              body: email.body
            }
          });
        });
      });

      const { error: queueError } = await supabase
        .from('outreach_queue')
        .insert(allQueueItems);

      if (queueError) throw queueError;

      // Navigate to campaign detail page
      router.push(`/dashboard/campaigns/${campaign.id}`);

    } catch (error: any) {
      console.error('Error launching campaign:', error);
      const errorMessage = error?.message || error?.details || 'Unknown error';
      alert(`Failed to launch campaign: ${errorMessage}`);
    } finally {
      setIsLaunching(false);
    }
  };

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const canProceed = () => {
    switch (currentStep) {
      case 1: return state.selectedICP !== null && state.customObjective !== '';
      case 2: return state.selectedOffer !== null;
      case 3: return state.aiStrategy !== null;
      case 4: return state.selectedLeads.length > 0;
      case 5: return state.leadSequences.length > 0 && state.leadSequences.every(s => !s.isGenerating);
      case 6: return state.campaignName.trim().length > 0;
      default: return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 6) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Create Campaign</h1>
          <p className="text-slate-400">Set up your AI-powered outreach in minutes</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${isCompleted ? 'bg-green-500 text-white' : 
                        isActive ? 'bg-blue-500 text-white' : 
                        'bg-slate-700 text-slate-400'}
                    `}>
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`mt-2 text-sm font-medium ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                      {step.name}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-24 h-0.5 mx-2 ${currentStep > step.id ? 'bg-green-500' : 'bg-slate-700'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Step 1: Target */}
        {currentStep === 1 && (
          <StepTarget
            icpProfiles={icpProfiles}
            selectedICP={state.selectedICP}
            customObjective={state.customObjective}
            onSelectICP={(icp) => setState(prev => ({ ...prev, selectedICP: icp }))}
            onObjectiveChange={(obj) => setState(prev => ({ ...prev, customObjective: obj }))}
            onICPCreated={(icp) => setIcpProfiles(prev => [icp, ...prev])}
          />
        )}

        {/* Step 2: Offer */}
        {currentStep === 2 && (
          <StepOffer
            offers={offers}
            selectedOffer={state.selectedOffer}
            onSelectOffer={(offer) => setState(prev => ({ ...prev, selectedOffer: offer }))}
            onOfferCreated={(offer) => setOffers(prev => [offer, ...prev])}
          />
        )}

        {/* Step 3: Strategy */}
        {currentStep === 3 && (
          <StepStrategy
            aiStrategy={state.aiStrategy}
            isGenerating={state.isGeneratingStrategy}
            onRegenerate={generateAIStrategy}
          />
        )}

        {/* Step 4: Leads */}
        {currentStep === 4 && (
          <StepLeads
            leads={leads}
            selectedLeads={state.selectedLeads}
            selectedICP={state.selectedICP}
            onToggleLead={(lead) => {
              setState(prev => {
                const isSelected = prev.selectedLeads.some(l => l.id === lead.id);
                return {
                  ...prev,
                  selectedLeads: isSelected
                    ? prev.selectedLeads.filter(l => l.id !== lead.id)
                    : [...prev.selectedLeads, lead],
                };
              });
            }}
            onSelectAll={() => setState(prev => ({ ...prev, selectedLeads: leads }))}
            onDeselectAll={() => setState(prev => ({ ...prev, selectedLeads: [] }))}
            onLeadsAdded={refreshLeads}
          />
        )}

        {/* Step 5: Preview */}
        {currentStep === 5 && (
          <StepPreview
            leadSequences={state.leadSequences}
            isGenerating={state.isGeneratingSequences}
            onRegenerateSequence={(leadIndex) => {
              // TODO: Regenerate single lead sequence
            }}
            onEditEmail={(leadIndex, emailIndex, subject, body) => {
              setState(prev => ({
                ...prev,
                leadSequences: prev.leadSequences.map((seq, i) => 
                  i === leadIndex ? {
                    ...seq,
                    emails: seq.emails.map((email, j) => 
                      j === emailIndex ? { ...email, subject, body } : email
                    )
                  } : seq
                )
              }));
            }}
          />
        )}

        {/* Step 6: Launch */}
        {currentStep === 6 && (
          <StepLaunch
            state={state}
            campaignName={state.campaignName}
            onNameChange={(name) => setState(prev => ({ ...prev, campaignName: name }))}
            onLaunch={launchCampaign}
            isLaunching={isLaunching}
          />
        )}
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium
              ${currentStep === 1 
                ? 'text-slate-600 cursor-not-allowed' 
                : 'text-slate-300 hover:bg-slate-700'}`}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          {currentStep < 6 ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium
                ${canProceed()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
            >
              {currentStep === 5 ? 'Confirm & Continue' : 'Continue'}
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={launchCampaign}
              disabled={!canProceed() || isLaunching}
              className={`flex items-center gap-2 px-8 py-3 rounded-lg font-medium
                ${canProceed() && !isLaunching
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
            >
              {isLaunching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Launching...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  Launch Campaign
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP COMPONENTS
// ============================================================================

function StepTarget({ 
  icpProfiles, 
  selectedICP, 
  customObjective,
  onSelectICP, 
  onObjectiveChange,
  onICPCreated
}: {
  icpProfiles: ICPProfile[];
  selectedICP: ICPProfile | null;
  customObjective: string;
  onSelectICP: (icp: ICPProfile) => void;
  onObjectiveChange: (obj: string) => void;
  onICPCreated: (icp: ICPProfile) => void;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newICP, setNewICP] = useState({
    name: '',
    description: '',
    industries: '',
    job_titles: '',
    company_sizes: '',
    locations: '',
    pain_points: ''
  });

  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateICP = async () => {
    if (!newICP.name.trim()) return;
    
    setIsCreating(true);
    setCreateError(null);
    try {
      const response = await fetch('/api/icp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newICP.name,
          description: newICP.description,
          industries: newICP.industries ? newICP.industries.split(',').map(s => s.trim()).filter(Boolean) : [],
          job_titles: newICP.job_titles ? newICP.job_titles.split(',').map(s => s.trim()).filter(Boolean) : [],
          company_sizes: newICP.company_sizes ? newICP.company_sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
          locations: newICP.locations ? newICP.locations.split(',').map(s => s.trim()).filter(Boolean) : [],
          pain_points: newICP.pain_points ? newICP.pain_points.split(',').map(s => s.trim()).filter(Boolean) : [],
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        onICPCreated(data.profile);
        onSelectICP(data.profile);
        setShowCreateForm(false);
        setNewICP({ name: '', description: '', industries: '', job_titles: '', company_sizes: '', locations: '', pain_points: '' });
      } else {
        console.error('ICP creation failed:', data);
        setCreateError(data.details || data.error || 'Failed to create ICP');
      }
    } catch (error) {
      console.error('Error creating ICP:', error);
      setCreateError('Network error - please try again');
    } finally {
      setIsCreating(false);
    }
  };

  if (showCreateForm) {
    return (
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Create New ICP</h2>
            <p className="text-slate-400">Define your ideal customer profile</p>
          </div>
          <button
            onClick={() => setShowCreateForm(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              ICP Name *
            </label>
            <input
              type="text"
              value={newICP.name}
              onChange={(e) => setNewICP({ ...newICP, name: e.target.value })}
              placeholder="e.g., Enterprise SaaS CTOs"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={newICP.description}
              onChange={(e) => setNewICP({ ...newICP, description: e.target.value })}
              placeholder="Describe your ideal customer..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Industries */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Industries
            </label>
            <input
              type="text"
              value={newICP.industries}
              onChange={(e) => setNewICP({ ...newICP, industries: e.target.value })}
              placeholder="e.g., Software, FinTech, Healthcare (comma separated)"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Job Titles */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Target Job Titles
            </label>
            <input
              type="text"
              value={newICP.job_titles}
              onChange={(e) => setNewICP({ ...newICP, job_titles: e.target.value })}
              placeholder="e.g., CTO, VP Engineering, Head of Product (comma separated)"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Company Sizes */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Company Sizes
            </label>
            <input
              type="text"
              value={newICP.company_sizes}
              onChange={(e) => setNewICP({ ...newICP, company_sizes: e.target.value })}
              placeholder="e.g., 50-200, 200-500, 500+ (comma separated)"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Locations */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Locations
            </label>
            <input
              type="text"
              value={newICP.locations}
              onChange={(e) => setNewICP({ ...newICP, locations: e.target.value })}
              placeholder="e.g., United States, United Kingdom, Canada (comma separated)"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Pain Points - for AI Strategy */}
          <div className="border-t border-slate-700 pt-5 mt-2">
            <p className="text-sm text-slate-400 mb-4">
              <Sparkles className="w-4 h-4 inline mr-1 text-yellow-400" />
              This helps AI generate better campaign strategies
            </p>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Pain Points <span className="text-slate-500">(what problems do they face?)</span>
            </label>
            <textarea
              value={newICP.pain_points}
              onChange={(e) => setNewICP({ ...newICP, pain_points: e.target.value })}
              placeholder="e.g., Slow sales cycles, High customer churn, Manual processes, Lack of visibility (comma separated)"
              rows={3}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Error Message */}
          {createError && (
            <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
              {createError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowCreateForm(false)}
              className="flex-1 px-4 py-3 text-slate-300 hover:bg-slate-700 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateICP}
              disabled={!newICP.name.trim() || isCreating}
              className={`flex-1 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2
                ${newICP.name.trim() && !isCreating
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Create ICP
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Who are you targeting?</h2>
        <p className="text-slate-400">Select your Ideal Customer Profile or create a new one</p>
      </div>

      {/* Objective Input */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Campaign Objective
        </label>
        <select
          value={customObjective}
          onChange={(e) => onObjectiveChange(e.target.value)}
          className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select an objective...</option>
          <option value="meetings">Book Meetings</option>
          <option value="demos">Schedule Demos</option>
          <option value="trials">Start Trials</option>
          <option value="sales">Close Sales</option>
        </select>
      </div>

      {/* ICP Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {icpProfiles.map((icp) => (
          <div
            key={icp.id}
            onClick={() => onSelectICP(icp)}
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all
              ${selectedICP?.id === icp.id 
                ? 'border-blue-500 bg-blue-900/30' 
                : 'border-slate-700 hover:border-slate-600 bg-slate-800'}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">{icp.name}</h3>
                <p className="text-sm text-slate-400 mt-1">{icp.description}</p>
              </div>
              {selectedICP?.id === icp.id && (
                <Check className="w-5 h-5 text-blue-400" />
              )}
            </div>
            {icp.industry && (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <Building2 className="w-4 h-4" />
                {icp.industry}
              </div>
            )}
          </div>
        ))}

        {/* Create New ICP */}
        <div
          onClick={() => setShowCreateForm(true)}
          className="p-6 rounded-xl border-2 border-dashed border-slate-600 cursor-pointer hover:border-blue-500 hover:bg-blue-900/20 transition-all flex flex-col items-center justify-center text-center"
        >
          <Plus className="w-8 h-8 text-slate-500 mb-2" />
          <span className="font-medium text-slate-300">Create New ICP</span>
          <span className="text-sm text-slate-500">Define a new target audience</span>
        </div>
      </div>
    </div>
  );
}

function StepOffer({ 
  offers, 
  selectedOffer, 
  onSelectOffer,
  onOfferCreated
}: {
  offers: Offer[];
  selectedOffer: Offer | null;
  onSelectOffer: (offer: Offer) => void;
  onOfferCreated: (offer: Offer) => void;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newOffer, setNewOffer] = useState({
    name: '',
    value_proposition: '',
    call_to_action: '',
    description: '',
    pain_points: '',
    proof_points: '',
    benefits: '',
    sales_assets: ''
  });

  const handleCreateOffer = async () => {
    if (!newOffer.name.trim() || !newOffer.value_proposition.trim() || !newOffer.call_to_action.trim()) return;
    
    setIsCreating(true);
    setCreateError(null);
    try {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newOffer.name,
          value_proposition: newOffer.value_proposition,
          call_to_action: newOffer.call_to_action,
          description: newOffer.description,
          pain_points: newOffer.pain_points ? newOffer.pain_points.split(',').map(s => s.trim()).filter(Boolean) : [],
          proof_points: newOffer.proof_points ? newOffer.proof_points.split(',').map(s => s.trim()).filter(Boolean) : [],
          benefits: newOffer.benefits ? newOffer.benefits.split(',').map(s => s.trim()).filter(Boolean) : [],
          sales_assets: newOffer.sales_assets ? newOffer.sales_assets.split(',').map(s => s.trim()).filter(Boolean) : [],
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        onOfferCreated(data.offer);
        onSelectOffer(data.offer);
        setShowCreateForm(false);
        setNewOffer({ name: '', value_proposition: '', call_to_action: '', description: '', pain_points: '', proof_points: '', benefits: '', sales_assets: '' });
      } else {
        setCreateError(data.error || 'Failed to create offer');
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      setCreateError('Network error - please try again');
    } finally {
      setIsCreating(false);
    }
  };

  if (showCreateForm) {
    return (
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Create New Offer</h2>
            <p className="text-slate-400">Define your value proposition and call-to-action</p>
          </div>
          <button
            onClick={() => setShowCreateForm(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Offer Name *
            </label>
            <input
              type="text"
              value={newOffer.name}
              onChange={(e) => setNewOffer({ ...newOffer, name: e.target.value })}
              placeholder="e.g., Free Strategy Session"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Value Proposition */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Value Proposition *
            </label>
            <textarea
              value={newOffer.value_proposition}
              onChange={(e) => setNewOffer({ ...newOffer, value_proposition: e.target.value })}
              placeholder="What value does this offer provide? e.g., Get a personalized roadmap to increase your sales by 30%"
              rows={3}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Call to Action */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Call to Action *
            </label>
            <input
              type="text"
              value={newOffer.call_to_action}
              onChange={(e) => setNewOffer({ ...newOffer, call_to_action: e.target.value })}
              placeholder="e.g., Book a 15-minute call, Schedule a demo, Get your free report"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Description (optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description <span className="text-slate-500">(optional)</span>
            </label>
            <textarea
              value={newOffer.description}
              onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
              placeholder="Additional details about this offer..."
              rows={2}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* AI Strategy Fields - Collapsible */}
          <div className="border-t border-slate-700 pt-5 mt-2">
            <p className="text-sm text-slate-400 mb-4">
              <Sparkles className="w-4 h-4 inline mr-1 text-yellow-400" />
              These fields help AI generate better campaign strategies
            </p>

            {/* Pain Points */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Pain Points <span className="text-slate-500">(problems you solve)</span>
              </label>
              <textarea
                value={newOffer.pain_points}
                onChange={(e) => setNewOffer({ ...newOffer, pain_points: e.target.value })}
                placeholder="e.g., Manual prospecting takes too much time, Low response rates, Difficulty scaling sales (comma separated)"
                rows={2}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Proof Points */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Proof Points <span className="text-slate-500">(social proof)</span>
              </label>
              <textarea
                value={newOffer.proof_points}
                onChange={(e) => setNewOffer({ ...newOffer, proof_points: e.target.value })}
                placeholder="e.g., 3x increase in leads, 90% reduction in manual tasks, ROI in 30 days (comma separated)"
                rows={2}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Benefits */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Key Benefits <span className="text-slate-500">(what they get)</span>
              </label>
              <textarea
                value={newOffer.benefits}
                onChange={(e) => setNewOffer({ ...newOffer, benefits: e.target.value })}
                placeholder="e.g., Save 10 hours/week, Reduce costs by 40%, Scale without hiring (comma separated)"
                rows={2}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Sales Assets / Lead Magnets */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Lead Magnets <span className="text-slate-500">(value offers)</span>
              </label>
              <textarea
                value={newOffer.sales_assets}
                onChange={(e) => setNewOffer({ ...newOffer, sales_assets: e.target.value })}
                placeholder="e.g., Free ROI Calculator, Industry Report, Strategy Session (comma separated)"
                rows={2}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Error Message */}
          {createError && (
            <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
              {createError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowCreateForm(false)}
              className="flex-1 px-4 py-3 text-slate-300 hover:bg-slate-700 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateOffer}
              disabled={!newOffer.name.trim() || !newOffer.value_proposition.trim() || !newOffer.call_to_action.trim() || isCreating}
              className={`flex-1 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2
                ${newOffer.name.trim() && newOffer.value_proposition.trim() && newOffer.call_to_action.trim() && !isCreating
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Create Offer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">What are you offering?</h2>
        <p className="text-slate-400">Choose the offer or value proposition for this campaign</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offers.map((offer) => (
          <div
            key={offer.id}
            onClick={() => onSelectOffer(offer)}
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all
              ${selectedOffer?.id === offer.id 
                ? 'border-blue-500 bg-blue-900/30' 
                : 'border-slate-700 hover:border-slate-600 bg-slate-800'}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-white">{offer.name}</h3>
                <p className="text-sm text-slate-400 mt-1">{offer.value_proposition}</p>
              </div>
              {selectedOffer?.id === offer.id && (
                <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />
              )}
            </div>
            <div className="mt-4 p-3 bg-slate-900 rounded-lg">
              <span className="text-xs font-medium text-slate-500 uppercase">CTA</span>
              <p className="text-sm text-slate-300 mt-1">{offer.call_to_action}</p>
            </div>
          </div>
        ))}

        {/* Create New Offer */}
        <div
          onClick={() => setShowCreateForm(true)}
          className="p-6 rounded-xl border-2 border-dashed border-slate-600 cursor-pointer hover:border-blue-500 hover:bg-blue-900/20 transition-all flex flex-col items-center justify-center text-center"
        >
          <Plus className="w-8 h-8 text-slate-500 mb-2" />
          <span className="font-medium text-slate-300">Create New Offer</span>
          <span className="text-sm text-slate-500">Define a new value proposition</span>
        </div>
      </div>
    </div>
  );
}

function StepStrategy({ 
  aiStrategy, 
  isGenerating,
  onRegenerate 
}: {
  aiStrategy: AIStrategy | null;
  isGenerating: boolean;
  onRegenerate: () => void;
}) {
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <Brain className="w-16 h-16 text-blue-400" />
          <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <h2 className="text-xl font-semibold text-white mt-6 mb-2">AI is crafting your strategy...</h2>
        <p className="text-slate-400">Analyzing your ICP and offer to build the perfect approach</p>
        <div className="mt-6 flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          <span className="text-sm text-slate-500">This usually takes 5-10 seconds</span>
        </div>
      </div>
    );
  }

  if (!aiStrategy) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Unable to generate strategy. Please try again.</p>
        <button
          onClick={onRegenerate}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Your AI-Powered Strategy</h2>
          <p className="text-slate-400">Here's what our AI recommends based on your inputs</p>
        </div>
        <button
          onClick={onRegenerate}
          className="flex items-center gap-2 px-4 py-2 text-blue-400 hover:bg-slate-800 rounded-lg"
        >
          <Sparkles className="w-4 h-4" />
          Regenerate
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Framework Card */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-900/50 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Messaging Framework</h3>
              <p className="text-sm text-slate-400">{aiStrategy.framework.name}</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">{aiStrategy.framework.description}</p>
          <div className="mt-4 p-3 bg-slate-900 rounded-lg">
            <span className="text-xs font-medium text-slate-500 uppercase">Why this works</span>
            <p className="text-sm text-slate-300 mt-1">{aiStrategy.framework.reasoning}</p>
          </div>
        </div>

        {/* Sequence Card */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-900/50 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Email Sequence</h3>
              <p className="text-sm text-slate-400">{aiStrategy.sequence.total_touches} touches, {aiStrategy.sequence.cadence}</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">{aiStrategy.sequence.reasoning}</p>
        </div>
      </div>

      {/* Insights */}
      {aiStrategy.insights && (
        <div className="space-y-4">
          {/* Pain Points */}
          {(aiStrategy.insights.painPoints?.length ?? 0) > 0 && (
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-red-400" />
                Pain Points to Address
              </h4>
              <ul className="space-y-2">
                {aiStrategy.insights.painPoints?.map((point: string, i: number) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Value Propositions */}
          {(aiStrategy.insights.valuePropositions?.length ?? 0) > 0 && (
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Value Propositions
              </h4>
              <ul className="space-y-2">
                {aiStrategy.insights.valuePropositions?.map((prop: string, i: number) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    {prop}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Proof Points */}
          {(aiStrategy.insights.proofPoints?.length ?? 0) > 0 && (
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-5 border border-blue-800/50">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Proof Points
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {aiStrategy.insights.proofPoints?.map((point: string, i: number) => (
                  <div key={i} className="text-sm text-slate-300 bg-slate-800/50 rounded-lg px-3 py-2">
                    {point}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Practices */}
          {(aiStrategy.insights.bestPractices?.length ?? 0) > 0 && (
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                Best Practices
              </h4>
              <ul className="space-y-2">
                {aiStrategy.insights.bestPractices?.map((practice: string, i: number) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-purple-400 mt-1">→</span>
                    {practice}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Messaging Hooks */}
          {(aiStrategy.insights.messagingHooks?.length ?? 0) > 0 && (
            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl p-5 border border-green-800/50">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-400" />
                Messaging Hooks
              </h4>
              <ul className="space-y-2">
                {aiStrategy.insights.messagingHooks?.map((hook: string, i: number) => (
                  <li key={i} className="text-sm text-slate-300 italic bg-slate-800/50 rounded-lg px-3 py-2">
                    "{hook}"
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepLeads({ 
  leads, 
  selectedLeads, 
  selectedICP,
  onToggleLead,
  onSelectAll,
  onDeselectAll,
  onLeadsAdded
}: {
  leads: Lead[];
  selectedLeads: Lead[];
  selectedICP: ICPProfile | null;
  onToggleLead: (lead: Lead) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onLeadsAdded?: () => void;
}) {
  // Sort leads by ICP score if available
  const sortedLeads = [...leads].sort((a, b) => (b.icp_score || 0) - (a.icp_score || 0));
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTab, setModalTab] = useState<'form' | 'csv'>('form');
  
  // Form state
  const [newLead, setNewLead] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company: '',
    title: ''
  });
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  
  // CSV state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvMapping, setCsvMapping] = useState<Record<string, string>>({});
  const [csvStep, setCsvStep] = useState(1);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [csvResult, setCsvResult] = useState<{ success: number; failed: number } | null>(null);

  const handleAddLead = async () => {
    if (!newLead.first_name || !newLead.last_name || !newLead.email || !newLead.company) {
      setAddError('Please fill in all required fields');
      return;
    }
    
    setIsAddingLead(true);
    setAddError(null);
    
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead),
      });
      
      if (response.ok) {
        setNewLead({ first_name: '', last_name: '', email: '', company: '', title: '' });
        setShowAddModal(false);
        onLeadsAdded?.();
      } else {
        const data = await response.json();
        setAddError(data.error || 'Failed to add lead');
      }
    } catch (error) {
      setAddError('Network error - please try again');
    } finally {
      setIsAddingLead(false);
    }
  };

  const handleCSVFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith('.csv')) return;
    
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) return;
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = lines.slice(1).map(line => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        for (const char of line) {
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
          else current += char;
        }
        values.push(current.trim());
        return values;
      });
      
      setCsvHeaders(headers);
      setCsvData(data);
      
      // Auto-map common column names
      const mapping: Record<string, string> = {};
      headers.forEach(h => {
        const lower = h.toLowerCase();
        if (lower.includes('first') && lower.includes('name')) mapping.first_name = h;
        else if (lower.includes('last') && lower.includes('name')) mapping.last_name = h;
        else if (lower === 'email' || lower.includes('email')) mapping.email = h;
        else if (lower === 'company' || lower.includes('company')) mapping.company = h;
        else if (lower === 'title' || lower.includes('title') || lower.includes('job')) mapping.title = h;
      });
      setCsvMapping(mapping);
      setCsvStep(2);
    };
    reader.readAsText(file);
  };

  const handleCSVUpload = async () => {
    if (!csvMapping.email || !csvMapping.first_name || !csvMapping.last_name || !csvMapping.company) return;
    
    setIsUploadingCSV(true);
    
    const leads = csvData.map(row => {
      const getVal = (field: string) => {
        const header = csvMapping[field];
        if (!header) return '';
        const idx = csvHeaders.indexOf(header);
        return idx >= 0 ? row[idx] || '' : '';
      };
      return {
        first_name: getVal('first_name'),
        last_name: getVal('last_name'),
        email: getVal('email'),
        company: getVal('company'),
        title: getVal('title')
      };
    }).filter(l => l.email && l.first_name && l.last_name && l.company);
    
    try {
      const response = await fetch('/api/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads }),
      });
      
      const data = await response.json();
      setCsvResult({ success: data.success || 0, failed: data.failed || 0 });
      setCsvStep(3);
      onLeadsAdded?.();
    } catch (error) {
      setAddError('Failed to upload leads');
    } finally {
      setIsUploadingCSV(false);
    }
  };

  const resetModal = () => {
    setShowAddModal(false);
    setModalTab('form');
    setCsvStep(1);
    setCsvFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setCsvMapping({});
    setCsvResult(null);
    setAddError(null);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Select Your Leads</h2>
          <p className="text-slate-400">
            {selectedLeads.length} of {leads.length} leads selected
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Leads
          </button>
          {leads.length > 0 && (
            <>
              <button
                onClick={onSelectAll}
                className="px-4 py-2 text-sm text-blue-400 hover:bg-slate-800 rounded-lg"
              >
                Select All
              </button>
              <button
                onClick={onDeselectAll}
                className="px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 rounded-lg"
              >
                Deselect All
              </button>
            </>
          )}
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
          <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="font-medium text-white mb-2">No leads found</h3>
          <p className="text-slate-400 mb-4">Import or add leads to get started</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Leads
          </button>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Select</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">ICP Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {sortedLeads.map((lead) => {
                const isSelected = selectedLeads.some(l => l.id === lead.id);
                return (
                  <tr
                    key={lead.id}
                    onClick={() => onToggleLead(lead)}
                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-900/30' : 'hover:bg-slate-700/50'}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-white">
                        {lead.first_name} {lead.last_name}
                      </span>
                      <br />
                      <span className="text-sm text-slate-400">{lead.email}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{lead.company}</td>
                    <td className="px-4 py-3 text-slate-300">{lead.title}</td>
                    <td className="px-4 py-3">
                      {lead.icp_score !== undefined ? (
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium
                          ${lead.icp_score >= 80 ? 'bg-green-900/50 text-green-400' :
                            lead.icp_score >= 60 ? 'bg-yellow-900/50 text-yellow-400' :
                            'bg-slate-700 text-slate-400'}`}
                        >
                          {lead.icp_score}%
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Leads Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-slate-700">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <div>
                <h2 className="text-lg font-bold text-white">Add Leads</h2>
                <p className="text-sm text-slate-400">Add leads manually or import from CSV</p>
              </div>
              <button onClick={resetModal} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700">
              <button
                onClick={() => { setModalTab('form'); setCsvStep(1); }}
                className={`flex-1 px-4 py-3 text-sm font-medium ${modalTab === 'form' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50' : 'text-slate-400 hover:text-white'}`}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add Manually
              </button>
              <button
                onClick={() => setModalTab('csv')}
                className={`flex-1 px-4 py-3 text-sm font-medium ${modalTab === 'csv' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50' : 'text-slate-400 hover:text-white'}`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Import CSV
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5">
              {/* Manual Form */}
              {modalTab === 'form' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={newLead.first_name}
                        onChange={(e) => setNewLead({ ...newLead, first_name: e.target.value })}
                        placeholder="John"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={newLead.last_name}
                        onChange={(e) => setNewLead({ ...newLead, last_name: e.target.value })}
                        placeholder="Smith"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Email *</label>
                    <input
                      type="email"
                      value={newLead.email}
                      onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                      placeholder="john@company.com"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Company *</label>
                      <input
                        type="text"
                        value={newLead.company}
                        onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                        placeholder="Acme Inc"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Job Title</label>
                      <input
                        type="text"
                        value={newLead.title}
                        onChange={(e) => setNewLead({ ...newLead, title: e.target.value })}
                        placeholder="VP of Sales"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {addError && (
                    <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {addError}
                    </div>
                  )}

                  <button
                    onClick={handleAddLead}
                    disabled={isAddingLead}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAddingLead ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {isAddingLead ? 'Adding...' : 'Add Lead'}
                  </button>
                </div>
              )}

              {/* CSV Upload */}
              {modalTab === 'csv' && (
                <div>
                  {csvStep === 1 && (
                    <div className="text-center py-8">
                      <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                      <h3 className="font-medium text-white mb-2">Upload CSV File</h3>
                      <p className="text-sm text-slate-400 mb-4">Required: First Name, Last Name, Email, Company</p>
                      <input type="file" accept=".csv" onChange={handleCSVFileSelect} className="hidden" id="csv-file" />
                      <label htmlFor="csv-file" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Select File
                      </label>
                    </div>
                  )}

                  {csvStep === 2 && (
                    <div className="space-y-4">
                      <div className="bg-slate-800 p-3 rounded-lg text-sm text-slate-300">
                        <strong>{csvData.length}</strong> leads found in <strong>{csvFile?.name}</strong>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {['first_name', 'last_name', 'email', 'company', 'title'].map(field => (
                          <div key={field}>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                              {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} {['first_name', 'last_name', 'email', 'company'].includes(field) && '*'}
                            </label>
                            <select
                              value={csvMapping[field] || ''}
                              onChange={(e) => setCsvMapping({ ...csvMapping, [field]: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                            >
                              <option value="">-- Select --</option>
                              {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleCSVUpload}
                        disabled={!csvMapping.email || !csvMapping.first_name || !csvMapping.last_name || !csvMapping.company || isUploadingCSV}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isUploadingCSV ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {isUploadingCSV ? 'Importing...' : `Import ${csvData.length} Leads`}
                      </button>
                    </div>
                  )}

                  {csvStep === 3 && csvResult && (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
                      <h3 className="font-medium text-white mb-2">Import Complete!</h3>
                      <p className="text-slate-400">
                        <strong>{csvResult.success}</strong> leads imported
                        {csvResult.failed > 0 && <span className="text-red-400"> ({csvResult.failed} failed)</span>}
                      </p>
                      <button onClick={resetModal} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Done
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepPreview({
  leadSequences,
  isGenerating,
  onRegenerateSequence,
  onEditEmail
}: {
  leadSequences: LeadSequence[];
  isGenerating: boolean;
  onRegenerateSequence: (leadIndex: number) => void;
  onEditEmail: (leadIndex: number, emailIndex: number, subject: string, body: string) => void;
}) {
  const [expandedLead, setExpandedLead] = useState<number | null>(0);
  const [editingEmail, setEditingEmail] = useState<{ leadIdx: number; emailIdx: number } | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');

  const startEditing = (leadIdx: number, emailIdx: number, subject: string, body: string) => {
    setEditingEmail({ leadIdx, emailIdx });
    setEditSubject(subject);
    setEditBody(body);
  };

  const saveEdit = () => {
    if (editingEmail) {
      onEditEmail(editingEmail.leadIdx, editingEmail.emailIdx, editSubject, editBody);
      setEditingEmail(null);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Preview Email Sequences</h2>
        <p className="text-slate-400">
          Review and edit the AI-generated emails for each lead before launching
        </p>
      </div>

      {isGenerating && leadSequences.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-800 rounded-xl border border-slate-700">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-300 font-medium">Generating personalized email sequences...</p>
          <p className="text-slate-500 text-sm mt-1">This may take a moment</p>
        </div>
      )}

      {leadSequences.length > 0 && (
        <div className="space-y-4">
          {leadSequences.map((seq, leadIdx) => (
            <div key={seq.lead.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              {/* Lead Header */}
              <button
                onClick={() => setExpandedLead(expandedLead === leadIdx ? null : leadIdx)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    {seq.lead.first_name?.[0]}{seq.lead.last_name?.[0]}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-white">{seq.lead.first_name} {seq.lead.last_name}</p>
                    <p className="text-sm text-slate-400">{seq.lead.title} at {seq.lead.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {seq.isGenerating ? (
                    <span className="flex items-center gap-2 text-blue-400 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </span>
                  ) : seq.error ? (
                    <span className="text-red-400 text-sm">{seq.error}</span>
                  ) : (
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      {seq.emails.length} emails ready
                    </span>
                  )}
                  <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedLead === leadIdx ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {/* Expanded Email Sequence */}
              {expandedLead === leadIdx && !seq.isGenerating && (
                <div className="border-t border-slate-700 p-5 space-y-4">
                  {seq.emails.map((email, emailIdx) => (
                    <div key={emailIdx} className="bg-slate-900 rounded-lg p-4 border border-slate-600">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
                          Email {email.step}
                        </span>
                        <button
                          onClick={() => startEditing(leadIdx, emailIdx, email.subject, email.body)}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Edit
                        </button>
                      </div>

                      {editingEmail?.leadIdx === leadIdx && editingEmail?.emailIdx === emailIdx ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Subject</label>
                            <input
                              type="text"
                              value={editSubject}
                              onChange={(e) => setEditSubject(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Body</label>
                            <textarea
                              value={editBody}
                              onChange={(e) => setEditBody(e.target.value)}
                              rows={6}
                              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm resize-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={saveEdit}
                              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingEmail(null)}
                              className="px-3 py-1.5 text-slate-400 text-sm hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-white mb-2">
                            Subject: {email.subject}
                          </p>
                          <p className="text-sm text-slate-300 whitespace-pre-wrap">
                            {email.body}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepLaunch({ 
  state, 
  campaignName,
  onNameChange,
  onLaunch,
  isLaunching
}: {
  state: WizardState;
  campaignName: string;
  onNameChange: (name: string) => void;
  onLaunch: () => void;
  isLaunching: boolean;
}) {
  return (
    <div className="space-y-8 pb-24">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Review & Launch</h2>
        <p className="text-slate-400">Give your campaign a name and review the details</p>
      </div>

      {/* Campaign Name */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Campaign Name *
        </label>
        <input
          type="text"
          value={campaignName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g., Q1 Enterprise Outreach, Product Launch Campaign"
          className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Summary */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-6">
        <h3 className="font-semibold text-white">Campaign Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <span className="text-sm text-slate-500">Target ICP</span>
              <p className="font-medium text-white">{state.selectedICP?.name}</p>
            </div>
            <div>
              <span className="text-sm text-slate-500">Offer</span>
              <p className="font-medium text-white">{state.selectedOffer?.name}</p>
            </div>
            <div>
              <span className="text-sm text-slate-500">Objective</span>
              <p className="font-medium text-white">
                {state.customObjective === 'meetings' ? 'Book Meetings' :
                 state.customObjective === 'demos' ? 'Schedule Demos' :
                 state.customObjective === 'trials' ? 'Start Trials' :
                 state.customObjective === 'sales' ? 'Close Sales' : 'Book Meetings'}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <span className="text-sm text-slate-500">Framework</span>
              <p className="font-medium text-white">{state.aiStrategy?.framework.name}</p>
            </div>
            <div>
              <span className="text-sm text-slate-500">Sequence</span>
              <p className="font-medium text-white">
                {state.aiStrategy?.sequence.total_touches} emails, {state.aiStrategy?.sequence.cadence}
              </p>
            </div>
            <div>
              <span className="text-sm text-slate-500">Leads</span>
              <p className="font-medium text-white">{state.selectedLeads.length} contacts selected</p>
            </div>
            <div>
              <span className="text-sm text-slate-500">Total Emails</span>
              <p className="font-medium text-white">
                {state.leadSequences.reduce((sum, seq) => sum + seq.emails.length, 0)} emails queued
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Launch Info */}
      <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl p-6 border border-green-800/50">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-green-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Rocket className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Ready to Launch</h3>
            <p className="text-slate-400 mt-1">
              Your personalized email sequences have been generated and reviewed. 
              Click Launch to start sending. Emails will be sent automatically according to the schedule.
              You can pause or adjust the campaign at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
