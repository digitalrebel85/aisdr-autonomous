from crewai import Task
from schemas import EmailCopywritingResult

class EmailCopywritingTask():
    def __init__(self, agent, name, title, company, pain_points, offer, hook_snippet):
        self.task = Task(
            description=f"""
            Write a personalized cold email to {name}, the {title} at {company}.
            The prospect's pain points are: {pain_points}
            The offer is: {offer}
            Use this hook snippet to start the email: {hook_snippet}
            """,
            expected_output="A JSON object with keys: 'subject' and 'body'.",
            agent=agent
        )
        self.task.output_pydantic = EmailCopywritingResult
