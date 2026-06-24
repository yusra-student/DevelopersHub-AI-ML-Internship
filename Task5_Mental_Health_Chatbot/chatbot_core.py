import re
import torch
from pathlib import Path
from transformers import AutoTokenizer, AutoModelForCausalLM

MODEL_DIR = Path(__file__).parent / "model" / "fine_tuned_model"
FALLBACK_MODEL = "distilgpt2"

CRISIS_PATTERNS = [
    r"\b(kill myself|end my life|commit suicide|suicide|take my own life)\b",
    r"\b(self[- ]harm|harm myself|cutting|hurt myself)\b",
    r"\b(don'?t want to live|wanna die|better off dead)\b",
    r"\b(988|crisis line|suicide hotline)\b",
]

CRISIS_RESPONSE = (
    "I hear how much pain you're in, and I'm really glad you reached out. "
    "Please know that you don't have to go through this alone — there are people "
    "who care and want to help.\n\n"
    "**National Suicide & Crisis Lifeline: 988** (call or text, 24/7)\n"
    "**Crisis Text Line: Text HOME to 741741**\n\n"
    "Please reach out to one of these resources right now. They have trained "
    "counselors who can support you through this moment."
)

def detect_crisis(text):
    for pattern in CRISIS_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False

def load_model():
    if MODEL_DIR.exists() and any(MODEL_DIR.iterdir()):
        model_path = str(MODEL_DIR)
        print(f"Loading fine-tuned model from {model_path}")
    else:
        model_path = FALLBACK_MODEL
        print(f"No fine-tuned model found, loading base {model_path}")

    tokenizer = AutoTokenizer.from_pretrained(model_path)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(model_path)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = model.to(device)
    model.eval()

    return model, tokenizer, device

def generate_response(model, tokenizer, device, prompt, max_new_tokens=100):
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            pad_token_id=tokenizer.eos_token_id,
        )
    full = tokenizer.decode(outputs[0], skip_special_tokens=True)
    response = full[len(prompt):].strip()
    return response

def format_chat_prompt(context, user_message):
    if context:
        return f"Context: {context}\nUser: {user_message}\nResponse:"
    return f"User: {user_message}\nResponse:"
