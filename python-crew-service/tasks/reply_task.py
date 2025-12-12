from crewai import Task
from schemas import AnalysisResult

class ReplyTask():
    def __init__(self, agent, lead_context, thread_history, email_reply):
        self.task = Task(
            description=(
                "Classify the lead's reply and determine what to do next.\n\n"
                f"Context:\n- Lead Reply: \"{email_reply}\"\n"
                f"- Lead Context: {lead_context}\n"
                f"- Thread History: \"{thread_history}\"\n\n"
                "IMPORTANT: You must choose ONE of these specific actions:\n"
                "- 'reply' - Send an immediate response to their question, comment, or OBJECTION (e.g., past bad experiences, concerns, skepticism)\n"
                "- 'follow_up' - Schedule a follow-up for later\n"
                "- 'schedule_call' - They want to schedule a call or meeting\n"
                "- 'not_interested' - They explicitly said NO or are clearly unqualified (e.g., 'not interested', 'remove me', 'stop emailing')\n"
                "- 'no_action' - No response needed (auto-reply, out of office, etc.)\n\n"
                "OBJECTION HANDLING: If they express concerns, past bad experiences, skepticism, or hesitation, use 'reply' to address their objections. "
                "Only use 'not_interested' for explicit rejections or clear disqualification.\n\n"
                "For the 'nextStepPrompt' field: Write the ACTUAL EMAIL CONTENT that should be sent to the lead. "
                "Do NOT write instructions like 'Send a message about...' or 'Explain how...'. "
                "Instead, write the actual email as if you are personally responding to them. "
                "Be conversational, helpful, and reference their specific question or comment.\n\n"
                "FORMATTING RULES:\n"
                "- Use proper paragraph breaks (double newlines) between distinct thoughts\n"
                "- Keep paragraphs short (2-3 sentences max)\n"
                "- Add a blank line before the sign-off\n"
                "- Structure: Opening → Main content → CTA → Sign-off\n"
                "Example format:\n"
                "Hi [Name],\n\n"
                "First paragraph here.\n\n"
                "Second paragraph here.\n\n"
                "Call to action here.\n\n"
                "Best,\n[Your name]"
            ),
            expected_output=(
                "A JSON object with keys: 'lead_id', 'sentiment', 'action', 'summary', 'nextStepPrompt'.\n"
                "The 'action' field must be exactly one of: 'reply', 'follow_up', 'schedule_call', 'not_interested', or 'no_action'.\n"
                "The 'nextStepPrompt' field must contain the ACTUAL EMAIL CONTENT to send to the lead, not instructions for what to write. "
                "Write it as if you are personally responding to the lead's email. Be conversational, helpful, and professional."
            ),
            agent=agent
        )
        self.task.output_pydantic = AnalysisResult
