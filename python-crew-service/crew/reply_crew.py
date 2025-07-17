from crewai import Crew, Process
from agents.reply_agent import ReplyAgent
from tasks.reply_task import ReplyTask

def create_reply_crew(llm, lead_context, thread_history, email_reply):
    reply_agent = ReplyAgent(llm=llm)
    reply_task = ReplyTask(
        agent=reply_agent,
        lead_context=lead_context,
        thread_history=thread_history,
        email_reply=email_reply
    )

    return Crew(
        agents=[reply_agent],
        tasks=[reply_task.task],
        process=Process.sequential,
        verbose=True
    )
