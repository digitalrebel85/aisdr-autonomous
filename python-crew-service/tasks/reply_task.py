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
                "- 'reply' - Send an immediate response to their question or comment\n"
                "- 'follow_up' - Schedule a follow-up for later\n"
                "- 'schedule_call' - They want to schedule a call or meeting\n"
                "- 'not_interested' - They declined or are not interested\n"
                "- 'no_action' - No response needed (auto-reply, out of office, etc.)\n"
                "Do NOT use any other action types. Choose the most appropriate one from the list above."
            ),
            expected_output=(
                "A JSON object with keys: 'lead_id', 'sentiment', 'action', 'summary', 'nextStepPrompt'.\n"
                "The 'action' field must be exactly one of: 'reply', 'follow_up', 'schedule_call', 'not_interested', or 'no_action'."
            ),
            agent=agent
        )
        self.task.output_pydantic = AnalysisResult
