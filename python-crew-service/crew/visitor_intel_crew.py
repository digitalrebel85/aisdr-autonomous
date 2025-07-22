from crewai import Crew, Process
from crewai.tools import BaseTool
from agents.visitor_intel_agent import VisitorIntelAgent
from tasks.visitor_intel_task import VisitorIntelTask
from tools.visitor_intel_tool import get_company_by_ip

class GetCompanyByIPTool(BaseTool):
    name: str = "Get Company by IP"
    description: str = "Fetches company data based on a visitor's IP address."

    def _run(self, ip: str) -> dict:
        """Use the tool to get a company's profile by their IP address."""
        return get_company_by_ip(ip)

def create_visitor_intel_crew(llm, ip):
    visitor_intel_agent = VisitorIntelAgent(llm=llm)
    visitor_intel_agent.tools = [GetCompanyByIPTool()]
    
    visitor_intel_task = VisitorIntelTask(
        agent=visitor_intel_agent,
        ip=ip
    )

    return Crew(
        agents=[visitor_intel_agent],
        tasks=[visitor_intel_task.task],
        process=Process.sequential,
        verbose=True
    )
