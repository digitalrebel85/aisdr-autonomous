from crewai import Agent

class ReplyAgent(Agent):
    def __init__(self, llm):
        super().__init__(
            role="Reply Classifier",
            goal="Understand and classify a cold email reply, and suggest the next best step",
            backstory=(
                "You are a smart AI SDR assistant. You read email replies from leads and determine: "
                "what their response means, whether they are interested or not, and what should be done next. "
                "You use the user's offer and CTA to guide your response. Be helpful, short, and always return structured output in JSON."
            ),
            allow_delegation=False,
            verbose=True,
            llm=llm
        )
