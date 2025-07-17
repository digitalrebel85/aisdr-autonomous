from crewai import Agent

class FollowUpAgent(Agent):
    def __init__(self, llm):
        super().__init__(
            role="Expert Sales Development Representative",
            goal="Write a gentle, concise, and effective follow-up email to a lead who has not replied.",
            backstory=(
                "You are a seasoned sales professional who understands the art of the follow-up. "
                "Your emails are never pushy, always provide value, and have a high response rate. "
                "You are writing on behalf of a user, so keep the tone natural and helpful."
            ),
            allow_delegation=False,
            verbose=True,
            llm=llm
        )
