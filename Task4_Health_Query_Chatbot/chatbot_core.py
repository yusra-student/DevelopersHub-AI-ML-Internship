"""
chatbot_core.py — Core logic for the General Health Query Chatbot.

Uses Hugging Face Inference API (Mistral-7B-Instruct) by default.
Switch to OpenAI GPT-3.5 by passing an openai_api_key.
"""

import json
import os
from datetime import datetime
from typing import Optional

import requests

# =============================================================================
# CONSTANTS
# =============================================================================

SYSTEM_PROMPT = (
    "You are a friendly, calm, and reassuring health information assistant. "
    "Your role is to provide general, educational health information only. "
    "You must NEVER give exact medication dosages. "
    "You must NEVER diagnose a specific medical condition. "
    "Always recommend consulting a real doctor or healthcare professional "
    "for serious, persistent, or specific medical concerns. "
    "Keep your tone simple, warm, and reassuring. "
    "Use bullet points for lists when appropriate."
)

CRISIS_KEYWORDS = [
    "self-harm", "suicide", "kill myself", "want to die", "end my life",
    "overdose", "suicidal", "self harm", "hurt myself", "take my life",
    "suicide hotline", "i want to die", "better off dead",
]

DOSAGE_KEYWORDS = [
    "how much", "dosage", "dose of", "mg of", "milligrams", "how many mg",
    "should i take", "prescribe me", "what dosage", "what dose",
]

DIAGNOSIS_KEYWORDS = [
    "diagnose", "what condition", "what disease", "do i have", "am i sick",
    "is this cancer", "is this a symptom of", "what's wrong with me",
    "why do i feel",
]

CRISIS_MESSAGE = (
    "I'm really glad you reached out. \u2764\ufe0f\n\n"
    "If you're thinking about harming yourself or are in crisis, "
    "please contact a crisis helpline immediately:\n\n"
    "\u2022 National Suicide Prevention Lifeline (US): 988\n"
    "\u2022 Crisis Text Line: Text HOME to 741741\n"
    "\u2022 International Association for Suicide Prevention:\n"
    "  https://www.iasp.info/resources/Crisis_Centres/\n\n"
    "You matter, and help is available 24/7."
)

DISCLAIMER = (
    "\n\n\u26a0\ufe0f *This is general information, not medical advice. "
    "Please consult a doctor for personal medical concerns.*"
)

HF_API_URL = (
    "https://api-inference.huggingface.co/models/"
    "mistralai/Mistral-7B-Instruct-v0.2"
)

GEMINI_MODEL = "gemini-2.0-flash-lite-001"

LOG_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "chat_logs.json",
)

WINDOW_SIZE = 4

# =============================================================================
# CONVERSATION HISTORY
# =============================================================================

conversation_history: list[dict] = []

# =============================================================================
# SAFETY FILTER
#
# Runs BEFORE the LLM API call for three reasons:
#   1. Save API costs / rate-limit budget — skip the call for clearly
#      dangerous or trivially blockable queries.
#   2. Respond instantly to crisis keywords — no waiting for model
#      inference when someone needs help right away.
#   3. Prevent the model from ever *seeing* high-risk text, reducing
#      the chance of harmful or non-compliant generation.
# =============================================================================

def safety_filter(question: str) -> tuple:
    """
    Check user question against safety rules.

    Returns (status, payload):
      - ("crisis", fixed_message)  -> skip LLM entirely
      - ("flag", [list of flags])  -> prepend reminder to prompt
      - ("safe", None)             -> proceed normally
    """
    q_lower = question.lower()

    # --- CRISIS DETECTION: immediate help, bypass LLM entirely ---
    if any(kw in q_lower for kw in CRISIS_KEYWORDS):
        return "crisis", CRISIS_MESSAGE

    # --- DOSAGE / DIAGNOSIS FLAG: inject extra guardrails into prompt ---
    flags = []
    if any(kw in q_lower for kw in DOSAGE_KEYWORDS):
        flags.append("dosage")
    if any(kw in q_lower for kw in DIAGNOSIS_KEYWORDS):
        flags.append("diagnosis")

    if flags:
        return "flag", flags

    return "safe", None

# =============================================================================
# PROMPT BUILDING
# =============================================================================

def _build_prompt(question: str, flags: Optional[list] = None) -> str:
    """Build a Mistral-7B-Instruct prompt with system prompt + history."""
    system = SYSTEM_PROMPT

    if flags:
        extra = "\n\nIMPORTANT SAFETY NOTE: The user's question "
        if "dosage" in flags:
            extra += (
                "appears to ask about medication dosages. Do NOT provide "
                "specific dosages. Explain that dosages vary per individual "
                "and must be determined by a prescribing doctor."
            )
        if "diagnosis" in flags:
            if "dosage" in flags:
                extra += " Additionally, the user"
            else:
                extra += " the user"
            extra += (
                " may be asking for a diagnosis. Do NOT diagnose. "
                "Explain that only a licensed doctor can diagnose conditions "
                "after proper examination and tests."
            )
        system = system + extra

    prompt = f"<s>[INST] {system} [/INST]</s>"

    for msg in conversation_history:
        if msg["role"] == "user":
            prompt += f"\n[INST] {msg['content']} [/INST]"
        else:
            prompt += f"\n{msg['content']}</s>"

    prompt += f"\n[INST] {question} [/INST]"

    return prompt

# =============================================================================
# LLM CALL — HUGGING FACE
# =============================================================================

def _call_hf_api(prompt: str, hf_token: Optional[str] = None) -> str:
    """Call the Hugging Face Inference API and return generated text."""
    headers = {}
    if hf_token:
        headers["Authorization"] = f"Bearer {hf_token}"

    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 512,
            "temperature": 0.7,
            "do_sample": True,
            "top_p": 0.9,
        },
    }

    resp = requests.post(HF_API_URL, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    data = resp.json()

    if isinstance(data, list) and len(data) > 0:
        return data[0].get("generated_text", "")
    if isinstance(data, dict) and "error" in data:
        raise RuntimeError(f"HF API error: {data['error']}")
    return str(data)

# =============================================================================
# LLM CALL — OPENAI (fallback)
# =============================================================================

def _call_openai_api(prompt: str, api_key: str) -> str:
    """Call the OpenAI Chat Completion API and return generated text."""
    from openai import OpenAI

    client = OpenAI(api_key=api_key)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    for msg in conversation_history:
        messages.append({
            "role": "user" if msg["role"] == "user" else "assistant",
            "content": msg["content"],
        })

    messages.append({"role": "user", "content": prompt})

    resp = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages,
        max_tokens=512,
        temperature=0.7,
    )

    return resp.choices[0].message.content or ""

# =============================================================================
# LLM CALL — GEMINI
# =============================================================================

def _build_gemini_system(flags: Optional[list] = None) -> str:
    """Build the system instruction for Gemini, with optional safety flags."""
    system = SYSTEM_PROMPT
    if flags:
        extra = "\n\nIMPORTANT SAFETY NOTE: The user's question "
        if "dosage" in flags:
            extra += (
                "appears to ask about medication dosages. Do NOT provide "
                "specific dosages. Explain that dosages vary per individual "
                "and must be determined by a prescribing doctor."
            )
        if "diagnosis" in flags:
            if "dosage" in flags:
                extra += " Additionally, the user"
            else:
                extra += " the user"
            extra += (
                " may be asking for a diagnosis. Do NOT diagnose. "
                "Explain that only a licensed doctor can diagnose conditions "
                "after proper examination and tests."
            )
        system = system + extra
    return system


def _call_gemini_api(
    question: str,
    api_key: str,
    flags: Optional[list] = None,
) -> str:
    """Call the Gemini API via google.genai SDK and return generated text."""
    import os

    from google import genai
    from google.genai.types import Content, Part, GenerateContentConfig

    # Explicit key passed — suppress any system-level GOOGLE_API_KEY
    os.environ.pop("GOOGLE_API_KEY", None)

    system = _build_gemini_system(flags)
    client = genai.Client(api_key=api_key)

    contents = []
    for msg in conversation_history:
        contents.append(
            Content(
                role="user" if msg["role"] == "user" else "model",
                parts=[Part(text=msg["content"])],
            )
        )
    contents.append(
        Content(role="user", parts=[Part(text=question)])
    )

    config = GenerateContentConfig(
        system_instruction=system,
        max_output_tokens=512,
        temperature=0.7,
        top_p=0.9,
    )

    resp = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=contents,
        config=config,
    )
    return resp.text


# =============================================================================
# EXTRACT & FORMAT RESPONSE
# =============================================================================

def _extract_reply(full_text: str, prompt: str) -> str:
    """Strip the prompt prefix from the generated text."""
    if full_text.startswith(prompt):
        return full_text[len(prompt):].strip()
    return full_text.strip()

def _format_response(raw_reply: str) -> str:
    """Apply consistent formatting and append the disclaimer footer."""
    reply = raw_reply.strip()
    if not reply:
        reply = (
            "I'm sorry, I couldn't process that. "
            "Could you rephrase your question?"
        )
    return reply + DISCLAIMER

# =============================================================================
# LOGGING
#
# Appends every question + answer + timestamp to chat_logs.json.
# Used for transparency and debugging — does not store personal data.
# =============================================================================

def _log_interaction(question: str, answer: str) -> None:
    entry = {
        "timestamp": datetime.now().isoformat(),
        "question": question,
        "answer": answer,
    }

    try:
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            logs = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        logs = []

    logs.append(entry)

    with open(LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(logs, f, indent=2, ensure_ascii=False)

# =============================================================================
# PUBLIC API
# =============================================================================

def ask_health_bot(
    user_question: str,
    hf_token: Optional[str] = None,
    openai_api_key: Optional[str] = None,
    gemini_api_key: Optional[str] = None,
) -> str:
    """
    Main entry point. Processes a health question and returns a safe response.

    Steps:
      1. Safety filter (crisis -> immediate response, no API call)
      2. Build prompt with system instructions + conversation history
      3. Call LLM (Gemini -> OpenAI -> Hugging Face, by availability)
      4. Extract and format response (append disclaimer)
      5. Log the interaction
      6. Update conversation history (sliding window)
      7. Return formatted response
    """
    # ---------------------------------------------------------------
    # Step 1: Safety filter — runs BEFORE any API call
    # ---------------------------------------------------------------
    status, result = safety_filter(user_question)

    if status == "crisis":
        _log_interaction(user_question, result)
        return result

    flags = result if status == "flag" else None

    # ---------------------------------------------------------------
    # Step 2: Build prompt (Mistral/OpenAI style)
    # ---------------------------------------------------------------
    prompt = _build_prompt(user_question, flags)

    # ---------------------------------------------------------------
    # Step 3: Call LLM (Gemini -> OpenAI -> HF, whichever key given)
    # ---------------------------------------------------------------
    try:
        if gemini_api_key:
            reply = _call_gemini_api(user_question, gemini_api_key, flags)
        elif openai_api_key:
            reply = _call_openai_api(user_question, openai_api_key)
        else:
            raw = _call_hf_api(prompt, hf_token)
            reply = _extract_reply(raw, prompt)
    except Exception as e:
        err_str = str(e)
        if "429" in err_str or "quota" in err_str.lower():
            reply = (
                "I'm currently unavailable due to high demand. "
                "Please try again in a little while. "
                "\u2764\ufe0f"
            )
        else:
            reply = (
                f"I'm sorry, I encountered an error processing your question. "
                f"Please try again later. (Error: {e})"
            )

    # ---------------------------------------------------------------
    # Step 4: Format response
    # ---------------------------------------------------------------
    formatted = _format_response(reply)

    # ---------------------------------------------------------------
    # Step 5: Log interaction
    # ---------------------------------------------------------------
    _log_interaction(user_question, formatted)

    # ---------------------------------------------------------------
    # Step 6: Update conversation history (sliding window)
    # ---------------------------------------------------------------
    conversation_history.append({"role": "user", "content": user_question})
    conversation_history.append({"role": "assistant", "content": formatted})
    while len(conversation_history) > WINDOW_SIZE:
        conversation_history.pop(0)

    # ---------------------------------------------------------------
    # Step 7: Return
    # ---------------------------------------------------------------
    return formatted


def reset_conversation() -> None:
    """Clear the conversation history."""
    conversation_history.clear()
