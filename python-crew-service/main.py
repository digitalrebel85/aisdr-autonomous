from fastapi import FastAPI
from pydantic import BaseModel
import os

from crewai import Agent, Task, Crew, Process
from pydantic import BaseModel, Field
import os
from dotenv import load_dotenv

load_dotenv()

# Define the request body model that our Next.js app will send
class EmailContent(BaseModel):
    subject: str
    body: str

# Define the output model for the analysis
class AnalysisResult(BaseModel):
    sentiment: str = Field(description="The overall sentiment of the email (e.g., positive, negative, neutral).")
    action_required: str = Field(description="A brief description of the next action required (e.g., 'Schedule a meeting', 'Reply with pricing info', 'No action needed').")
    summary: str = Field(description="A concise one-sentence summary of the email's main point.")

# Initialize the FastAPI app
app = FastAPI(
    title="CrewAI Email Analysis Service",
    description="A service to analyze email replies using a CrewAI agent.",
)

# Define the CrewAI agent
reply_agent = Agent(
    role='Lead Email Analyst',
    goal='Analyze and classify incoming email replies to determine sentiment, required action, and a summary.',
    backstory=(
        "You are an expert AI assistant specializing in sales and customer relations. "
        "Your job is to read email replies from potential leads, understand their intent, "
        "and provide a clear, structured analysis for the sales team."
    ),
    allow_delegation=False,
    verbose=True
)

@app.post("/analyze-reply", response_model=AnalysisResult)
async def analyze_reply(email: EmailContent):
    """
    This endpoint receives email content and uses a CrewAI agent to classify it.
    """
    print(f"Received email for analysis: Subject - {email.subject}")

    # Define the analysis task
    analysis_task = Task(
        description=(
            f"Analyze the following email and provide a structured analysis. "
            f"Email Subject: {email.subject}\n\nEmail Body:\n{email.body}"
        ),
        expected_output=(
            "A JSON object containing the analysis with three keys: "
            "'sentiment', 'action_required', and 'summary'."
        ),
        agent=reply_agent,
        output_json=AnalysisResult
    )

    # Create and run the crew
    email_crew = Crew(
        agents=[reply_agent],
        tasks=[analysis_task],
        process=Process.sequential,
        verbose=2
    )

    result = email_crew.kickoff()
    return result

@app.get("/")
async def root():
    return {"message": "CrewAI Reply Analysis Service is running."}
