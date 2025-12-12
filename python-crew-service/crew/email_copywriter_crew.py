from crewai import Crew, Process
from agents.email_copywriter_agent import EmailCopywriterAgent
from tasks.email_copywriting_task import EmailCopywritingTask

def create_email_copywriter_crew(llm, name, title, company, pain_points, offer, hook_snippet, 
                                  lead_context=None, step_number=1, total_steps=3, 
                                  objective="meetings", framework="", first_name=""):
    email_writer_agent = EmailCopywriterAgent(llm=llm)

    email_task = EmailCopywritingTask(
        agent=email_writer_agent,
        name=name,
        title=title,
        company=company,
        pain_points=pain_points,
        offer=offer,
        hook_snippet=hook_snippet,
        lead_context=lead_context,
        step_number=step_number,
        total_steps=total_steps,
        objective=objective,
        framework=framework,
        first_name=first_name
    )

    return Crew(
        agents=[email_writer_agent],
        tasks=[email_task.task],
        process=Process.sequential,
        verbose=True,
        manager_llm=llm  # Explicitly set the manager LLM
    )
