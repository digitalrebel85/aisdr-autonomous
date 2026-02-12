from crewai import Task
from schemas import EmailCopywritingResult
import json

# R.P.I.C Framework for Email 1 (2025 cold email best practices)
RPIC_FRAMEWORK_TEMPLATE = """
=== R.P.I.C FRAMEWORK (Email 1 ONLY) ===
You are an outbound SDR writing cold emails in 2025.

Structure your email using R.P.I.C:
1. Role Reality: Describe a REAL pressure for this role at this company size
   USE THESE PAIN POINTS: {pain_points}
   
2. Pattern Insight: State an industry-level pattern (NEVER claim inside knowledge)
   
3. Intervention: Explain how the product replaces or simplifies an existing workflow
   USE THESE BENEFITS: {benefits}
   
4. Credible Use Case: Describe how similar teams use it
   USE THESE PROOF POINTS: {proof_points}

STRICT RULES:
- No hype, no emojis, no buzzwords
- No feature lists
- Short paragraphs (1-2 lines each)
- End with a soft, permission-based CTA: {cta}
- Write like a human operator, NOT an AI
- Maximum 120 words total
- NEVER use these terms: {excluded_terms}
"""

# Email 3 Breakup Framework (Final sign-off email)
EMAIL3_BREAKUP_FRAMEWORK = """
=== EMAIL 3 BREAKUP FRAMEWORK (Final Email ONLY) ===
You are writing Email #3 in a 3-email cold outbound sequence in 2025.
This is the final sign-off email.

PURPOSE:
- Close the loop politely
- Create a low-pressure decision moment
- Invite a reply without chasing or selling
- Get a response by offering the prospect control, not urgency

MANDATORY RULES:
- Do NOT pitch the offer again
- Do NOT restate value or pain
- Do NOT introduce new information
- Do NOT sound frustrated or passive-aggressive
- Do NOT ask multiple open-ended questions
- Do NOT mention sequences, follow-ups, or reminders
- Do NOT use hype, emojis, or sales language

STRUCTURE (must follow exactly):
1. Acknowledgement
   - Briefly note lack of response without blame
   - Neutral, calm tone

2. Assumption of non-priority
   - Politely assume this isn't a focus right now
   - Make it safe to disengage

3. Binary choice
   - Offer exactly TWO clear options
   - One option continues the conversation
   - One option closes it

4. Permission-based close
   - Reassure them either option is fine

WRITING STYLE:
- Short, Human, Senior
- Confident but not pushy
- Maximum 90 words

BINARY CHOICE EXAMPLES (choose ONE pattern):
- "Should I share a quick example, or leave this here?"
- "Is it worth a short chat, or should I close the loop?"
- "Want me to send one example, or leave this for now?"
"""

# Elite sequence psychology - each step has a specific purpose
# Note: "framework": "RPIC" or "BREAKUP" flags are used to inject the appropriate framework dynamically
SEQUENCE_PSYCHOLOGY = {
    "meetings": {
        1: {
            "purpose": "R.P.I.C Framework - Role Reality + Pattern Insight + Intervention + Credible Use Case",
            "angle": "Start with a real pressure for their role/company size. State an industry pattern (not inside knowledge). Show how the product simplifies a workflow. Reference how similar teams use it.",
            "cta_style": "Soft, permission-based. 'Worth a look?' or 'Open to seeing how?' - never pushy",
            "tone": "Human operator, conversational, no hype",
            "framework": "RPIC"
        },
        2: {
            "purpose": "Soft Proof + Micro-Value Drop",
            "angle": "Give ONE actionable takeaway to earn trust before asking for anything.",
            "cta_style": "Conversational. 'Worth a deeper look?' or 'If this resonates, I can share more.'",
            "tone": "Helpful, value-first"
        },
        3: {
            "purpose": "Breakup - Final Sign-off",
            "angle": "Close the loop politely. Binary choice: continue or close. No pitch, no value restatement.",
            "cta_style": "Binary: 'Should I share a quick example, or leave this here?'",
            "tone": "Respectful, no pressure, human",
            "framework": "BREAKUP",
            "max_words": 90
        },
        4: {
            "purpose": "Breakup with Fork in the Road",
            "angle": "Permission to close file OR offer ultra-short version. Give them two easy reply options.",
            "cta_style": "Fork: 'Reply close or send it' - makes replying easy.",
            "tone": "Respectful, no pressure",
            "framework": "BREAKUP",
            "max_words": 90
        }
    },
    "demos": {
        1: {
            "purpose": "R.P.I.C Framework - Role Reality + Pattern Insight + Intervention + Credible Use Case",
            "angle": "Start with a real pressure for their role/company size. State an industry pattern. Show how a quick demo simplifies their workflow. Reference how similar teams use it.",
            "cta_style": "Soft, permission-based. 'Worth a quick look?' or 'Can I show you in 60 seconds?'",
            "tone": "Human operator, conversational, no hype",
            "framework": "RPIC"
        },
        2: {
            "purpose": "Social Proof Story + Micro-Demo",
            "angle": "Share what happened when a similar company used the solution. Before/after.",
            "cta_style": "'Worth a look?' or 'Want to see how they did it?'",
            "tone": "Story-driven, proof-focused"
        },
        3: {
            "purpose": "Breakup - Final Sign-off",
            "angle": "Close the loop politely. Binary choice: continue or close. No pitch, no value restatement.",
            "cta_style": "Binary: 'Is it worth a short chat, or should I close the loop?'",
            "tone": "Respectful, no pressure, human",
            "framework": "BREAKUP",
            "max_words": 90
        }
    },
    "trials": {
        1: {
            "purpose": "R.P.I.C Framework - Role Reality + Pattern Insight + Intervention + Credible Use Case",
            "angle": "Start with a real pressure for their role/company size. State an industry pattern. Show how a trial simplifies their workflow with zero risk. Reference how similar teams use it.",
            "cta_style": "Soft, permission-based. 'Worth trying?' or 'Want me to set up a sandbox?'",
            "tone": "Human operator, conversational, no hype",
            "framework": "RPIC"
        },
        2: {
            "purpose": "Quickstart + 1-Minute Success Path",
            "angle": "Show exact steps to first win. Make it feel achievable in 60 seconds.",
            "cta_style": "'Want the link?' Simple yes/no.",
            "tone": "Action-oriented, quick"
        },
        3: {
            "purpose": "Breakup - Final Sign-off",
            "angle": "Close the loop politely. Binary choice: continue or close. No pitch, no value restatement.",
            "cta_style": "Binary: 'Want me to send one example, or leave this for now?'",
            "tone": "Respectful, no pressure, human",
            "framework": "BREAKUP",
            "max_words": 90
        }
    },
    "sales": {
        1: {
            "purpose": "R.P.I.C Framework - Role Reality + Pattern Insight + Intervention + Credible Use Case",
            "angle": "Start with a real pressure for their role/company size. State an industry pattern. Show how the solution simplifies their workflow. Reference how similar teams use it.",
            "cta_style": "Soft, permission-based. 'Worth exploring?' or 'Curious if this resonates?'",
            "tone": "Human operator, conversational, no hype",
            "framework": "RPIC"
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
            "purpose": "Breakup - Final Sign-off",
            "angle": "Close the loop politely. Binary choice: continue or close. No pitch, no value restatement.",
            "cta_style": "Binary: 'Should I share a quick example, or leave this here?'",
            "tone": "Respectful, no pressure, human",
            "framework": "BREAKUP",
            "max_words": 90
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
        # Variables for R.P.I.C framework
        rpic_pain_points = pain_points  # Default to passed pain_points
        rpic_benefits = ""
        rpic_proof_points = ""
        rpic_cta = "Worth a quick look?"
        rpic_excluded_terms = ""
        
        if lead_context:
            try:
                lead_data = json.loads(lead_context) if isinstance(lead_context, str) else lead_context
                context_parts = []
                
                # === EXTRACT R.P.I.C DATA FROM OFFER ENRICHMENT ===
                
                # Pain points for Role Reality (combine offer + lead pain points)
                offer_pain_points = lead_data.get('offer_pain_points', [])
                lead_pain_points = lead_data.get('lead_pain_points', [])
                all_pain_points = []
                if isinstance(offer_pain_points, list):
                    all_pain_points.extend(offer_pain_points)
                if isinstance(lead_pain_points, list):
                    all_pain_points.extend(lead_pain_points)
                if all_pain_points:
                    rpic_pain_points = ', '.join(all_pain_points[:5])  # Top 5 pain points
                
                # Proof points for Credible Use Case
                proof_points_list = lead_data.get('proof_points', [])
                if isinstance(proof_points_list, list) and proof_points_list:
                    rpic_proof_points = ', '.join(proof_points_list[:3])  # Top 3 proof points
                
                # Benefits for Intervention
                benefits_list = lead_data.get('benefits', [])
                if isinstance(benefits_list, list) and benefits_list:
                    rpic_benefits = ', '.join(benefits_list[:3])  # Top 3 benefits
                
                # CTA from offer
                if lead_data.get('offer_call_to_action'):
                    rpic_cta = lead_data['offer_call_to_action']
                
                # Excluded terms
                excluded_terms_list = lead_data.get('excluded_terms', [])
                if isinstance(excluded_terms_list, list) and excluded_terms_list:
                    rpic_excluded_terms = ', '.join(excluded_terms_list)
                
                # Lead magnets / sales assets with URLs
                sales_assets = lead_data.get('sales_assets', [])
                if isinstance(sales_assets, list) and sales_assets:
                    asset_parts = []
                    for asset in sales_assets:
                        if isinstance(asset, dict) and asset.get('name'):
                            url_part = f" → {asset['url']}" if asset.get('url') else ""
                            type_part = f" ({asset.get('type', 'resource')})" if asset.get('type') else ""
                            asset_parts.append(f"{asset['name']}{type_part}{url_part}")
                        elif isinstance(asset, str) and asset:
                            asset_parts.append(asset)
                    if asset_parts:
                        context_parts.append(f"\n📎 LEAD MAGNETS (offer one of these as value-add):")
                        for ap in asset_parts:
                            context_parts.append(f"  • {ap}")
                        if step_number == 1:
                            context_parts.append("RULE: This is the FIRST email. Do NOT include any links or URLs. Just mention the lead magnet by name and offer to send it. E.g., 'I put together a quick [name] for teams like yours — want me to send it over?'")
                        else:
                            context_parts.append("TIP: Include the actual link in the email. E.g., 'Here's the [name] I mentioned: [url]'")
                
                # === LEAD INTELLIGENCE FOR PERSONALIZATION ===
                
                if lead_data.get('industry'):
                    context_parts.append(f"Industry: {lead_data['industry']}")
                if lead_data.get('company_size'):
                    context_parts.append(f"Company Size: {lead_data['company_size']}")
                if lead_data.get('location'):
                    context_parts.append(f"Location: {lead_data['location']}")
                if lead_data.get('company_domain'):
                    context_parts.append(f"Company Website: {lead_data['company_domain']}")
                
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
        
        # Determine which framework to use based on step_psychology
        framework_type = step_psychology.get('framework', '')
        step_framework = ""
        max_words = step_psychology.get('max_words', 120)  # Default 120, breakup uses 90
        
        if framework_type == "RPIC":
            # Build R.P.I.C framework with actual enriched data (for email 1)
            step_framework = RPIC_FRAMEWORK_TEMPLATE.format(
                pain_points=rpic_pain_points or "general role pressures",
                benefits=rpic_benefits or "workflow simplification",
                proof_points=rpic_proof_points or "similar companies have seen results",
                cta=rpic_cta,
                excluded_terms=rpic_excluded_terms or "none specified"
            )
        elif framework_type == "BREAKUP":
            # Use Email 3 Breakup framework for final sign-off emails
            step_framework = EMAIL3_BREAKUP_FRAMEWORK
        
        self.task = Task(
            description=f"""
            Write email #{step_number} of {total_steps} in a {objective} sequence for {display_name}, the {title} at {company}.

            {step_framework}

            === SEQUENCE CONTEXT ===
            Objective: {objective}
            This is email {step_number} of {total_steps}
            
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
            
            === CRITICAL RULES ===
            1. This email MUST be DIFFERENT from other emails in the sequence
            2. Follow the PURPOSE and ANGLE above - don't just write a generic cold email
            3. Keep it SHORT - Maximum {max_words} words for body (STRICT LIMIT)
            4. Use soft, permission-based CTAs - NOT "book a call" or "schedule a meeting"
            5. If this is a breakup email (last in sequence), offer a BINARY choice: "Reply X or Y"
            6. Sound human - write like a human operator, NOT an AI
            7. NEVER mention internal data, lead scores, or tracking
            8. Subject line should be short (under 6 words) and curiosity-driven
            9. NO hype, NO emojis, NO buzzwords, NO feature lists
            10. Short paragraphs only (1-2 lines each)
            
            === FORMATTING RULES ===
            - Use proper paragraph breaks (blank lines) between distinct thoughts
            - Keep paragraphs SHORT (1-2 lines max)
            - Add a blank line before the sign-off
            {"- For BREAKUP emails: Acknowledgement → Assumption of non-priority → Binary choice → Permission close" if framework_type == "BREAKUP" else "- Structure: Greeting → Role Reality → Pattern Insight → Intervention → Use Case → Soft CTA → Sign-off"}
            - Example for {"BREAKUP" if framework_type == "BREAKUP" else "R.P.I.C"}:
              Hi [Name],
              
              {"[Brief acknowledgement - no blame]" if framework_type == "BREAKUP" else "[Role Reality - 1-2 lines about their pressure]"}
              
              {"[Assume non-priority - make it safe to disengage]" if framework_type == "BREAKUP" else "[Pattern Insight - industry-level observation]"}
              
              {"[Binary choice - exactly TWO options]" if framework_type == "BREAKUP" else "[Intervention + Use Case - how similar teams use it]"}
              
              {"[Permission close - either option is fine]" if framework_type == "BREAKUP" else "[Soft CTA]"}
              
              Best,
              [Your name]
            
            === OUTPUT FORMAT ===
            Return ONLY a JSON object with 'subject' and 'body' keys. No other text.
            The body MUST include proper line breaks (\\n\\n) between paragraphs.
            """,
            expected_output="A JSON object with 'subject' and 'body' keys.",
            agent=agent
        )
