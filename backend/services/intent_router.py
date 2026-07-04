import os
import re
import logging
from enum import Enum
from pydantic import BaseModel, Field
from openai import OpenAI

logger = logging.getLogger(__name__)

# Setup
client = OpenAI(
    api_key=os.environ.get("QWEN_API_KEY", ""),
    base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
)

class IntentType(str, Enum):
    CASUAL_CHAT = "casual_chat"
    BUSINESS_IDEA = "business_idea"
    REFINEMENT = "refinement"
    UNKNOWN = "unknown"

class IntentResult(BaseModel):
    intent: IntentType
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str

_CASUAL_PATTERNS = (
    r"^(hi|hello|hey|yo|hiya|howdy)[!. ]*$",
    r"^(thanks|thank you|thx|appreciate it)[!. ]*$",
    r"^(who are you|what can you do)[?!. ]*$",
)

def ai_classify_intent(message: str, has_existing_chat: bool) -> IntentResult:
    system_prompt = f"""
    You are an expert semantic router for 'Genesis'.
    1. BUSINESS_IDEA: Proposing new startup/product.
    2. REFINEMENT: Adjusting existing plans. Context is {has_existing_chat}.
    3. CASUAL_CHAT: Greetings/General interaction.
    4. UNKNOWN: Irrelevant.
    Return JSON only: {IntentResult.model_json_schema()}
    """
    try:
        response = client.chat.completions.create(
            model="qwen3.5-flash",
            response_format={"type": "json_object"},
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": message}],
            temperature=0.01
        )
        return IntentResult.model_validate_json(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"LLM intent classification failed: {str(e)}")
        return IntentResult(intent=IntentType.UNKNOWN, confidence=0.0, reason="llm_failure")

def classify_intent(message: str, has_existing_chat: bool) -> IntentResult:
    text = str(message or "").strip().lower()
    if any(re.search(p, text, re.IGNORECASE) for p in _CASUAL_PATTERNS):
        return IntentResult(intent=IntentType.CASUAL_CHAT, confidence=0.99, reason="regex")
    return ai_classify_intent(message, has_existing_chat)

def casual_chat_reply(message: str) -> str:
    if any(x in message.lower() for x in ["who", "what"]):
        return "I'm Genesis, your startup blueprint workspace."
    return "I'm ready to help you brainstorm or refine your startup ideas."

def unknown_intent_reply() -> str:
    return "I can help with startup ideas, MVP planning, or refining blueprints. What would you like to work on?"
