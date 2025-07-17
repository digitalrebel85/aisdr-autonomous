from crewai import Task
from schemas import VisitorIntelResponse

class VisitorIntelTask():
    def __init__(self, agent, ip):
        self.task = Task(
            description=f"Identify the company associated with the IP address: {ip}",
            expected_output="A JSON object with keys: 'companyName' and 'companyDomain'. If no company is found, return JSON with null values.",
            agent=agent
        )
        self.task.output_pydantic = VisitorIntelResponse
