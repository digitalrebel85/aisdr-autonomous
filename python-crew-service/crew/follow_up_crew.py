from crewai import Crew, Process
from agents.follow_up_agent import FollowUpAgent
from tasks.follow_up_task import FollowUpTask

def create_follow_up_crew(llm, lead_context, thread_history):
    follow_up_agent = FollowUpAgent(llm=llm)
    follow_up_task = FollowUpTask(
        agent=follow_up_agent,
        lead_context=lead_context,
        thread_history=thread_history
    )

    return Crew(
        agents=[follow_up_agent],
        tasks=[follow_up_task.task],
        process=Process.sequential,
        verbose=True
    )
