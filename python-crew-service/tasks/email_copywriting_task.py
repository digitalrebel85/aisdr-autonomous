from crewai import Task
from schemas import EmailCopywritingResult
import json

class EmailCopywritingTask():
    def __init__(self, agent, name, title, company, pain_points, offer, hook_snippet, lead_context=None):
        # Parse lead context if provided
        context_info = ""
        if lead_context:
            try:
                lead_data = json.loads(lead_context) if isinstance(lead_context, str) else lead_context
                context_parts = []
                
                # Add enriched data context
                if lead_data.get('industry'):
                    context_parts.append(f"Industry: {lead_data['industry']}")
                if lead_data.get('company_size'):
                    context_parts.append(f"Company Size: {lead_data['company_size']}")
                if lead_data.get('location'):
                    context_parts.append(f"Location: {lead_data['location']}")
                if lead_data.get('linkedin_url'):
                    context_parts.append(f"LinkedIn: {lead_data['linkedin_url']}")
                if lead_data.get('phone'):
                    context_parts.append(f"Phone: {lead_data['phone']}")
                if lead_data.get('company_domain'):
                    context_parts.append(f"Company Website: {lead_data['company_domain']}")
                
                # Add AI-identified pain points if available
                if lead_data.get('pain_points') and isinstance(lead_data['pain_points'], list):
                    context_parts.append(f"AI-Identified Pain Points: {', '.join(lead_data['pain_points'])}")
                
                # Add any additional enriched data
                if lead_data.get('enriched_data'):
                    enriched = lead_data['enriched_data']
                    if isinstance(enriched, dict):
                        # Handle CSV custom fields
                        if 'csv_upload' in enriched and 'custom_fields' in enriched['csv_upload']:
                            custom_fields = enriched['csv_upload']['custom_fields']
                            for field_name, field_value in custom_fields.items():
                                if field_value:
                                    context_parts.append(f"{field_name.replace('_', ' ').title()}: {field_value}")
                        
                        # Handle other enriched data sources
                        for key, value in enriched.items():
                            if key not in ['name', 'email', 'company', 'title', 'csv_upload'] and value:
                                if isinstance(value, dict):
                                    # Handle nested objects (like API responses)
                                    for sub_key, sub_value in value.items():
                                        if sub_key not in ['name', 'email', 'company', 'title'] and sub_value:
                                            context_parts.append(f"{sub_key.replace('_', ' ').title()}: {sub_value}")
                                else:
                                    context_parts.append(f"{key.replace('_', ' ').title()}: {value}")
                
                if context_parts:
                    context_info = f"\n\nAdditional Lead Intelligence:\n{chr(10).join(context_parts)}"
            except (json.JSONDecodeError, TypeError):
                # Fallback if JSON parsing fails
                context_info = f"\n\nAdditional Context: {lead_context}"
        
        self.task = Task(
            description=f"""
            Write a personalized cold email to {name}, the {title} at {company}.
            The prospect's pain points are: {pain_points}
            The offer is: {offer}
            Use this hook snippet to start the email: {hook_snippet}{context_info}

            IMPORTANT INSTRUCTIONS:
            - NEVER mention internal data like lead scores, marketing sources, or tracking data - the prospect doesn't know about these
            - Use custom fields to understand their business context, but don't reference the data directly
            - If custom data suggests they work in SEO, mention SEO challenges generally, not "your SEO data shows..."
            - Focus on their likely challenges based on their role/industry, not on data they never shared with you
            - Keep the tone professional but conversational
            - Make it sound like you researched their company publicly, not like you have internal tracking data
            
            Your final answer MUST be a JSON object with keys 'subject' and 'body'.
            """,
            expected_output="A JSON object with the email's subject and body.",
            agent=agent
        )
