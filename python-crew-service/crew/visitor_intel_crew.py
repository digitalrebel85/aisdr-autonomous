from crewai import Crew, Process, Tool
from agents.visitor_intel_agent import VisitorIntelAgent
from tasks.visitor_intel_task import VisitorIntelTask
from tools.visitor_intel_tool import get_company_by_ip

def create_visitor_intel_crew(llm, ip):
    visitor_intel_agent = VisitorIntelAgent(llm=llm)
    visitor_intel_agent.tools = [Tool(func=get_company_by_ip, name="Get Company by IP")]
    
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
