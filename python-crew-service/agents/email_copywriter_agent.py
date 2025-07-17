from crewai import Agent

class EmailCopywriterAgent(Agent):
    def __init__(self, llm):
        super().__init__(
            role="Email Copywriter",
            goal="Write a high-converting, personalized cold email",
            backstory=(
                "You are an expert copywriter who specializes in cold outreach. "
                "You know how to grab attention, build rapport, and persuade prospects to take action."
            ),
            allow_delegation=False,
            verbose=True,
            llm=llm
        )
