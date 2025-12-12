from crewai import Task
from schemas import EmailCopywritingResult
import json

# Elite sequence psychology - each step has a specific purpose
SEQUENCE_PSYCHOLOGY = {
    "meetings": {
        1: {
            "purpose": "Pattern Interrupt + Pain + Unique Insight",
            "angle": "Challenge conventional thinking. Most people think X, but data shows Y.",
            "cta_style": "Curiosity-driven question, no hard ask. 'Want me to send the breakdown?'",
            "tone": "Intriguing, thought-provoking"
        },
        2: {
            "purpose": "Soft Proof + Micro-Value Drop",
            "angle": "Give ONE actionable takeaway to earn trust before asking for anything.",
            "cta_style": "Conversational. 'Worth a deeper look?' or 'If this resonates, I can share more.'",
            "tone": "Helpful, value-first"
        },
        3: {
            "purpose": "Direct Ask + Value Incentive",
            "angle": "Clear meeting request, but offer something valuable upfront. 'I'll send you X before we meet.'",
            "cta_style": "Direct but generous. Include calendar link offer.",
            "tone": "Confident, giving"
        },
        4: {
            "purpose": "Breakup with Fork in the Road",
            "angle": "Permission to close file OR offer ultra-short version. Give them two easy reply options.",
            "cta_style": "Fork: 'Reply close or send it' - makes replying easy.",
            "tone": "Respectful, no pressure"
        }
    },
    "demos": {
        1: {
            "purpose": "Visual Hook + Problem Framing",
            "angle": "Offer to show something quick (12 seconds, 1 minute). Make it tangible.",
            "cta_style": "'Can I show you in 12 seconds?' or 'Want me to send the clip?'",
            "tone": "Curious, visual"
        },
        2: {
            "purpose": "Social Proof Story + Micro-Demo",
            "angle": "Share what happened when a similar company used the solution. Before/after.",
            "cta_style": "'Worth a look?' or 'Want to see how they did it?'",
            "tone": "Story-driven, proof-focused"
        },
        3: {
            "purpose": "FOMO Demo - Personalization, Not Pressure",
            "angle": "Offer to show it on THEIR data/situation. Make it specific to them.",
            "cta_style": "'Want to see this on YOUR data?' Reply 'show me'.",
            "tone": "Personalized, exclusive"
        }
    },
    "trials": {
        1: {
            "purpose": "Risk Reversal + Desired Outcome",
            "angle": "Emphasize zero risk - runs in parallel, no migration, no commitment.",
            "cta_style": "'Want me to set up a sandbox?' Low friction ask.",
            "tone": "Safe, easy"
        },
        2: {
            "purpose": "Quickstart + 1-Minute Success Path",
            "angle": "Show exact steps to first win. Make it feel achievable in 60 seconds.",
            "cta_style": "'Want the link?' Simple yes/no.",
            "tone": "Action-oriented, quick"
        },
        3: {
            "purpose": "Trial Expiring + Soft CTA with Micro-Commitment",
            "angle": "Offer a 15-second video or ultra-quick demo. Lowest friction possible.",
            "cta_style": "Reply 'send it' for video + trial link.",
            "tone": "Last chance, but gentle"
        }
    },
    "sales": {
        1: {
            "purpose": "Insight Reframe",
            "angle": "Challenge conventional thinking. 'Everyone thinks X, but data shows Y.'",
            "cta_style": "Curiosity question. 'Curious if you've seen this at [company]?'",
            "tone": "Thought leader, challenger"
        },
        2: {
            "purpose": "Solution + Differentiator",
            "angle": "Why you vs alternatives. What makes this different from the dozen other tools.",
            "cta_style": "'Worth a quick conversation to see if it fits?'",
            "tone": "Confident, differentiated"
        },
        3: {
            "purpose": "Before/After Transformation Narrative",
            "angle": "Tell a story: company like theirs, what changed in 14 days, specific results.",
            "cta_style": "'Want me to share how they did it?'",
            "tone": "Story-driven, results-focused"
        },
        4: {
            "purpose": "Special Offer + Real Deadline",
            "angle": "Time-limited offer. 'For companies that move forward this week...'",
            "cta_style": "'Interested? Just reply and I'll send details.'",
            "tone": "Urgent but not pushy"
        },
        5: {
            "purpose": "Breakup Fork",
            "angle": "Easy opt-out + curiosity hook. Two simple reply options.",
            "cta_style": "Reply 'close' or 'short version'.",
            "tone": "Respectful, final"
        }
    }
}

PATTERN_INTERRUPTS = [
    "Quick one:",
    "This might be left-field, but...",
    "Not sure if this is relevant — tell me if it's not.",
    "Might be off-base here, but...",
    ""
]

class EmailCopywritingTask():
    def __init__(self, agent, name, title, company, pain_points, offer, hook_snippet, 
                 lead_context=None, step_number=1, total_steps=3, objective="meetings", 
                 framework="", first_name=""):
        
        # Get step-specific psychology
        obj_psychology = SEQUENCE_PSYCHOLOGY.get(objective, SEQUENCE_PSYCHOLOGY["meetings"])
        step_psychology = obj_psychology.get(step_number, obj_psychology.get(1))
        
        # Get pattern interrupt for variety
        pattern_interrupt = PATTERN_INTERRUPTS[step_number % len(PATTERN_INTERRUPTS)]
        
        # Parse lead context if provided
        context_info = ""
        if lead_context:
            try:
                lead_data = json.loads(lead_context) if isinstance(lead_context, str) else lead_context
                context_parts = []
                
                if lead_data.get('industry'):
                    context_parts.append(f"Industry: {lead_data['industry']}")
                if lead_data.get('company_size'):
                    context_parts.append(f"Company Size: {lead_data['company_size']}")
                if lead_data.get('location'):
                    context_parts.append(f"Location: {lead_data['location']}")
                if lead_data.get('company_domain'):
                    context_parts.append(f"Company Website: {lead_data['company_domain']}")
                if lead_data.get('pain_points') and isinstance(lead_data['pain_points'], list):
                    context_parts.append(f"Pain Points: {', '.join(lead_data['pain_points'])}")
                
                # Parse website analysis data for deeper personalization
                website_analysis = lead_data.get('website_analysis', {})
                if website_analysis and website_analysis.get('analysis'):
                    analysis = website_analysis['analysis']
                    context_parts.append("\n--- WEBSITE INTELLIGENCE (use for personalization) ---")
                    if analysis.get('company_description'):
                        context_parts.append(f"What They Do: {analysis['company_description']}")
                    if analysis.get('value_proposition'):
                        context_parts.append(f"Their Value Prop: {analysis['value_proposition']}")
                    if analysis.get('target_customers'):
                        context_parts.append(f"Their Target Customers: {analysis['target_customers']}")
                    if analysis.get('products_services'):
                        context_parts.append(f"Products/Services: {', '.join(analysis['products_services'][:5])}")
                    if analysis.get('pain_points_solved'):
                        context_parts.append(f"Problems They Solve: {', '.join(analysis['pain_points_solved'][:3])}")
                    if analysis.get('key_differentiators'):
                        context_parts.append(f"Their Differentiators: {', '.join(analysis['key_differentiators'][:3])}")
                    
                    # Recent news - great for pattern interrupts and opening hooks
                    if analysis.get('recent_news_or_updates'):
                        news_items = analysis['recent_news_or_updates']
                        if isinstance(news_items, list) and news_items:
                            context_parts.append(f"\n🔥 RECENT NEWS (use as opening hook or pattern interrupt):")
                            for news in news_items[:3]:
                                context_parts.append(f"  • {news}")
                            context_parts.append("TIP: Reference their recent news to show you've done research. E.g., 'Saw you just [news item] - congrats!'")
                        elif isinstance(news_items, str) and news_items:
                            context_parts.append(f"\n🔥 RECENT NEWS: {news_items}")
                            context_parts.append("TIP: Reference this to show you've done research.")
                
                # Parse company profile data
                company_profile = lead_data.get('company_profile', {})
                if company_profile and not company_profile.get('error'):
                    if company_profile.get('description'):
                        context_parts.append(f"Company Description: {company_profile['description']}")
                    if company_profile.get('techStack'):
                        context_parts.append(f"Tech Stack: {', '.join(company_profile['techStack'][:5])}")
                
                if context_parts:
                    context_info = f"\n\nLead Intelligence:\n{chr(10).join(context_parts)}"
            except (json.JSONDecodeError, TypeError):
                context_info = ""
        
        # Use first_name if available, otherwise extract from name
        display_name = first_name if first_name else name.split()[0] if name else "there"
        
        self.task = Task(
            description=f"""
            Write email #{step_number} of {total_steps} in a {objective} sequence for {display_name}, the {title} at {company}.

            === SEQUENCE CONTEXT ===
            Objective: {objective}
            This is email {step_number} of {total_steps}
            Framework: {framework if framework else 'Conversational'}
            
            === THIS EMAIL'S PURPOSE ===
            Purpose: {step_psychology['purpose']}
            Angle: {step_psychology['angle']}
            CTA Style: {step_psychology['cta_style']}
            Tone: {step_psychology['tone']}
            
            === LEAD & OFFER INFO ===
            Prospect: {display_name} ({title} at {company})
            Pain Points: {pain_points}
            Offer: {offer}
            Hook (optional): {hook_snippet}{context_info}
            
            === PATTERN INTERRUPT (use if appropriate) ===
            {pattern_interrupt if pattern_interrupt else '(No pattern interrupt for this email)'}
            
            === CRITICAL RULES ===
            1. This email MUST be DIFFERENT from other emails in the sequence
            2. Follow the PURPOSE and ANGLE above - don't just write a generic cold email
            3. Keep it SHORT - under 100 words for body
            4. Use conversational CTAs, NOT "book a call" or "schedule a meeting"
            5. If this is a breakup email (last in sequence), offer a fork: "Reply X or Y"
            6. Sound human - use contractions, be casual but professional
            7. NEVER mention internal data, lead scores, or tracking
            8. Subject line should be short (under 6 words) and curiosity-driven
            9. If RECENT NEWS is provided, USE IT! Reference their news/awards/announcements as an opening hook
               Example: "Saw you just got named Microsoft Frontier Partner for AI - congrats!"
               This shows you've done your research and makes the email feel personal
            
            === FORMATTING RULES ===
            - Use proper paragraph breaks (blank lines) between distinct thoughts
            - Keep paragraphs short (2-3 sentences max)
            - Add a blank line before the sign-off
            - Structure: Greeting → Opening → Main point → CTA → Sign-off
            - Example:
              Hi [Name],
              
              First paragraph here.
              
              Second paragraph here.
              
              CTA here.
              
              Best,
              [Your name]
            
            === OUTPUT FORMAT ===
            Return ONLY a JSON object with 'subject' and 'body' keys. No other text.
            The body MUST include proper line breaks (\\n\\n) between paragraphs.
            """,
            expected_output="A JSON object with 'subject' and 'body' keys.",
            agent=agent
        )
