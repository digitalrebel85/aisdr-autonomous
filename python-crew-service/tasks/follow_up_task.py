from crewai import Task
from schemas import FollowUpResult

class FollowUpTask():
    def __init__(self, agent, lead_context, thread_history):
        self.task = Task(
            description=(
                "Generate a follow-up email for a lead who hasn't responded.\n\n"
                f"Context:\n- Lead Context: {lead_context}\n"
                f"- Thread History: \"{thread_history}\""
            ),
            expected_output=(
                "A JSON object with keys: 'subject' and 'body'."
            ),
            agent=agent
        )
        self.task.output_pydantic = FollowUpResult
