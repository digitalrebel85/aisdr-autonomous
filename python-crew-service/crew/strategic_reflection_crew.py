from crewai import Agent, Crew, Process, Task
from crewai.tools import BaseTool
from langchain_core.tools import tool
from tools.supabase_tools import get_campaign_performance_metrics

class CampaignMetricsTool(BaseTool):
    name: str = "Get Campaign Performance Metrics"
    description: str = "Fetches and calculates key performance metrics for email campaigns over a specified period for a user."

    def _run(self, user_id: str, days: int = 30) -> dict:
        """Use this tool to get campaign performance data."""
        return get_campaign_performance_metrics(user_id=user_id, days=days)

def create_strategic_reflection_crew(llm, user_id: str):
    """Creates and configures the strategic reflection crew."""

    # 1. Define Tools
    campaign_metrics_tool = CampaignMetricsTool()

    # 2. Define Agent
    strategist_agent = Agent(
        role='Senior Marketing Strategist',
        goal='Analyze email campaign performance and provide actionable, data-driven recommendations for improvement.',
        backstory=(
            "You are an expert marketing strategist with a deep understanding of data analytics and email marketing. "
            "You specialize in interpreting performance metrics to uncover strategic insights and guide teams toward better engagement and conversion rates."
        ),
        tools=[campaign_metrics_tool],
        llm=llm,
        verbose=True,
        allow_delegation=False
    )

    # 3. Define Task
    analysis_task = Task(
        description=(
            f"1. Use the 'Get Campaign Performance Metrics' tool to fetch the latest 30-day performance data for the user with ID: '{user_id}'."
            "2. Analyze the retrieved metrics (open rate, reply rate, bounce rate, sentiment breakdown)."
            "3. Provide a concise summary of the key findings."
            "4. Generate a bulleted list of 3-5 specific, actionable recommendations to improve future campaign performance."
        ),
        expected_output=(
            "A JSON object containing two keys: "
            "'summary': A brief, insightful summary of the campaign performance. "
            "'recommendations': A list of strings, where each string is a concrete recommendation."
        ),
        agent=strategist_agent
    )

    # 4. Create Crew
    strategic_crew = Crew(
        agents=[strategist_agent],
        tasks=[analysis_task],
        process=Process.sequential,
        verbose=True
    )

    return strategic_crew
