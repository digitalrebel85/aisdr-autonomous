from crewai import Task
from schemas import AnalysisResult

class ReplyTask():
    def __init__(self, agent, lead_context, thread_history, email_reply):
        self.task = Task(
            description=(
                "Classify the lead's reply and determine what to do next.\n\n"
                f"Context:\n- Lead Reply: \"{email_reply}\"\n"
                f"- Lead Context: {lead_context}\n"
                f"- Thread History: \"{thread_history}\""
            ),
            expected_output=(
                "A JSON object with keys: 'lead_id', 'sentiment', 'action', 'summary', 'nextStepPrompt'."
            ),
            agent=agent
        )
        self.task.output_pydantic = AnalysisResult
